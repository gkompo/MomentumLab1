import pandas as pd
import numpy as np
import datetime
from .momentum import calculate_momentum_returns, relative_momentum, absolute_momentum, dual_momentum
from .metrics import get_all_metrics
from ..services.data_fetcher import get_historical_data, get_sp500_tickers, get_nasdaq100_tickers, get_sp400_tickers, get_sp600_tickers

def resolve_universe(universe_str: str):
    if universe_str.lower() == "sp500":
        return get_sp500_tickers()
    elif universe_str.lower() == "sp400":
        return get_sp400_tickers()
    elif universe_str.lower() == "sp600":
        return get_sp600_tickers()
    elif universe_str.lower() == "nasdaq100":
        return get_nasdaq100_tickers()
    elif universe_str.lower() == "sp1500":
        return list(set(get_sp500_tickers() + get_sp400_tickers() + get_sp600_tickers()))
    else:
        # Default combination
        return list(set(get_sp500_tickers() + get_sp400_tickers() + get_sp600_tickers() + get_nasdaq100_tickers()))

def run_backtest(
    strategy_type: str,
    lookback_months: int,
    rebalance_frequency: str, # "monthly", "quarterly"
    portfolio_size: int,
    universe_str: str,
    initial_capital: float,
    start_date: str = "2010-01-01",
    end_date: str = None,
    dca_amount: float = 0.0,
    dca_frequency: str = "monthly", # "monthly", "yearly"
    leverage: float = 1.0,
    transaction_cost_pct: float = 0.001, # 0.1% per trade
    slippage_pct: float = 0.001, # 0.1% per trade
    weighting_scheme: str = "equal", # "equal", "momentum", "market_cap"
    absolute_momentum_threshold: str = "zero"
):
    if not end_date:
        end_date = datetime.datetime.today().strftime('%Y-%m-%d')
    
    tickers = resolve_universe(universe_str)
    
    # Ensure SPY is in tickers to use as a baseline benchmark
    if "SPY" not in tickers:
        fetch_tickers = tickers + ["SPY"]
    else:
        fetch_tickers = tickers
        
    needs_volume = weighting_scheme.lower() == "market_cap"
    
    if needs_volume:
        fetch_result = get_historical_data(fetch_tickers, start_date, end_date, return_volume=True)
        if isinstance(fetch_result, tuple):
            prices, volume = fetch_result
        else:
            prices = fetch_result
            volume = pd.DataFrame() # fallback if empty
    else:
        prices = get_historical_data(fetch_tickers, start_date, end_date, return_volume=False)
        volume = None
        
    if prices.empty:
        raise ValueError("Could not fetch price data.")
    
    prices.ffill(inplace=True)
    prices.bfill(inplace=True)
    if volume is not None and not volume.empty:
        volume.ffill(inplace=True)
        volume.bfill(inplace=True)
    
    # Extract benchmark
    if "SPY" in prices.columns:
        benchmark_prices = prices["SPY"]
    else:
        # Fallback if SPY somehow fails
        benchmark_prices = prices.iloc[:, 0]
        
    # Remove SPY from tradable universe if it wasn't originally requested
    if "SPY" not in tickers:
        tradable_prices = prices.drop(columns=["SPY"], errors="ignore")
        if volume is not None and not volume.empty:
            volume = volume.drop(columns=["SPY"], errors="ignore")
    else:
        tradable_prices = prices
    
    # Generate Rebalance Dates
    if rebalance_frequency.lower() == "monthly":
        freq = "ME" # Month End
    else:
        freq = "QE" # Quarter End
        
    rebalance_dates = tradable_prices.resample(freq).last().index
    
    # Generate DCA Dates
    if dca_frequency.lower() == "monthly":
        dca_dates = tradable_prices.resample("ME").last().index
    else:
        dca_dates = tradable_prices.resample("YE").last().index

    portfolio_values = pd.Series(index=tradable_prices.index, dtype=float)
    portfolio_values.iloc[0] = initial_capital
    current_capital = initial_capital
    
    positions = pd.Series(dtype=float)
    trade_history = []
    
    for i in range(1, len(tradable_prices.index)):
        current_date = tradable_prices.index[i]
        prev_date = tradable_prices.index[i-1]
        
        # Dollar Cost Averaging Injection
        if dca_amount > 0 and current_date in dca_dates:
            current_capital += dca_amount
            # Distribute new capital into current positions proportionally
            if not positions.empty:
                positions *= (current_capital / (current_capital - dca_amount))

        # Calculate daily return of current portfolio
        if not positions.empty:
            daily_returns = tradable_prices.loc[current_date, positions.index] / tradable_prices.loc[prev_date, positions.index] - 1
            # Apply Leverage to the daily return
            leveraged_returns = daily_returns * leverage
            portfolio_return = (positions * leveraged_returns).sum() / current_capital
            current_capital *= (1 + portfolio_return)
        
        portfolio_values.iloc[i] = current_capital
        
        # Check if rebalance day
        if current_date in rebalance_dates:
            # We need lookback data
            start_lookback = current_date - pd.DateOffset(months=lookback_months)
            lookback_prices = tradable_prices.loc[start_lookback:current_date]
            
            if not lookback_prices.empty and (current_date - lookback_prices.index[0]).days > (lookback_months * 20): # Ensure enough data
                mom_returns = calculate_momentum_returns(lookback_prices, lookback_months)
                
                if strategy_type.lower() == 'relative':
                    selected = relative_momentum(mom_returns, portfolio_size)
                else:
                    # Calculate threshold
                    threshold = 0.0
                    if absolute_momentum_threshold.lower() == "risk_free":
                        # Assume roughly 4% annualized risk-free rate proxy
                        threshold = 0.04 * (lookback_months / 12.0)
                        
                    if strategy_type.lower() == 'absolute':
                        selected = absolute_momentum(mom_returns, threshold).head(portfolio_size)
                    else: # dual
                        selected = dual_momentum(mom_returns, portfolio_size, threshold)
                
                # Calculate target weights
                if not selected.empty:
                    if weighting_scheme.lower() == "momentum":
                        # Weight proportional to momentum score
                        scores = selected[selected.index]
                        raw_weights = scores.clip(lower=0.0001) 
                        weights = raw_weights / raw_weights.sum()
                    elif weighting_scheme.lower() == "market_cap" and volume is not None and not volume.empty:
                        # Proxy for market cap: Volume * Price (30 day average)
                        vol_slice = volume.loc[start_lookback:current_date, selected.index].tail(30).mean()
                        prc_slice = tradable_prices.loc[start_lookback:current_date, selected.index].tail(30).mean()
                        proxy_cap = prc_slice * vol_slice
                        proxy_cap = proxy_cap.clip(lower=0.0001)
                        weights = proxy_cap / proxy_cap.sum()
                    else:
                        # Equal weight (default or fallback)
                        weights = pd.Series(1.0 / len(selected), index=selected.index)
                        
                    target_positions = weights * current_capital
                    
                    # Calculate Turnover and Frictions
                    if not positions.empty:
                        # Find overlapping and changed positions
                        all_tickers = set(positions.index).union(set(target_positions.index))
                        turnover = 0.0
                        for t in all_tickers:
                            old_val = positions.get(t, 0.0)
                            new_val = target_positions.get(t, 0.0)
                            turnover += abs(new_val - old_val)
                            
                        # Apply friction to the turnover amount
                        friction_cost = turnover * (transaction_cost_pct + slippage_pct)
                        current_capital -= friction_cost
                        
                        # Recalculate positions after friction
                        target_positions = weights * current_capital
                    else:
                        # Initial deployment
                        friction_cost = current_capital * (transaction_cost_pct + slippage_pct)
                        current_capital -= friction_cost
                        target_positions = weights * current_capital

                    positions = target_positions
                else:
                    # Move to cash (100% turnover if we had positions)
                    if not positions.empty:
                        turnover = positions.sum()
                        friction_cost = turnover * (transaction_cost_pct + slippage_pct)
                        current_capital -= friction_cost
                        positions = pd.Series(dtype=float)
                
                trade_history.append({
                    "date": current_date.strftime('%Y-%m-%d'),
                    "securities": selected.index.tolist() if not selected.empty else [],
                    "portfolio_value": current_capital
                })

    # Align benchmark for metrics
    bench_aligned = benchmark_prices.loc[portfolio_values.index]
    metrics = get_all_metrics(portfolio_values, bench_aligned)
    
    # --- Monte Carlo Bootstrap (100 paths of resampled daily returns) ---
    daily_equity_returns = portfolio_values.pct_change().dropna()
    mc_days = len(daily_equity_returns)
    mc_paths = 100
    mc_results = np.zeros((mc_paths, mc_days))
    
    for i in range(mc_paths):
        # Resample with replacement
        resampled_returns = np.random.choice(daily_equity_returns, size=mc_days, replace=True)
        # Reconstruct path
        path = initial_capital * np.cumprod(1 + resampled_returns)
        mc_results[i, :] = path
        
    # Calculate percentiles
    p5 = np.percentile(mc_results, 5, axis=0)
    p50 = np.percentile(mc_results, 50, axis=0)
    p95 = np.percentile(mc_results, 95, axis=0)
    
    monte_carlo = {
        "dates": portfolio_values.index[1:].strftime('%Y-%m-%d').tolist(),
        "p5": p5.tolist(),
        "p50": p50.tolist(),
        "p95": p95.tolist()
    }
    
    # --- Walk-Forward Validation (Simple 50/50 IS/OOS Split) ---
    wfo_results = {}
    total_days = len(portfolio_values)
    if total_days > 252 * 2: # At least 2 years of data required for a meaningful split
        split_idx = total_days // 2
        
        is_curve = portfolio_values.iloc[:split_idx]
        oos_curve = portfolio_values.iloc[split_idx:]
        
        # Normalize OOS curve to start where IS ended for a continuous graph visual
        # or normalize to 100 to show pure OOS growth. We'll send raw and let frontend decide.
        is_metrics = get_all_metrics(is_curve, bench_aligned.iloc[:split_idx])
        oos_metrics = get_all_metrics(oos_curve, bench_aligned.iloc[split_idx:])
        
        wfo_results = {
            "split_date": portfolio_values.index[split_idx].strftime('%Y-%m-%d'),
            "in_sample_metrics": is_metrics,
            "out_of_sample_metrics": oos_metrics
        }
    
    # --- Robustness / Stress Testing ---
    # Start Date Sensitivity (Sample 10 random start dates in the first half of the dataset and calc CAGR to the end)
    stress_cagrs = []
    if total_days > 252 * 2:
        for _ in range(10):
            rand_start_idx = np.random.randint(0, total_days // 2)
            curve_slice = portfolio_values.iloc[rand_start_idx:]
            # basic CAGR calc
            if len(curve_slice) > 252:
                yrs = (curve_slice.index[-1] - curve_slice.index[0]).days / 365.25
                ret = curve_slice.iloc[-1] / curve_slice.iloc[0]
                stress_cagrs.append((ret ** (1/yrs)) - 1)
                
    cagr_p5 = np.percentile(stress_cagrs, 5) if stress_cagrs else metrics["cagr"]
    cagr_p95 = np.percentile(stress_cagrs, 95) if stress_cagrs else metrics["cagr"]
    
    robustness = {
        "immediate_20pct_crash_value": float(portfolio_values.iloc[-1] * 0.8),
        "cagr_from_random_starts_p5": float(cagr_p5),
        "cagr_from_random_starts_p95": float(cagr_p95)
    }
    
    return {
        "portfolio_values": portfolio_values.dropna().to_dict(),
        "trade_history": trade_history,
        "metrics": metrics,
        "monte_carlo": monte_carlo,
        "walk_forward": wfo_results,
        "robustness": robustness
    }
