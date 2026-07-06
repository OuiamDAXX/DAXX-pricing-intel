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

DEFAULT_DIR = r"c:\Documents\A4\Satge\Prediction des prix\OilChem"
# Dynamically determine the base directory: if local C:\ path exists, use it; otherwise use the script's directory (portable)
if os.path.exists(DEFAULT_DIR):
    BASE_DIR = DEFAULT_DIR
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_CSV = os.path.normpath(os.path.join(BASE_DIR, "oilchem_all_data.csv"))
OUTPUT_CSV = os.path.normpath(os.path.join(BASE_DIR, "oilchem_aligned_prices.csv"))
OUTPUT_EXCEL = os.path.normpath(os.path.join(BASE_DIR, "oilchem_aligned_prices.xlsx"))

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

# Filter for China domestic and refinery data (business_type in [2, 3])
df = df[df['business_type'].isin([2, 3])]
print(f"   Filtered for China domestic and refinery data (business_type in [2, 3]): {len(df)} rows.")

# 2. Clean dates and prices
print("2. Cleaning dates and parsing prices...")
df['数据日期'] = pd.to_datetime(df['数据日期'].astype(str).str.replace('/', '-'), errors='coerce')
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

# 6. Yahoo Finance Benchmarks Disabled (As requested by User)
print("\n6. Yahoo Finance Benchmarks disabled by request.")

# 7. Integrate US & Europe manual price sheets (Disabled to focus on China)
print("\n7. US & Europe manual price sheets integration disabled by request (focusing only on China).")

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

# 8.5 Synthetically compute Dicarboxylic Acid and Dibasic Ester prices
print("\n8.5 Calculating synthetic price series for Dicarboxylic Acid and Dibasic Ester (DBE)...")
cyc_col = 'Cyclohexane_Domestic_山东'
if cyc_col in df_pivot.columns:
    for r_suffix in ['华东', '山东', '华南', '华北']:
        # Dicarboxylic Acid
        nit_col = f'Nitric_Acid_Domestic_{r_suffix}'
        if nit_col not in df_pivot.columns:
            nit_col = 'Nitric_Acid_Domestic_甘宁'
        
        if nit_col in df_pivot.columns:
            acid_col = f'Dicarboxylic_Acid_Domestic_{r_suffix}'
            df_pivot[acid_col] = 0.352 * df_pivot[cyc_col] + 0.374 * df_pivot[nit_col] + 6500
            print(f"   Generated synthetic series: {acid_col}")
            
            # Dibasic Ester (DBE)
            meth_col = f'Methanol_Domestic_{r_suffix}'
            if meth_col not in df_pivot.columns:
                meth_col = 'Methanol_Domestic_山东中部'
                if meth_col not in df_pivot.columns:
                    meth_cols = [c for c in df_pivot.columns if 'Methanol_Domestic' in c]
                    meth_col = meth_cols[0] if meth_cols else None
            
            if meth_col:
                dbe_col = f'Dibasic_Ester_Domestic_{r_suffix}'
                df_pivot[dbe_col] = 0.668 * df_pivot[acid_col] + 0.332 * df_pivot[meth_col] + 2500
                print(f"   Generated synthetic series: {dbe_col} using methanol: {meth_col}")
else:
    print("[WARNING] Cyclohexane series not found. Cannot calculate synthetic DBE or Dicarboxylic Acid.")

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

# 9.5 Integrate Brent manual price sheet
brent_excel_path = os.path.normpath(os.path.join(BASE_DIR, "Brent_price.xlsx"))
if os.path.exists(brent_excel_path):
    print("\n9.5 Integrating Brent manual price sheet from Brent_price.xlsx...")
    try:
        xl = pd.ExcelFile(brent_excel_path)
        sheet_name = xl.sheet_names[0]
        df_brent = pd.read_excel(brent_excel_path, sheet_name=sheet_name, skiprows=4)
        df_brent.columns = ['Date', 'Close']
        df_brent['Date'] = pd.to_datetime(df_brent['Date'], errors='coerce')
        df_brent = df_brent.dropna(subset=['Date', 'Close'])
        df_brent = df_brent.set_index('Date')
        
        # Convert Brent price from USD/bbl to CNY/bbl
        # 1 USD = 7.25 CNY (default exchange rate matching app.js)
        # We store it in CNY/bbl. The app will divide by 7.25 in USD mode to restore the original USD/bbl price.
        exchange_rate = 7.25
        df_brent['Brent_Domestic_Global'] = df_brent['Close'] * exchange_rate
        
        # Align with df_pivot dates
        df_brent_aligned = df_brent[['Brent_Domestic_Global']].reindex(df_pivot.index)
        # Interpolate / forward fill missing dates (e.g. weekends)
        df_brent_aligned = df_brent_aligned.ffill().bfill()
        
        # Merge into df_pivot
        df_pivot['Brent_Domestic_Global'] = df_brent_aligned['Brent_Domestic_Global']
        print("   Merged Brent_Domestic_Global into aligned dataset.")
    except Exception as e:
        print(f"   [ERROR] Failed to load/merge Brent price: {e}")
else:
    print("\n[WARNING] Brent_price.xlsx not found. Skipping Brent integration.")

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
