from pydantic import BaseModel
from typing import Optional, List, Any
import datetime

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    subscription_plan: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class SimulationBase(BaseModel):
    strategy_type: str
    lookback_period: int
    rebalance_frequency: str
    portfolio_size: int
    universe: str
    initial_capital: float
    start_date: str
    end_date: str
    dca_amount: float
    dca_frequency: str
    leverage: float
    transaction_cost_pct: float
    slippage_pct: float
    weighting_scheme: str
    absolute_momentum_threshold: str = "zero"
    enable_monte_carlo: bool
    enable_walk_forward: bool
    # Attach advanced datasets only to the ephemeral runtime payload (too large for SQLite)
    selected_securities: Optional[str] = None
    portfolio_metrics: Optional[str] = None
    portfolio_values: Optional[str] = None
    name: Optional[str] = None

class SimulationCreate(SimulationBase):
    pass

class SimulationResponse(SimulationBase):
    id: int
    user_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True
