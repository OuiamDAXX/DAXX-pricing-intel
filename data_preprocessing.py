import pandas as pd
import numpy as np
import os
import sys
import time
import datetime
import requests

# Reconfigure stdout to use UTF-8 to avoid encoding crashes on Windows consoles
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = r"c:\Documents\A4\Satge\Prediction des prix\OilChem"
INPUT_CSV = os.path.join(BASE_DIR, "oilchem_all_data.csv")
OUTPUT_CSV = os.path.join(BASE_DIR, "oilchem_aligned_prices.csv")
OUTPUT_EXCEL = os.path.join(BASE_DIR, "oilchem_aligned_prices.xlsx")

print("==================================================")
print("[START] DATA PREPROCESSING & GLOBAL BENCHMARKS")
print("==================================================")

if not os.path.exists(INPUT_CSV):
    print(f"[ERROR] Input file not found: {INPUT_CSV}")
    sys.exit(1)

# Helper function for portable path finding
def find_local_file(rel_path, abs_path):
    if os.path.exists(abs_path):
        return abs_path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    portable_path = os.path.normpath(os.path.join(script_dir, rel_path))
    if os.path.exists(portable_path):
        return portable_path
    return None

# 1. Load data
print("1. Loading raw OilChem dataset...")
df = pd.read_csv(INPUT_CSV, low_memory=False)
print(f"   Loaded {len(df)} rows.")

# 2. Clean dates and prices
print("2. Cleaning dates and parsing prices...")
df['数据日期'] = pd.to_datetime(df['数据日期'].str.replace('/', '-'), errors='coerce')
df = df.dropna(subset=['数据日期'])

df['主流价'] = pd.to_numeric(df['主流价'], errors='coerce')
df = df.dropna(subset=['主流价'])
print(f"   Cleaned dataset contains {len(df)} valid records.")

# 3. Create unique column names
print("3. Generating series identifiers...")
df['cleaned_market'] = df['市场'].astype(str).str.replace(r'[（）\(\)\s\*]', '', regex=True)
df['series_name'] = df['product_eng'].astype(str) + "_" + df['cleaned_market']

# 4. Resolve duplicates
print("4. Aggregating duplicates by date & series...")
df_grouped = df.groupby(['数据日期', 'series_name'])['主流价'].mean().reset_index()

# 5. Pivot dataset (Wide format)
print("5. Pivoting dataset to wide format...")
df_pivot = df_grouped.pivot(index='数据日期', columns='series_name', values='主流价')
print(f"   Pivoted table shape: {df_pivot.shape} (Dates x Price Series)")

# 6. Fetch Yahoo Finance Energy Benchmarks (Brent & European TTF Natural Gas)
print("\n6. Fetching global energy benchmarks from Yahoo Finance...")
def fetch_yahoo_finance(symbol, name, start_date_str):
    try:
        start_ts = int(datetime.datetime.strptime(start_date_str, "%Y-%m-%d").timestamp())
        end_ts = int(time.time())
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?period1={start_ts}&period2={end_ts}&interval=1d"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code != 200:
            print(f"   [WARNING] Failed to fetch {symbol} (HTTP {r.status_code})")
            return None
            
        data = r.json()
        result = data.get("chart", {}).get("result", [])
        if not result:
            return None
            
        timestamps = result[0].get("timestamp", [])
        close_prices = result[0].get("indicators", {}).get("quote", [{}])[0].get("close", [])
        
        dates = [datetime.datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d") for ts in timestamps]
        
        df_yf = pd.DataFrame({"Date": dates, name: close_prices})
        df_yf['Date'] = pd.to_datetime(df_yf['Date'])
        df_yf = df_yf.dropna()
        df_yf = df_yf.groupby("Date")[name].mean().reset_index()
        df_yf = df_yf.set_index("Date")
        print(f"   [OK] Retrieved {len(df_yf)} records for {name} ({symbol})")
        return df_yf
    except Exception as e:
        print(f"   [WARNING] Error fetching {symbol}: {e}")
        return None

# Fetch Brent (BZ=F) and European Natural Gas TTF (TTF=F) since 2021-01-01
df_brent = fetch_yahoo_finance("BZ=F", "Brent_Crude_Yahoo", "2021-01-01")
df_ttf_gas = fetch_yahoo_finance("TTF=F", "TTF_Natural_Gas_Yahoo", "2021-01-01")

if df_brent is not None:
    df_pivot = df_pivot.join(df_brent, how='left')
if df_ttf_gas is not None:
    df_pivot = df_pivot.join(df_ttf_gas, how='left')

# 7. Integrate US & Europe Methanol and Europe Acetic Acid from manual files
print("\n7. Integrating US & Europe manual price sheets...")

# Resolve paths
path_m_us = find_local_file(
    "../Data2/DataF/Metanol - Golfo de Estados Unidos - FOB.xlsx",
    r"C:\Documents\A4\Satge\Prediction des prix\Data2\DataF\Metanol - Golfo de Estados Unidos - FOB.xlsx"
)
path_m_eu = find_local_file(
    "../Data2/DataF/Metanol - Rotterdam - FOB.xlsx",
    r"C:\Documents\A4\Satge\Prediction des prix\Data2\DataF\Metanol - Rotterdam - FOB.xlsx"
)
path_a_eu = find_local_file(
    "../Data2/Acetic_acid.csv",
    r"C:\Documents\A4\Satge\Prediction des prix\Data2\Acetic_acid.csv"
)

# Integrate US Methanol
if path_m_us:
    try:
        df_m_us = pd.read_excel(path_m_us)
        df_m_us['Date'] = pd.to_datetime(df_m_us['数据日期'].astype(str).str.replace('/', '-'), errors='coerce')
        df_m_us['Methanol_US_Gulf_FOB'] = pd.to_numeric(df_m_us['主流价'], errors='coerce')
        df_m_us = df_m_us.dropna(subset=['Date', 'Methanol_US_Gulf_FOB'])
        df_m_us = df_m_us.groupby('Date')['Methanol_US_Gulf_FOB'].mean().to_frame()
        df_pivot = df_pivot.join(df_m_us, how='left')
        print("   [OK] Successfully merged US Methanol (FOB US Gulf)")
    except Exception as e:
        print(f"   [WARNING] Failed to load US Methanol file: {e}")
else:
    print("   [WARNING] US Methanol file not found.")

# Integrate Europe Methanol
if path_m_eu:
    try:
        df_m_eu = pd.read_excel(path_m_eu)
        df_m_eu['Date'] = pd.to_datetime(df_m_eu['数据日期'].astype(str).str.replace('/', '-'), errors='coerce')
        df_m_eu['Methanol_Rotterdam_FOB'] = pd.to_numeric(df_m_eu['主流价'], errors='coerce')
        df_m_eu = df_m_eu.dropna(subset=['Date', 'Methanol_Rotterdam_FOB'])
        df_m_eu = df_m_eu.groupby('Date')['Methanol_Rotterdam_FOB'].mean().to_frame()
        df_pivot = df_pivot.join(df_m_eu, how='left')
        print("   [OK] Successfully merged Europe Methanol (FOB Rotterdam)")
    except Exception as e:
        print(f"   [WARNING] Failed to load Europe Methanol file: {e}")
else:
    print("   [WARNING] Europe Methanol file not found.")

# Integrate Europe Acetic Acid
if path_a_eu:
    try:
        df_a_eu = pd.read_csv(path_a_eu, sep=';', skiprows=3)
        df_a_eu['Date'] = pd.to_datetime(df_a_eu['Bate'], format='%d/%m/%Y', errors='coerce')
        df_a_eu['Acetic_Acid_Europe_NWE_FD'] = pd.to_numeric(df_a_eu['Close'], errors='coerce')
        df_a_eu = df_a_eu.dropna(subset=['Date', 'Acetic_Acid_Europe_NWE_FD'])
        df_a_eu = df_a_eu.groupby('Date')['Acetic_Acid_Europe_NWE_FD'].mean().to_frame()
        df_pivot = df_pivot.join(df_a_eu, how='left')
        print("   [OK] Successfully merged Europe Acetic Acid (FD NWE)")
    except Exception as e:
        print(f"   [WARNING] Failed to load Europe Acetic Acid file: {e}")
else:
    print("   [WARNING] Europe Acetic Acid file not found.")

# Note: We searched for US Acetic Acid but confirmed no dataset exists for it in the directories.

# 8. Reindex to continuous daily date range (Forward-Fill for weekends/holidays)
print("\n8. Reindexing to continuous daily range and applying forward-fill...")
start_date = max(pd.to_datetime('2021-01-01'), df_pivot.index.min())
end_date = df_pivot.index.max()
all_dates = pd.date_range(start=start_date, end=end_date, freq='D')

df_pivot = df_pivot.reindex(all_dates)
df_pivot = df_pivot.ffill()

# Drop columns that are entirely NaN
df_pivot = df_pivot.dropna(axis=1, how='all')
print(f"   Aligned dataset shape: {df_pivot.shape} rows x {df_pivot.shape[1]} columns")

# 9. Compute a quick Correlation Analysis for Butyl Acetate (Target)
print("\n9. Calculating correlation matrix...")
corr_matrix = df_pivot.corr()

target_candidates = [col for col in df_pivot.columns if 'Butyl_Acetate_Domestic' in col]
if target_candidates:
    print("\n--------------------------------------------------")
    print("TOP CORRELATIONS WITH TARGETS:")
    print("--------------------------------------------------")
    for target in target_candidates:
        print(f"\nTarget: {target}")
        corrs = corr_matrix[target].sort_values(ascending=False)
        print("  Positive correlations:")
        for name, val in corrs.iloc[1:7].items():
            print(f"    - {name}: {val:.4f}")
        print("  Negative / Lowest correlations:")
        for name, val in corrs.iloc[-5:].items():
            print(f"    - {name}: {val:.4f}")
else:
    print("\n[NOTE] No domestic Butyl Acetate target series found for correlation preview.")

# 10. Export files
print("\n10. Exporting clean datasets to disk...")
df_pivot.index.name = 'Date'

# Export CSV
df_pivot.to_csv(OUTPUT_CSV, index=True, encoding="utf-8-sig")
print(f"   CSV saved to: {OUTPUT_CSV}")

# Export Excel
print("   Writing Excel file...")
df_pivot.to_excel(OUTPUT_EXCEL, index=True, engine='openpyxl')
print(f"   Excel saved to: {OUTPUT_EXCEL}")

print("\n==================================================")
print("[SUCCESS] PREPROCESSING AND ALIGNMENT COMPLETE!")
print("==================================================")
