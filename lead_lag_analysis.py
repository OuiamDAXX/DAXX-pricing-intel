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
target_prefixes = [
    'Butyl_Acetate_Domestic',
    'Butyl_Acetate_Europe',
    'Ethyl_Acetate_Domestic',
    'Ethyl_Acetate_Europe',
    'n_Propyl_Acetate_Domestic',
    'Acrylic_Acid_Domestic',
    'Acrylic_Acid_Europe',
    'Phthalic_Anhydride_Domestic',
    'Phthalic_Anhydride_Europe',
    'Maleic_Anhydride_Domestic',
    'MMA_Domestic',
    'MMA_Europe',
    'Butyl_Acrylate_Domestic',
    'Butyl_Acrylate_Europe',
    'VAM_Domestic',
    'VAM_Europe',
    '2_EHA_Domestic',
    '2_EHA_Europe',
    'Ethyl_Acrylate_Domestic',
    'Acetone_Domestic',
    'Acetone_Europe',
    'Dibasic_Ester_Domestic',
    'Dicarboxylic_Acid_Domestic',
    'Isopropanol_Domestic',
    'Isopropanol_Europe',
    'PMA_Domestic',
    'PM_Domestic',
    'Isophthalic_Acid_Domestic',
    'PTA_Domestic',
    'PTA_Europe',
    'n-Butanol_Domestic',
    'n_Butanol_Europe',
    'Isobutanol_Domestic',
    'Isobutanol_Europe',
    'MEK_Domestic',
    'MEK_Europe',
    'Styrene_Domestic',
    'Styrene_Europe',
    'Toluene_Domestic',
    'Toluene_Europe'
]

for col in df.columns:
    if any(p in col for p in target_prefixes):
        targets_to_process.append(col)

print(f"   Targets to process ({len(targets_to_process)}): {targets_to_process}")

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
            'Naphtha': ['Naphtha_Domestic']
        }
    elif 'Phthalic_Anhydride' in target:
        keywords = {
            'o_Xylene': ['o_Xylene_Domestic'],
            'Reformed_Naphtha': ['Reformed_Naphtha_Domestic'],
            'Methanol': ['Methanol_Domestic']
        }
    elif 'Maleic_Anhydride' in target:
        keywords = {
            'n-Butanol': ['n-Butanol_Domestic'],
            'n_Butane': ['n_Butane_Domestic'],
            'Methanol': ['Methanol_Domestic']
        }
    elif 'MMA' in target:
        keywords = {
            'Acetone': ['Acetone_Domestic'],
            'Propylene': ['Propylene_Domestic'],
            'Methanol': ['Methanol_Domestic']
        }
    elif 'Butyl_Acrylate' in target:
        keywords = {
            'Acrylic_Acid': ['Acrylic_Acid_Domestic'],
            'n-Butanol': ['n-Butanol_Domestic'],
            'Propylene': ['Propylene_Domestic'],
            'Methanol': ['Methanol_Domestic']
        }
    elif 'VAM' in target:
        keywords = {
            'Ethylene': ['Ethylene_Domestic'],
            'Acetic_Acid': ['Acetic_Acid_Domestic'],
            'Naphtha': ['Naphtha_Domestic'],
            'Methanol': ['Methanol_Domestic']
        }
    elif '2_EHA' in target:
        keywords = {
            'Acrylic_Acid': ['Acrylic_Acid_Domestic'],
            'Octanol': ['Octanol_Domestic'],
            'Propylene': ['Propylene_Domestic'],
            'Methanol': ['Methanol_Domestic']
        }
    elif 'Ethyl_Acrylate' in target:
        keywords = {
            'Acrylic_Acid': ['Acrylic_Acid_Domestic'],
            'Ethanol': ['Ethanol_Domestic'],
            'Propylene': ['Propylene_Domestic'],
            'Ethylene': ['Ethylene_Domestic']
        }
    elif 'Acetone' in target:
        keywords = {
            'Isopropanol': ['Isopropanol_Domestic'],
            'Benzene': ['Benzene_Domestic'],
            'Propylene': ['Propylene_Domestic'],
            'Reformed_Naphtha': ['Reformed_Naphtha_Domestic'],
            'Naphtha': ['Naphtha_Domestic']
        }
    elif 'Dibasic_Ester' in target:
        keywords = {
            'Dicarboxylic_Acid': ['Dicarboxylic_Acid_Domestic'],
            'Methanol': ['Methanol_Domestic'],
            'Cyclohexane': ['Cyclohexane_Domestic']
        }
    elif 'Dicarboxylic_Acid' in target:
        keywords = {
            'Cyclohexane': ['Cyclohexane_Domestic'],
            'Nitric_Acid': ['Nitric_Acid_Domestic']
        }
    elif 'Isopropanol' in target:
        keywords = {
            'Propylene': ['Propylene_Domestic'],
            'Naphtha': ['Naphtha_Domestic']
        }
    elif 'PMA' in target:
        keywords = {
            'PM': ['PM_Domestic'],
            'Propylene_Oxide': ['Propylene_Oxide_Domestic'],
            'Acetic_Acid': ['Acetic_Acid_Domestic'],
            'Methanol': ['Methanol_Domestic']
        }
    elif 'PM' in target:
        keywords = {
            'Propylene_Oxide': ['Propylene_Oxide_Domestic'],
            'Methanol': ['Methanol_Domestic'],
            'Propylene': ['Propylene_Domestic']
        }
    elif 'Isophthalic_Acid' in target:
        keywords = {
            'm_Xylene': ['m_Xylene_Domestic'],
            'Reformed_Naphtha': ['Reformed_Naphtha_Domestic']
        }
    elif 'PTA' in target:
        keywords = {
            'Xylene': ['Xylene_Domestic', 'Xylene_Europe'],
            'o_Xylene': ['o_Xylene_Domestic', 'o_Xylene_Europe'],
            'Brent': ['Brent_Domestic_Global']
        }
    elif 'n-Butanol' in target or 'n_Butanol' in target:
        keywords = {
            'Propylene': ['Propylene_Domestic', 'Propylene_Europe'],
            'Brent': ['Brent_Domestic_Global']
        }
    elif 'Isobutanol' in target or 'Isobutanol_Europe' in target:
        keywords = {
            'Propylene': ['Propylene_Domestic', 'Propylene_Europe'],
            'Brent': ['Brent_Domestic_Global']
        }
    elif 'MEK' in target:
        keywords = {
            'Brent': ['Brent_Domestic_Global'],
            '2_Butene': ['2_Butene_Domestic'],
            'n_Butane': ['n_Butane_Domestic'],
            '2_Butanol': ['2_Butanol_Domestic']
        }
    elif 'Styrene' in target:
        keywords = {
            'Ethylbenzene': ['Ethylbenzene_Domestic'],
            'Propylene': ['Propylene_Domestic', 'Propylene_Europe'],
            'Brent': ['Brent_Domestic_Global']
        }
    elif 'Toluene' in target:
        keywords = {
            'Brent': ['Brent_Domestic_Global']
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
        
        # Domain logic override: For feedstock cost transmission, positive correlation is expected.
        # If there is a positive correlation at a short lag (0 to 10 days) of at least 0.20,
        # we prefer the peak positive correlation in that short-lag window over a far-away negative correlation (lag > 10)
        # that might have a slightly higher absolute value due to cyclical noise.
        short_lag_pos = s_corr.loc[0:10]
        pos_short_lags = short_lag_pos[short_lag_pos > 0.20]
        if not pos_short_lags.empty and opt_lag > 10 and max_corr < 0:
            opt_lag = pos_short_lags.idxmax()
            max_corr = s_corr[opt_lag]
            print(f"       - [OVERRIDE] Overrode negative lag {s_corr.abs().idxmax()} with positive short lag {opt_lag} (corr: {max_corr:.3f})")

        corr_0 = s_corr[0]
        
        lead_lag_results.append({
            'Target': target,
            'Feature': feat,
            'Optimal_Lag_Days': int(opt_lag),
            'Max_Correlation': float(max_corr),
            'Corr_at_Lag_0': float(corr_0)
        })

# 4. Save results to CSV
if lead_lag_results:
    results_df = pd.DataFrame(lead_lag_results)
    results_df.to_csv(OUTPUT_CSV, index=False)
    print(f"\n[SUCCESS] Multi-product lead-lag analysis written to {OUTPUT_CSV}")
else:
    print("\n[ERROR] No lead-lag results calculated.")
