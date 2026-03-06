import requests
import json
import time

BASE_URL = "http://localhost:8001"

def test_flow():
    print("1. Registering new user...")
    email = f"test_{int(time.time())}@example.com"
    res = requests.post(f"{BASE_URL}/users/register", json={
        "email": email,
        "password": "password123"
    })
    print(f"Register status: {res.status_code}")
    
    print("2. Logging in...")
    res = requests.post(f"{BASE_URL}/users/login", data={
        "username": email,
        "password": "password123"
    })
    print(f"Login status: {res.status_code}")
    token = res.json().get("access_token")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("3. Running simulation (Absolute Momentum)...")
    payload = {
        "strategy_type": "absolute",
        "lookback_period": 3,
        "rebalance_frequency": "monthly",
        "portfolio_size": 5,
        "universe": "sp500",
        "initial_capital": 100000.0,
        "start_date": "2022-01-01",
        "end_date": "2024-01-01",
        "dca_amount": 1000.0,
        "dca_frequency": "monthly",
        "leverage": 1.0,
        "transaction_cost_pct": 0.001,
        "slippage_pct": 0.001,
        "weighting_scheme": "equal",
        "enable_monte_carlo": False,
        "enable_walk_forward": False,
        "selected_securities": None,
        "portfolio_metrics": None,
        "portfolio_values": None,
        "name": None
    }
    
    res = requests.post(f"{BASE_URL}/simulations/run", json=payload, headers=headers)
    print(f"Simulation startup status: {res.status_code}")
    
    if res.status_code == 200:
        job_id = res.json()['job_id']
        print(f"Started Job: {job_id}")
        
        while True:
            status_res = requests.get(f"{BASE_URL}/simulations/status/{job_id}", headers=headers)
            status_data = status_res.json()
            print(f"Progress: {status_data['progress']}% - {status_data['status']}")
            
            if status_data['status'] == "Completed":
                result = status_data['result']
                print("Simulation successful! Metrics:")
                metrics = json.loads(result['portfolio_metrics'])
                print(json.dumps(metrics, indent=2))
                break
            elif status_data['status'] == "Failed":
                print(f"FAILED: {status_data['error']}")
                break
                
            time.sleep(1)
    else:
        print(f"Error: {res.text}")

if __name__ == "__main__":
    test_flow()
