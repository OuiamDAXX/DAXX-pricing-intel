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

# 9.5 Integrate European Platts prices from Energy_SymbolPrice
euro_file_path = os.path.normpath(os.path.join(BASE_DIR, "Energy_SymbolPrice_2026-07-08T083029Z.xlsx"))
if os.path.exists(euro_file_path):
    print("\n9.5 Integrating Europe Platts prices from Energy_SymbolPrice...")
    try:
        # 1a. Fetch daily historical EUR/USD exchange rates from Frankfurter API
        df_rates_eur_usd = pd.Series(index=df_pivot.index, dtype=float)
        try:
            url_eur_usd = "https://api.frankfurter.app/2021-01-01..?from=EUR&to=USD"
            r = requests.get(url_eur_usd, timeout=10)
            if r.status_code == 200:
                data = r.json()
                rates_data = data.get("rates", {})
                print(f"   Fetched {len(rates_data)} historical daily EUR/USD exchange rates.")
                parsed_rates = {}
                for d_str, rate_dict in rates_data.items():
                    parsed_rates[pd.to_datetime(d_str)] = float(rate_dict.get("USD", 1.08))
                s_rates = pd.Series(parsed_rates)
                df_rates_eur_usd = s_rates.reindex(df_pivot.index).ffill().bfill()
                print(f"   EUR/USD exchange rates aligned. Recent rate: {df_rates_eur_usd.iloc[-1]:.4f}")
            else:
                print(f"   [WARNING] Frankfurter EUR/USD API returned status code {r.status_code}. Using static fallback.")
                df_rates_eur_usd = df_rates_eur_usd.fillna(1.08)
        except Exception as ex:
            print(f"   [WARNING] Failed to fetch historical EUR/USD rates: {ex}. Using static fallback (1.08).")
            df_rates_eur_usd = df_rates_eur_usd.fillna(1.08)

        # 1b. Fetch daily historical USD/CNY (Yuan) exchange rates from Frankfurter API
        df_rates_usd_cny = pd.Series(index=df_pivot.index, dtype=float)
        try:
            url_usd_cny = "https://api.frankfurter.app/2021-01-01..?from=USD&to=CNY"
            r = requests.get(url_usd_cny, timeout=10)
            if r.status_code == 200:
                data = r.json()
                rates_data = data.get("rates", {})
                print(f"   Fetched {len(rates_data)} historical daily USD/CNY exchange rates.")
                parsed_rates = {}
                for d_str, rate_dict in rates_data.items():
                    parsed_rates[pd.to_datetime(d_str)] = float(rate_dict.get("CNY", 7.25))
                s_rates = pd.Series(parsed_rates)
                df_rates_usd_cny = s_rates.reindex(df_pivot.index).ffill().bfill()
                print(f"   USD/CNY exchange rates aligned. Recent rate: {df_rates_usd_cny.iloc[-1]:.4f}")
            else:
                print(f"   [WARNING] Frankfurter USD/CNY API returned status code {r.status_code}. Using static fallback.")
                df_rates_usd_cny = df_rates_usd_cny.fillna(7.25)
        except Exception as ex:
            print(f"   [WARNING] Failed to fetch historical USD/CNY rates: {ex}. Using static fallback (7.25).")
            df_rates_usd_cny = df_rates_usd_cny.fillna(7.25)
            
        # 2. Read Europe Excel
        df_eu = pd.read_excel(euro_file_path)
        col_names = df_eu.columns
        
        # Mapping definitions for Platts Europe
        col_mapping = {
            "Butyl Acetate FD NWE Eur/mt Weekly": ("Butyl_Acetate_Europe_FD NWE", "EUR"),
            "Butyl Acetate FOB Rotterdam Weekly": ("Butyl_Acetate_Europe_FOB Rotterdam", "USD"),
            "Ethyl Acetate FD NWE Eur/mt Weekly": ("Ethyl_Acetate_Europe_FD NWE", "EUR"),
            "Ethyl Acetate FOB Rotterdam Weekly": ("Ethyl_Acetate_Europe_FOB Rotterdam", "USD"),
            "Glacial Acrylic Acid DDP Northwest Europe": ("Acrylic_Acid_Europe_DDP Northwest Europe", "EUR"),
            "PA FL FD NWE Eur/mt Weekly": ("Phthalic_Anhydride_Europe_FL FD NWE", "EUR"),
            "PA FL FOB Rotterdam Weekly": ("Phthalic_Anhydride_Europe_FL FOB Rotterdam", "USD"),
            "PA MN FD NWE Eur/mt Weekly": ("Phthalic_Anhydride_Europe_MN FD NWE", "EUR"),
            "Methyl Methacrylate DDP Northwest Europe": ("MMA_Europe_DDP Northwest Europe", "EUR"),
            "Butyl Acrylate FCA ARA": ("Butyl_Acrylate_Europe_FCA ARA", "EUR"),
            "VAM FD NWE Eur/mt Weekly": ("VAM_Europe_FD NWE", "EUR"),
            "2-EthylHexyl Acrylate FCA ARA": ("2_EHA_Europe_FCA ARA", "EUR"),
            "Acetone T2 FOB Rotterdam Weekly": ("Acetone_Europe_T2 FOB Rotterdam", "USD"),
            "Acetone T2 FD NWE Eur/mt Weekly": ("Acetone_Europe_T2 FD NWE", "EUR"),
            "IPA FOB Rotterdam Weekly": ("Isopropanol_Europe_FOB Rotterdam", "USD"),
            "IPA FD NWE Eur/mt Weekly": ("Isopropanol_Europe_FD NWE", "EUR"),
            "PTA FD NWE Spot Eur/mt": ("PTA_Europe_FD NWE Spot", "EUR"),
            "N-Butanol FD NWE Eur/mt Weekly": ("n_Butanol_Europe_FD NWE", "EUR"),
            "N-Butanol FOB Rotterdam Weekly": ("n_Butanol_Europe_FOB Rotterdam", "USD"),
            "Isobutanol FD NWE Eur/mt Weekly": ("Isobutanol_Europe_FD NWE", "EUR"),
            "Isobutanol FOB Rotterdam Weekly": ("Isobutanol_Europe_FOB Rotterdam", "USD"),
            "MEK FD NWE Eur/mt Weekly": ("MEK_Europe_FD NWE", "EUR"),
            "MEK FOB Rotterdam Weekly": ("MEK_Europe_FOB Rotterdam", "USD"),
            "Styrene FOB ARA Mo01": ("Styrene_Europe_FOB ARA", "USD"),
            "Toluene CIF ARA Mo01": ("Toluene_Europe_CIF ARA", "USD"),
            "Mixed Xylene CIF ARA Mo01": ("Xylene_Europe_CIF ARA", "USD"),
            "MEG CIF ARA T2 Weekly": ("MEG_Europe_CIF ARA", "USD"),
            "DEG FCA ARA Eur/mt Weekly": ("DEG_Europe_FCA ARA", "EUR"),
            "Monopropylene Glycol Industrial Grade FCA NWE Wkly": ("PG_Europe_Industrial Grade FCA NWE", "EUR"),
            "Monopropylene Glycol US/European Pharmaceutical Gr": ("PG_Europe_Pharmaceutical Grade FCA NWE", "EUR"),
            "Acetic Acid FD NWE Eur/mt Weekly": ("Acetic_Acid_Europe_FD NWE", "EUR"),
            "Propylene Chem Grade CIF NWE Eur/mt": ("Propylene_Europe_Chem Grade CIF NWE", "EUR"),
            "Methanol T2 FOB Rotterdam Eur/mt": ("Methanol_Europe_T2 FOB Rotterdam", "EUR"),
            "Propylene Oxide DDP Northwest Europe": ("Propylene_Oxide_Europe_DDP Northwest Europe", "EUR"),
            "Cyclohexane DDP Northwest Europe Eur/mt Wkly": ("Cyclohexane_Europe_DDP Northwest Europe", "EUR"),
            "Benzene CIF ARA": ("Benzene_Europe_CIF ARA", "USD"),
            "Ethylene Oxide DDP Northwest Europe 3-30 Days": ("EO_Europe_DDP Northwest Europe", "EUR"),
            "Dated Brent": ("Brent_Domestic_Global", "BRENT"),
            "Dutch TTF Eur/MWh Day Ahead": ("Gas_Europe_TTF", "EUR")
        }
        
        # Map Excel column index to targets
        mapped_cols = {}
        for col_idx, col_name in enumerate(col_names):
            desc = str(df_eu.iloc[0, col_idx]).strip()
            # Remove line breaks and clean whitespace
            desc_cleaned = " ".join(desc.split())
            for key, val in col_mapping.items():
                if key.lower() in desc_cleaned.lower():
                    mapped_cols[col_name] = val
                    break
        
        # Clean and parse rows (Dates are in first column, starting row 4)
        df_clean = df_eu.iloc[4:].copy()
        df_clean = df_clean.rename(columns={col_names[0]: 'Date'})
        df_clean['Date'] = pd.to_datetime(df_clean['Date'], errors='coerce')
        df_clean = df_clean.dropna(subset=['Date'])
        df_clean = df_clean.set_index('Date')
        
        # Convert series to numeric and translate currency to CNY using daily rates
        df_converted = pd.DataFrame(index=df_pivot.index)
        
        for col_name, (target_name, currency_type) in mapped_cols.items():
            series = pd.to_numeric(df_clean[col_name], errors='coerce')
            
            # Reindex series to match df_pivot dates before applying multiplication
            series_aligned = series.reindex(df_pivot.index).ffill().bfill()
            
            if currency_type == "EUR":
                # Convert day-by-day using historical daily rates: EUR -> USD -> CNY
                df_converted[target_name] = series_aligned * df_rates_eur_usd * df_rates_usd_cny
            elif currency_type == "USD":
                # Convert day-by-day: USD -> CNY
                df_converted[target_name] = series_aligned * df_rates_usd_cny
            elif currency_type == "BRENT":
                # Convert Brent crude price from USD/bbl to USD/mt using * 7.33, then to CNY/mt using daily USD/CNY rate
                df_converted[target_name] = series_aligned * 7.33 * df_rates_usd_cny
        
        # Merge into pivot DataFrame
        for col in df_converted.columns:
            df_pivot[col] = df_converted[col]
            print(f"   Merged Platts series: {col}")
            
        # Create European proxies for feedstocks not present in the Platts Excel sheet
        # 1. Octanol (2-Ethylhexanol) Proxy
        oct_cols = [c for c in df_pivot.columns if 'Octanol_Domestic' in c]
        if oct_cols:
            base_col = next((c for c in oct_cols if '华东' in c), oct_cols[0])
            df_pivot['Octanol_Europe_Proxy'] = df_pivot[base_col]
            print(f"   Generated proxy: Octanol_Europe_Proxy using {base_col}")
            
        # 2. Ethanol Proxy
        eth_cols = [c for c in df_pivot.columns if 'Ethanol_Domestic' in c]
        if eth_cols:
            base_col = next((c for c in eth_cols if '华东' in c), eth_cols[0])
            df_pivot['Ethanol_Europe_Proxy'] = df_pivot[base_col]
            print(f"   Generated proxy: Ethanol_Europe_Proxy using {base_col}")
            
        # 3. o-Xylene Proxy
        xyl_cols = [c for c in df_pivot.columns if 'o_Xylene_Domestic' in c]
        if xyl_cols:
            base_col = next((c for c in xyl_cols if '华东' in c), xyl_cols[0])
            df_pivot['o_Xylene_Europe_Proxy'] = df_pivot[base_col]
            print(f"   Generated proxy: o_Xylene_Europe_Proxy using {base_col}")
            
        # 4. Naphtha Proxy
        nap_cols = [c for c in df_pivot.columns if 'Naphtha_Domestic' in c]
        if nap_cols:
            df_pivot['Naphtha_Europe_Proxy'] = df_pivot[nap_cols[0]]
            print(f"   Generated proxy: Naphtha_Europe_Proxy using {nap_cols[0]}")

        # Export the daily historical exchange rate to the final aligned dataset
        df_pivot['USD_CNY_Rate'] = df_rates_usd_cny
        df_pivot['EUR_USD_Rate'] = df_rates_eur_usd
        print("   Merged daily USD_CNY_Rate and EUR_USD_Rate columns to aligned dataset.")
    except Exception as e:
        print(f"   [ERROR] Failed to load/merge Platts Europe prices: {e}")
else:
    print("\n[WARNING] Energy_SymbolPrice file not found. Skipping Platts Europe integration.")



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
