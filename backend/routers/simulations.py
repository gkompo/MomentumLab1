from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json
from .. import models, schemas, auth, database
from ..engine.backtest import run_backtest

router = APIRouter(prefix="/simulations", tags=["simulations"])

from fastapi import BackgroundTasks
import uuid
import time

# In-memory dictionary to track long-running simulation progress
# Production apps would use Redis/Celery
simulation_jobs = {}

def run_simulation_task(job_id: str, sim: schemas.SimulationCreate, current_user: models.User, db: Session):
    try:
        simulation_jobs[job_id]["status"] = "Running engine..."
        simulation_jobs[job_id]["progress"] = 25
        
        # Run the simulation using the core engine
        results = run_backtest(
            strategy_type=sim.strategy_type,
            lookback_months=sim.lookback_period,
            rebalance_frequency=sim.rebalance_frequency,
            portfolio_size=sim.portfolio_size,
            universe_str=sim.universe,
            initial_capital=sim.initial_capital,
            start_date=sim.start_date,
            end_date=sim.end_date,
            dca_amount=sim.dca_amount,
            dca_frequency=sim.dca_frequency,
            leverage=sim.leverage,
            transaction_cost_pct=sim.transaction_cost_pct,
            slippage_pct=sim.slippage_pct,
            weighting_scheme=sim.weighting_scheme
        )
        
        simulation_jobs[job_id]["status"] = "Processing telemetry..."
        simulation_jobs[job_id]["progress"] = 75
        
        # Dump metrics to string for storing
        sim.portfolio_metrics = json.dumps(results.get('metrics', {}))
        sim.selected_securities = json.dumps(results['trade_history'][-1]['securities'] if results.get('trade_history') else [])
        
        # Serialize the equity curve dict, handling Pandas Timestamps as string keys
        str_values = {str(k): v for k, v in results.get('portfolio_values', {}).items()}
        sim.portfolio_values = json.dumps(str_values)

        sim_dump = sim.model_dump()
        if sim_dump.get('name') is None:
            sim_dump.pop('name', None)
            
        db_sim = models.SimulationHistory(
            owner=current_user,
            **sim_dump
        )
        db.add(db_sim)
        db.commit()
        db.refresh(db_sim)
        
        # Attach advanced datasets only to the ephemeral runtime payload (too large for SQLite)
        if sim.enable_monte_carlo and 'monte_carlo' in results:
            db_sim.__dict__['monte_carlo'] = json.dumps(results['monte_carlo'])
        if sim.enable_walk_forward and 'walk_forward' in results:
            db_sim.__dict__['walk_forward'] = json.dumps(results['walk_forward'])
        if 'robustness' in results:
            db_sim.__dict__['robustness'] = results['robustness']
            
        simulation_jobs[job_id]["status"] = "Completed"
        simulation_jobs[job_id]["progress"] = 100
        # Instead of a Pydantic object, return the parsed DB dict
        out_dict = db_sim.__dict__.copy()
        out_dict.pop('_sa_instance_state', None)
        simulation_jobs[job_id]["result"] = out_dict
        
    except Exception as e:
        print(f"Simulation Error: {e}")
        simulation_jobs[job_id]["status"] = "Failed"
        simulation_jobs[job_id]["error"] = str(e)


@router.post("/run")
def execute_and_save_simulation(
    sim: schemas.SimulationCreate, 
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    job_id = str(uuid.uuid4())
    simulation_jobs[job_id] = {"status": "Starting", "progress": 0, "result": None}
    
    # Run heavy computation in background
    background_tasks.add_task(run_simulation_task, job_id, sim, current_user, db)
    
    return {"job_id": job_id, "message": "Simulation started in background"}

@router.get("/status/{job_id}")
def get_simulation_status(job_id: str, current_user: models.User = Depends(auth.get_current_user)):
    if job_id not in simulation_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return simulation_jobs[job_id]

from pydantic import BaseModel

class SaveSimulationRequest(BaseModel):
    name: str

@router.post("/save/{id}")
def save_simulation_name(id: int, req: SaveSimulationRequest, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    sim = db.query(models.SimulationHistory).filter(models.SimulationHistory.id == id, models.SimulationHistory.user_id == current_user.id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    # We will add a name field to the model if it's missing, or store it in the db. 
    # For now, let's assume models.py has `name = Column(String)`.
    if hasattr(sim, 'name'):
        sim.name = req.name
        db.commit()
    
    return {"message": "Saved"}

@router.post("/top-picks")
def get_top_picks_today(
    sim: schemas.SimulationCreate, 
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Returns the exact tickers that the strategy would select RIGHT NOW
    based on the current market close data.
    """
    try:
        from ..engine.data_fetcher import resolve_universe, get_historical_data
        from ..engine.momentum import calculate_momentum_returns, relative_momentum, absolute_momentum, dual_momentum
        import datetime
        import pandas as pd
        
        tickers = resolve_universe(sim.universe)
        
        # We only need the lookback period + padding
        end_date = datetime.datetime.today().strftime('%Y-%m-%d')
        start_lookback = (datetime.datetime.today() - pd.DateOffset(months=sim.lookback_period + 1)).strftime('%Y-%m-%d')
        
        needs_volume = sim.weighting_scheme.lower() == "market_cap"
        
        if needs_volume:
            fetch_result = get_historical_data(tickers, start_lookback, end_date, return_volume=True)
            if isinstance(fetch_result, tuple):
                prices, volume = fetch_result
            else:
                prices = fetch_result
                volume = pd.DataFrame() # fallback
        else:
            prices = get_historical_data(tickers, start_lookback, end_date, return_volume=False)
            volume = None
            
        prices.ffill(inplace=True)
        prices.bfill(inplace=True)
        if volume is not None and not volume.empty:
            volume.ffill(inplace=True)
            volume.bfill(inplace=True)
        
        if prices.empty:
            return {"picks": []}
            
        mom_returns = calculate_momentum_returns(prices, sim.lookback_period)
        
        threshold = 0.0
        if sim.absolute_momentum_threshold.lower() == "risk_free":
            threshold = 0.04 * (sim.lookback_period / 12.0)
            
        if sim.strategy_type.lower() == 'relative':
            selected = relative_momentum(mom_returns, sim.portfolio_size)
        elif sim.strategy_type.lower() == 'absolute':
            selected = absolute_momentum(mom_returns, threshold).head(sim.portfolio_size)
        else: # dual
            selected = dual_momentum(mom_returns, sim.portfolio_size, threshold)
            
        weights = {}
        if not selected.empty:
            if sim.weighting_scheme.lower() == "momentum":
                scores = selected[selected.index]
                raw_weights = scores.clip(lower=0.0001)
                wt_series = raw_weights / raw_weights.sum()
            elif sim.weighting_scheme.lower() == "market_cap" and volume is not None and not volume.empty:
                vol_slice = volume.loc[start_lookback:end_date, selected.index].tail(30).mean()
                prc_slice = prices.loc[start_lookback:end_date, selected.index].tail(30).mean()
                proxy_cap = prc_slice * vol_slice
                proxy_cap = proxy_cap.clip(lower=0.0001)
                wt_series = proxy_cap / proxy_cap.sum()
            else:
                wt_series = pd.Series(1.0 / len(selected), index=selected.index)
                
            for ticker, wt in wt_series.items():
                weights[ticker] = float(wt)
                
        # Format for frontend {"picks": [{"ticker": "AAPL", "weight": 0.15}, ...]}
        picks_list = [{"ticker": k, "weight": v} for k, v in weights.items()]
            
        return {"picks": picks_list}
    except Exception as e:
        print(f"Top Picks Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
        
@router.get("/", response_model=List[schemas.SimulationResponse])
def get_simulations(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    sims = db.query(models.SimulationHistory).filter(models.SimulationHistory.user_id == current_user.id).order_by(models.SimulationHistory.created_at.desc()).all()
    return sims

@router.get("/{id}", response_model=schemas.SimulationResponse)
def get_simulation_by_id(id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    sim = db.query(models.SimulationHistory).filter(models.SimulationHistory.id == id, models.SimulationHistory.user_id == current_user.id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return sim
