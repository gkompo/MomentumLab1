import pandas as pd
import yfinance as yf
import requests
from bs4 import BeautifulSoup
import io

import warnings
from io import StringIO
warnings.simplefilter(action='ignore', category=FutureWarning)

def get_sp500_tickers():
    csv_url = "https://datahub.io/core/s-and-p-500-companies/r/constituents.csv"
    try:
        sp500 = pd.read_csv(csv_url)
        tickers = [t.replace('.', '-') for t in sp500['Symbol'].tolist()]
        return tickers
    except Exception as e:
        print(f"Error fetching SP500 from datahub: {e}. Falling back to Wikipedia.")
        url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
        html = requests.get(url).text
        dfs = pd.read_html(StringIO(html))
        return dfs[0]['Symbol'].str.replace('.', '-').tolist()

def get_nasdaq100_tickers():
    url = "https://www.slickcharts.com/nasdaq100"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        r = requests.get(url, headers=headers, timeout=15)
        r.raise_for_status()
        tables = pd.read_html(StringIO(r.text))
        tickers = None
        for t in tables:
            candidate_cols = [c for c in t.columns if 'symbol' in str(c).lower()]
            if candidate_cols:
                tickers = t[candidate_cols[0]].dropna().astype(str).tolist()
                break
        if tickers:
            tickers = [t.replace(".", "-") for t in tickers]
            return list(dict.fromkeys(tickers))
        return []
    except Exception as e:
        print(f"Error fetching NASDAQ100 from slickcharts: {e}. Returning fallback list.")
        return ['AAPL', 'MSFT', 'AMZN', 'NVDA', 'META', 'TSLA', 'GOOGL', 'GOOG', 'AVGO', 'PEP']

def get_sp400_tickers():
    url = "https://en.wikipedia.org/wiki/List_of_S%26P_400_companies"
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(url, headers=headers, timeout=15)
        dfs = pd.read_html(StringIO(r.text))
        # The SP400 table usually has a 'Ticker symbol' or 'Symbol' column
        df = dfs[0]
        col = 'Ticker symbol' if 'Ticker symbol' in df.columns else 'Symbol'
        tickers = df[col].str.replace('.', '-').tolist()
        return list(dict.fromkeys(tickers))
    except Exception as e:
        print(f"Error fetching SP400 from wiki: {e}")
        return []

def get_sp600_tickers():
    url = "https://en.wikipedia.org/wiki/List_of_S%26P_600_companies"
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(url, headers=headers, timeout=15)
        dfs = pd.read_html(StringIO(r.text))
        # Usually the first table
        col = 'Ticker symbol' if 'Ticker symbol' in dfs[0].columns else 'Symbol'
        tickers = dfs[0][col].str.replace('.', '-').tolist()
        return list(dict.fromkeys(tickers))
    except Exception as e:
        print(f"Error fetching SP600 from wiki: {e}")
        return []

def get_historical_data(tickers, start_date, end_date, return_volume=False):
    """
    Download historical adjusted close prices for a list of tickers.
    """
    try:
        data = yf.download(tickers, start=start_date, end=end_date, progress=False, group_by='ticker')
        
        # yfinance behavior: if multiple tickers, it returns a MultiIndex column.
        # if single ticker, it returns a flat DataFrame.
        if isinstance(data.columns, pd.MultiIndex):
            # Extract only the 'Close' prices for each ticker
            close_prices = data.xs('Close', level=1, axis=1)
            # Drop tickers with no data at all (e.g. delisted)
            close_prices.dropna(axis=1, how='all', inplace=True)
            if return_volume:
                volume = data.xs('Volume', level=1, axis=1)
                volume = volume[close_prices.columns]
                return close_prices, volume
            return close_prices
        else:
            if return_volume:
                return data[['Close']], data[['Volume']]
            return data[['Close']]
    except Exception as e:
        print(f"Error downloading data: {e}")
        return pd.DataFrame()
