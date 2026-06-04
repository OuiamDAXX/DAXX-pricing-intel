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
INPUT_CSV = os.path.join(BASE_DIR, "oilchem_aligned_prices.csv")
OUTPUT_CSV = os.path.join(BASE_DIR, "oilchem_lead_lag_results.csv")

print("==================================================")
print("[START] LEAD-LAG & CROSS-CORRELATION ANALYSIS")
print("==================================================")

if not os.path.exists(INPUT_CSV):
    print(f"[ERROR] Input file not found: {INPUT_CSV}")
    sys.exit(1)

# Load aligned daily dataset
df = pd.read_csv(INPUT_CSV, index_col='Date', parse_dates=True)
print(f"   Loaded aligned dataset with {len(df)} days and {len(df.columns)} price series.")

# 1. Define Target
# We prioritize 'Butyl_Acetate_Domestic_华东' as our primary target (East China is the reference market)
target = 'Butyl_Acetate_Domestic_华东'
if target not in df.columns:
    # Fallback to any Butyl_Acetate_Domestic series
    targets = [col for col in df.columns if 'Butyl_Acetate_Domestic' in col]
    if targets:
        target = targets[0]
    else:
        print("[ERROR] No domestic Butyl Acetate target series found.")
        sys.exit(1)

print(f"   Selected TARGET: {target}")

# 2. Dynamic Feature Selection
# We want to trace the dependencies: Methanol -> Propylene -> Acetic Acid -> n-Butanol -> Butyl Acetate
keywords = {
    'Methanol': ['Methanol_Domestic'],
    'Propylene': ['Propylene_Domestic'],
    'Acetic_Acid': ['Acetic_Acid_Domestic'],
    'n-Butanol': ['n-Butanol_Domestic']
}

features_to_test = []
for group_name, kws in keywords.items():
    group_cols = []
    for kw in kws:
        group_cols.extend([col for col in df.columns if kw in col])
    
    # Sort and take representative markets to keep output readable (e.g. 华东, 山东, 华南, Yahoo, US, EU)
    representative_keywords = ['华东', '山东', '江苏', '华南', 'Yahoo', 'NWE', 'Gulf', 'Rotterdam']
    matched_reps = []
    for col in group_cols:
        if any(rep in col for rep in representative_keywords):
            matched_reps.append(col)
    
    # If no representative matched, take all matched ones
    if not matched_reps:
        matched_reps = group_cols
        
    features_to_test.extend(matched_reps[:6]) # Limit to top 6 representative markets per group for clarity

# Remove target from features list
features_to_test = [f for f in features_to_test if f != target]
# Deduplicate
features_to_test = list(dict.fromkeys(features_to_test))

print(f"   Selected {len(features_to_test)} dependency series for lead-lag analysis.")
for f in features_to_test:
    print(f"     - {f}")

# 3. Calculate Cross-Correlations for Lags 0 to 60 days
print("\n3. Calculating cross-correlations for lags 0 to 60 days...")
lags = range(0, 61)
lead_lag_results = []

for feat in features_to_test:
    feat_corrs = {}
    for lag in lags:
        # Shift the feedstock prices forward (t - lag) to model the transmission delay to target at t
        shifted_feat = df[feat].shift(lag)
        corr = df[target].corr(shifted_feat)
        feat_corrs[lag] = corr
    
    s_corr = pd.Series(feat_corrs)
    # Get optimal lag (highest absolute correlation)
    opt_lag = s_corr.abs().idxmax()
    opt_corr = s_corr[opt_lag]
    
    lead_lag_results.append({
        'Feature': feat,
        'Optimal_Lag_Days': int(opt_lag),
        'Max_Correlation': float(opt_corr),
        'Corr_at_Lag_0': float(s_corr[0]),
        'Lags': s_corr.to_dict()
    })

# 4. Save results to CSV
print("4. Saving detailed results to CSV...")
detailed_rows = []
for res in lead_lag_results:
    row = {
        'Feature': res['Feature'],
        'Optimal_Lag_Days': res['Optimal_Lag_Days'],
        'Max_Correlation': res['Max_Correlation'],
        'Corr_at_Lag_0': res['Corr_at_Lag_0']
    }
    for lag in lags:
        row[f'Lag_{lag}'] = res['Lags'][lag]
    detailed_rows.append(row)

df_detailed = pd.DataFrame(detailed_rows)
df_detailed.to_csv(OUTPUT_CSV, index=False, encoding='utf-8-sig')
print(f"   Saved detailed matrix to: {OUTPUT_CSV}")

# 5. Output Summary table
print("\n==================================================")
print("LEAD-LAG CORRELATION SUMMARY TABLE")
print("Target:", target)
print("==================================================")
print(f"{'Feature / Feedstock':<40} | {'Lag 0 Corr':<10} | {'Opt Lag (Days)':<14} | {'Max Corr':<10}")
print("-" * 85)

for res in lead_lag_results:
    print(f"{res['Feature']:<40} | {res['Corr_at_Lag_0']:<10.4f} | {res['Optimal_Lag_Days']:<14} | {res['Max_Correlation']:<10.4f}")

print("==================================================")
print("[SUCCESS] LEAD-LAG ANALYSIS COMPLETE!")
print("==================================================")
