import os
import json
import requests

def upload():
    print("=== Uploading Pipeline Outputs to Next.js API ===")
    
    # API Configurations
    api_url = os.environ.get("PRICING_INTEL_UPLOAD_API_URL", "https://app-sales.vercel.app/api/pricing-intel/upload")
    api_key = os.environ.get("PRICING_INTEL_API_KEY", "default_pricing_intel_pipeline_api_key")

    payload = {}

    # 1. Aligned Prices CSV
    if os.path.exists("oilchem_aligned_prices.csv"):
        print("Reading oilchem_aligned_prices.csv...")
        with open("oilchem_aligned_prices.csv", "r", encoding="utf-8") as f:
            payload["aligned_prices_csv"] = f.read()

    # 2. Lead Lag CSV
    if os.path.exists("oilchem_lead_lag_results.csv"):
        print("Reading oilchem_lead_lag_results.csv...")
        with open("oilchem_lead_lag_results.csv", "r", encoding="utf-8") as f:
            payload["lead_lag_csv"] = f.read()

    # 3. Forecasts JSON
    if os.path.exists("oilchem_financial_forecasts.json"):
        print("Reading oilchem_financial_forecasts.json...")
        with open("oilchem_financial_forecasts.json", "r", encoding="utf-8") as f:
            payload["forecasts_json"] = json.load(f)

    # 4. Backtests JSON
    if os.path.exists("oilchem_backtest_results.json"):
        print("Reading oilchem_backtest_results.json...")
        with open("oilchem_backtest_results.json", "r", encoding="utf-8") as f:
            payload["backtests_json"] = json.load(f)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(api_url, json=payload, headers=headers)
        if response.status_code == 200:
            print("Successfully uploaded all outputs to the database via API!")
        else:
            print(f"Failed to upload. Status code: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Error calling upload API: {e}")

if __name__ == "__main__":
    upload()
