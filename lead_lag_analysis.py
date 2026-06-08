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

DEFAULT_DIR = r"c:\Documents\A4\Satge\Prediction des prix\OilChem"
if os.path.exists(DEFAULT_DIR):
    BASE_DIR = DEFAULT_DIR
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_CSV = os.path.normpath(os.path.join(BASE_DIR, "oilchem_aligned_prices.csv"))
OUTPUT_CSV = os.path.normpath(os.path.join(BASE_DIR, "oilchem_lead_lag_results.csv"))

print("==================================================")
print("[START] MULTI-PRODUCT LEAD-LAG ANALYSIS")
print("==================================================")

if not os.path.exists(INPUT_CSV):
    print(f"[ERROR] Input file not found: {INPUT_CSV}")
    sys.exit(1)

# Load aligned daily dataset
df = pd.read_csv(INPUT_CSV, index_col='Date', parse_dates=True)
print(f"   Loaded aligned dataset with {len(df)} days and {len(df.columns)} price series.")

# 1. Define Target Candidates
targets_to_process = []

# Target 1: Butyl Acetate
butyl_targets = [col for col in df.columns if 'Butyl_Acetate_Domestic_华东' in col]
if not butyl_targets:
    butyl_targets = [col for col in df.columns if 'Butyl_Acetate_Domestic' in col]
if butyl_targets:
    targets_to_process.append(butyl_targets[0])

# Target 2: Ethyl Acetate
ethyl_targets = [col for col in df.columns if 'Ethyl_Acetate_Domestic_华东' in col]
if not ethyl_targets:
    ethyl_targets = [col for col in df.columns if 'Ethyl_Acetate_Domestic' in col]
if ethyl_targets:
    targets_to_process.append(ethyl_targets[0])

# Target 3: Isopropyl Acetate (Proxy: n-Propyl Acetate)
isopropyl_targets = [col for col in df.columns if 'n_Propyl_Acetate_Domestic_华东' in col]
if not isopropyl_targets:
    isopropyl_targets = [col for col in df.columns if 'n_Propyl_Acetate_Domestic' in col]
if isopropyl_targets:
    targets_to_process.append(isopropyl_targets[0])

# Target 4: Acrylic Acid
acrylic_targets = [col for col in df.columns if 'Acrylic_Acid_Domestic_华东' in col]
if not acrylic_targets:
    acrylic_targets = [col for col in df.columns if 'Acrylic_Acid_Domestic' in col]
if acrylic_targets:
    targets_to_process.append(acrylic_targets[0])

print(f"   Targets to process: {targets_to_process}")

# 2. Process each target
lead_lag_results = []

for target in targets_to_process:
    print(f"\n   Running Lead-Lag for target: {target}")
    
    # Define features based on target product
    if 'Butyl_Acetate' in target:
        keywords = {
            'n-Butanol': ['n-Butanol_Domestic'],
            'Acetic_Acid': ['Acetic_Acid_Domestic'],
            'Propylene': ['Propylene_Domestic'],
            'Methanol': ['Methanol_Domestic']
        }
    elif 'Ethyl_Acetate' in target:
        keywords = {
            'Ethanol': ['Ethanol_Domestic'],
            'Acetic_Acid': ['Acetic_Acid_Domestic'],
            'Ethylene': ['Ethylene_Domestic'],
            'Methanol': ['Methanol_Domestic']
        }
    elif 'n_Propyl_Acetate' in target:
        keywords = {
            'n-Propanol': ['n-Propanol_Domestic'],
            'Isopropanol': ['Isopropanol_Domestic'],
            'Acetic_Acid': ['Acetic_Acid_Domestic'],
            'Propylene': ['Propylene_Domestic'],
            'Methanol': ['Methanol_Domestic']
        }
    elif 'Acrylic_Acid' in target:
        keywords = {
            'Propylene': ['Propylene_Domestic'],
            'Naphtha': ['Naphtha_Domestic'],
            'Methanol': ['Methanol_Domestic']
        }
    else:
        continue
        
    features_to_test = []
    for group_name, kws in keywords.items():
        group_cols = []
        for kw in kws:
            group_cols.extend([col for col in df.columns if kw in col])
        
        # Sort and take representative markets
        representative_keywords = ['华东', '山东', '江苏', '华南', 'Yahoo', 'NWE', 'Gulf']
        matched_reps = []
        for col in group_cols:
            if any(rep in col for rep in representative_keywords):
                matched_reps.append(col)
        
        if not matched_reps:
            matched_reps = group_cols
            
        features_to_test.extend(matched_reps[:6])
        
    # Remove target from features
    features_to_test = [f for f in features_to_test if f != target]
    # Deduplicate
    features_to_test = list(dict.fromkeys(features_to_test))
    
    print(f"     Testing {len(features_to_test)} feedstocks/upstream series:")
    for f in features_to_test:
        print(f"       - {f}")
        
    # 3. Calculate Cross-Correlations for Lags 0 to 60 days
    for feat in features_to_test:
        # Check if the feature has sufficient historical data (at least 180 non-NaN days)
        non_nan_count = df[feat].notna().sum()
        if non_nan_count < 180:
            print(f"       - Skipping {feat} due to insufficient historical data ({non_nan_count} non-NaN days)")
            continue
            
        feat_corrs = {}
        for lag in range(0, 61):
            shifted_feat = df[feat].shift(lag)
            corr = df[target].corr(shifted_feat)
            feat_corrs[lag] = corr
        
        s_corr = pd.Series(feat_corrs)
        if s_corr.isna().all():
            print(f"       - Skipping {feat} because all lagged correlations are NaN")
            continue
            
        opt_lag = s_corr.abs().idxmax()
        max_corr = s_corr[opt_lag]
        corr_0 = s_corr[0]
        
        lead_lag_results.append({
            'Target': target,
            'Feature': feat,
            'Optimal_Lag_Days': opt_lag,
            'Max_Correlation': max_corr,
            'Corr_at_Lag_0': corr_0
        })

# 4. Save results to CSV
if lead_lag_results:
    results_df = pd.DataFrame(lead_lag_results)
    results_df.to_csv(OUTPUT_CSV, index=False)
    print(f"\n[SUCCESS] Multi-product lead-lag analysis written to {OUTPUT_CSV}")
else:
    print("\n[ERROR] No lead-lag results calculated.")
