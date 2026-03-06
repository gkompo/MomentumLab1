import pandas as pd
import numpy as np

def calculate_momentum_returns(prices: pd.DataFrame, lookback_months: int) -> pd.Series:
    """
    Calculate momentum returns over a specified lookback window.
    prices: DataFrame of adjusted close prices, index is datetime, columns are tickers.
    Returns: Series of returns with index as tickers
    """
    if len(prices) == 0:
        return pd.Series(dtype=float)

    # Calculate returns over the lookback period
    # Assuming daily frequency (approx 21 trading days per month)
    lookback_days = lookback_months * 21
    
    if len(prices) < lookback_days:
        return pd.Series(dtype=float)

    start_prices = prices.iloc[-lookback_days]
    end_prices = prices.iloc[-1]
    
    returns = (end_prices / start_prices) - 1
    return returns

def relative_momentum(returns: pd.Series, top_n: int) -> pd.Series:
    """
    Ranks securities by performance and selects top N performers.
    """
    return returns.sort_values(ascending=False).head(top_n)

def absolute_momentum(returns: pd.Series, threshold: float = 0.0) -> pd.Series:
    """
    Filters securities that have returns greater than the threshold over the lookback window.
    """
    return returns[returns > threshold]

def dual_momentum(returns: pd.Series, top_n: int, threshold: float = 0.0) -> pd.Series:
    """
    Combines both: positive absolute momentum and highest relative momentum ranking.
    """
    abs_mom = absolute_momentum(returns, threshold)
    return relative_momentum(abs_mom, top_n)
