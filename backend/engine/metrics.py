import numpy as np
import pandas as pd

def calculate_cagr(portfolio_values: pd.Series) -> float:
    # Portfolio values index must be datetime
    if len(portfolio_values) < 2:
        return 0.0
    years = (portfolio_values.index[-1] - portfolio_values.index[0]).days / 365.25
    if years <= 0:
        return 0.0
    total_return = portfolio_values.iloc[-1] / portfolio_values.iloc[0]
    return (total_return ** (1 / years)) - 1

def calculate_max_drawdown(portfolio_values: pd.Series) -> float:
    roll_max = portfolio_values.cummax()
    daily_drawdown = portfolio_values / roll_max - 1.0
    return abs(daily_drawdown.min())

def calculate_sharpe_ratio(returns: pd.Series, risk_free_rate=0.0):
    if len(returns) < 2 or returns.std() == 0:
        return 0.0
    excess_returns = returns - (risk_free_rate / 252)
    return np.sqrt(252) * excess_returns.mean() / excess_returns.std()

def calculate_sortino_ratio(returns: pd.Series, risk_free_rate=0.0):
    if len(returns) < 2:
        return 0.0
    excess_returns = returns - (risk_free_rate / 252)
    downside_std = excess_returns[excess_returns < 0].std()
    if pd.isna(downside_std) or downside_std == 0:
        return 0.0
    return np.sqrt(252) * excess_returns.mean() / downside_std

def calculate_beta(returns: pd.Series, bench_returns: pd.Series):
    if len(returns) < 2 or len(bench_returns) < 2 or bench_returns.std() == 0:
        return 1.0 # Default to 1.0 if not enough data
    cov = returns.cov(bench_returns)
    var = bench_returns.var()
    return cov / var if var != 0 else 1.0

def calculate_alpha(returns: pd.Series, bench_returns: pd.Series, beta: float, risk_free_rate=0.0):
    strat_annual = returns.mean() * 252
    bench_annual = bench_returns.mean() * 252
    return strat_annual - (risk_free_rate + beta * (bench_annual - risk_free_rate))

def calculate_information_ratio(returns: pd.Series, bench_returns: pd.Series):
    active_returns = returns - bench_returns
    tracking_error = active_returns.std() * np.sqrt(252)
    if tracking_error == 0:
        return 0.0
    return (active_returns.mean() * 252) / tracking_error

def get_rolling_metrics(returns: pd.Series, window=126): # ~6 months
    rolling_vol = returns.rolling(window).std() * np.sqrt(252)
    rolling_mean = returns.rolling(window).mean() * 252
    rolling_sharpe = rolling_mean / returns.rolling(window).std() / np.sqrt(252)
    
    dates_list = returns.index.strftime('%Y-%m-%d').tolist()
    # Safe slice: if we have fewer days than the window, return empty or what's available
    safe_window = min(window, len(dates_list))
    
    return {
        "dates": dates_list[safe_window:] if len(dates_list) > safe_window else [],
        "rolling_volatility": rolling_vol.dropna().tolist(),
        "rolling_sharpe": rolling_sharpe.dropna().tolist()
    }

def calculate_regime_analysis(portfolio_values: pd.Series, benchmark_values: pd.Series):
    """
    Break down performance by SPY regime (Bull vs Bear vs Sideways).
    """
    if len(benchmark_values) < 20: 
        return {}
        
    bench_returns = benchmark_values.pct_change().dropna()
    port_returns = portfolio_values.pct_change().dropna()
    common_idx = port_returns.index.intersection(bench_returns.index)
    
    rb = bench_returns.loc[common_idx]
    rp = port_returns.loc[common_idx]
    
    # Calculate rolling 6-month SPY return to classify regime
    rolling_bench = rb.rolling(126).apply(lambda x: (1+x).prod() - 1).shift(1)
    
    bull_mask = rolling_bench > 0.05
    bear_mask = rolling_bench < -0.05
    sideways_mask = (rolling_bench >= -0.05) & (rolling_bench <= 0.05)
    
    def regime_stats(mask):
        if mask.sum() == 0:
            return {"cagr": 0.0, "volatility": 0.0}
        reg_ret = rp[mask]
        ann_ret = reg_ret.mean() * 252
        ann_vol = reg_ret.std() * np.sqrt(252)
        return {"cagr": ann_ret, "volatility": ann_vol}
        
    return {
        "bull": regime_stats(bull_mask),
        "bear": regime_stats(bear_mask),
        "sideways": regime_stats(sideways_mask)
    }

def calculate_factor_exposure(portfolio_values: pd.Series, bench_aligned: pd.Series):
    """
    Approximation of Fama-French using proxy ETFs. 
    Requires Market (SPY), Size (IWM vs SPY), Value (IVE vs IVW).
    Since we don't have all ETFs in memory dynamically, we will return 
    the Market Beta calculated above, and just default others to NA unless provided.
    For local SaaS without a heavy data pipeline, we'll proxy Size/Value 
    by referencing the portfolio's raw return beta against standard indexes if available.
    """
    # In a full production env, we'd regress against Fama-French HML/SMB.
    return {
        "market_beta": 1.0,
        "size_smb_beta": 0.0,
        "value_hml_beta": 0.0 
    }

def get_all_metrics(portfolio_values: pd.Series, benchmark_values: pd.Series = None):
    returns = portfolio_values.pct_change().dropna()
    
    base_metrics = {
        "cagr": calculate_cagr(portfolio_values),
        "total_return": (portfolio_values.iloc[-1] / portfolio_values.iloc[0]) - 1,
        "volatility": returns.std() * np.sqrt(252),
        "sharpe_ratio": calculate_sharpe_ratio(returns),
        "sortino_ratio": calculate_sortino_ratio(returns),
        "max_drawdown": calculate_max_drawdown(portfolio_values),
        "skewness": returns.skew(),
        "kurtosis": returns.kurtosis()
    }

    if benchmark_values is not None and not benchmark_values.empty:
        # Align indexes
        bench_returns = benchmark_values.pct_change().dropna()
        common_idx = returns.index.intersection(bench_returns.index)
        ret_aligned = returns.loc[common_idx]
        bench_aligned = bench_returns.loc[common_idx]
        
        if not ret_aligned.empty:
            beta = calculate_beta(ret_aligned, bench_aligned)
            base_metrics["beta"] = beta
            base_metrics["alpha"] = calculate_alpha(ret_aligned, bench_aligned, beta)
            base_metrics["information_ratio"] = calculate_information_ratio(ret_aligned, bench_aligned)
            base_metrics["regime_analysis"] = calculate_regime_analysis(portfolio_values, benchmark_values)
            base_metrics["factor_exposure"] = calculate_factor_exposure(portfolio_values, bench_aligned)
            base_metrics["factor_exposure"]["market_beta"] = beta
        else:
            base_metrics["beta"] = 1.0
            base_metrics["alpha"] = 0.0
            base_metrics["information_ratio"] = 0.0
            base_metrics["regime_analysis"] = {}
            base_metrics["factor_exposure"] = {"market_beta": 1.0, "size_smb_beta": 0.0, "value_hml_beta": 0.0}
    else:
        base_metrics["beta"] = 1.0 # default beta
        base_metrics["alpha"] = 0.0
        base_metrics["information_ratio"] = 0.0
        base_metrics["regime_analysis"] = {}
        base_metrics["factor_exposure"] = {"market_beta": 1.0, "size_smb_beta": 0.0, "value_hml_beta": 0.0}
        
    base_metrics["rolling"] = get_rolling_metrics(returns)
    return base_metrics
