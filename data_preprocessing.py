import pandas as pd
import numpy as np
import os
import sys

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
print("[START] PREPROCESSING & ALIGNING PRICE DATASET")
print("==================================================")

if not os.path.exists(INPUT_CSV):
    print(f"[ERROR] Input file not found: {INPUT_CSV}")
    sys.exit(1)

# 1. Load data
print("1. Loading raw dataset...")
df = pd.read_csv(INPUT_CSV, low_memory=False)
print(f"   Loaded {len(df)} rows.")

# 2. Standardize Date and convert Price to numeric
print("2. Cleaning dates and parsing prices...")
# Standardize date string to YYYY-MM-DD
df['数据日期'] = pd.to_datetime(df['数据日期'].str.replace('/', '-'), errors='coerce')
# Drop rows with invalid dates
df = df.dropna(subset=['数据日期'])

# Convert price columns to float, forcing non-numeric values (like text warnings) to NaN
df['主流价'] = pd.to_numeric(df['主流价'], errors='coerce')
# Drop rows with invalid price values
df = df.dropna(subset=['主流价'])
print(f"   Cleaned dataset contains {len(df)} valid records.")

# 3. Create unique Column Name for each product-market combination
print("3. Generating series identifiers...")
# Remove parentheses, spaces and special characters for cleaner column headers
df['cleaned_market'] = df['市场'].astype(str).str.replace(r'[（）\(\)\s\*]', '', regex=True)
df['series_name'] = df['product_eng'].astype(str) + "_" + df['cleaned_market']

# 4. Resolve duplicates by taking the mean of '主流价' per date and series name
print("4. Aggregating duplicates by date & series...")
df_grouped = df.groupby(['数据日期', 'series_name'])['主流价'].mean().reset_index()

# 5. Pivot dataset (Wide format)
print("5. Pivoting dataset to wide format...")
df_pivot = df_grouped.pivot(index='数据日期', columns='series_name', values='主流价')
print(f"   Pivoted table shape: {df_pivot.shape} (Dates x Price Series)")

# 6. Reindex to continuous daily date range (Forward-Fill for weekends/holidays)
print("6. Reindexing to continuous daily range and applying forward-fill...")
# Define start date (2021-01-01) and end date (max date in dataset)
start_date = max(pd.to_datetime('2021-01-01'), df_pivot.index.min())
end_date = df_pivot.index.max()
all_dates = pd.date_range(start=start_date, end=end_date, freq='D')

# Reindex and forward fill
df_pivot = df_pivot.reindex(all_dates)
df_pivot = df_pivot.ffill()

# Drop columns that are entirely NaN (if any series had no data)
df_pivot = df_pivot.dropna(axis=1, how='all')
print(f"   Aligned dataset shape: {df_pivot.shape} rows x {df_pivot.shape[1]} columns")

# 7. Compute a quick Correlation Analysis for Butyl Acetate (Target)
print("7. Calculating correlation matrix...")
corr_matrix = df_pivot.corr()

# Check if Butyl_Acetate_Domestic_华东 or similar target exists
target_candidates = [col for col in df_pivot.columns if 'Butyl_Acetate_Domestic' in col]
if target_candidates:
    print("\n--------------------------------------------------")
    print("TOP CORRELATIONS WITH TARGETS:")
    print("--------------------------------------------------")
    for target in target_candidates:
        print(f"\nTarget: {target}")
        corrs = corr_matrix[target].sort_values(ascending=False)
        print("  Positive correlations:")
        for name, val in corrs.iloc[1:6].items():
            print(f"    - {name}: {val:.4f}")
        print("  Negative / Lowest correlations:")
        for name, val in corrs.iloc[-5:].items():
            print(f"    - {name}: {val:.4f}")
else:
    print("\n[NOTE] No domestic Butyl Acetate target series found for correlation preview.")

# 8. Export files
print("\n8. Exporting clean datasets to disk...")
df_pivot.index.name = 'Date'

# Export CSV
df_pivot.to_csv(OUTPUT_CSV, index=True, encoding="utf-8-sig")
print(f"   CSV saved to: {OUTPUT_CSV}")

# Export Excel
print("   Writing Excel file (this might take a few seconds)...")
df_pivot.to_excel(OUTPUT_EXCEL, index=True, engine='openpyxl')
print(f"   Excel saved to: {OUTPUT_EXCEL}")

print("\n==================================================")
print("[SUCCESS] PREPROCESSING AND ALIGNMENT COMPLETE!")
print("==================================================")
