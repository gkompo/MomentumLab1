from sqlalchemy import Boolean, Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    subscription_plan = Column(String, default="free")
    
    simulations = relationship("SimulationHistory", back_populates="owner")

class SimulationHistory(Base):
    __tablename__ = "simulations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    strategy_type = Column(String)
    lookback_period = Column(Integer)
    rebalance_frequency = Column(String)
    portfolio_size = Column(Integer)
    universe = Column(String)
    initial_capital = Column(Float)
    start_date = Column(String)
    end_date = Column(String)
    dca_amount = Column(Float)
    dca_frequency = Column(String)
    leverage = Column(Float)
    transaction_cost_pct = Column(Float)
    slippage_pct = Column(Float)
    weighting_scheme = Column(String)
    absolute_momentum_threshold = Column(String, default="zero")
    enable_monte_carlo = Column(Boolean, default=False)
    enable_walk_forward = Column(Boolean, default=False)
    
    selected_securities = Column(Text)
    portfolio_metrics = Column(Text) 
    portfolio_values = Column(Text)
    name = Column(String, nullable=True)

    owner = relationship("User", back_populates="simulations")
