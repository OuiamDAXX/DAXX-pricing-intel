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

# Target 5: Phthalic Anhydride
phthalic_targets = [col for col in df.columns if 'Phthalic_Anhydride_Domestic_华东' in col]
if not phthalic_targets:
    phthalic_targets = [col for col in df.columns if 'Phthalic_Anhydride_Domestic' in col]
if phthalic_targets:
    targets_to_process.append(phthalic_targets[0])

# Target 6: Maleic Anhydride
maleic_targets = [col for col in df.columns if 'Maleic_Anhydride_Domestic_华东' in col]
if not maleic_targets:
    maleic_targets = [col for col in df.columns if 'Maleic_Anhydride_Domestic' in col]
if maleic_targets:
    targets_to_process.append(maleic_targets[0])

# Target 7: MMA
mma_targets = [col for col in df.columns if 'MMA_Domestic_华东' in col]
if not mma_targets:
    mma_targets = [col for col in df.columns if 'MMA_Domestic' in col]
if mma_targets:
    targets_to_process.append(mma_targets[0])

# Target 8: Butyl Acrylate
butyl_acrylate_targets = [col for col in df.columns if 'Butyl_Acrylate_Domestic_华东' in col]
if not butyl_acrylate_targets:
    butyl_acrylate_targets = [col for col in df.columns if 'Butyl_Acrylate_Domestic' in col]
if butyl_acrylate_targets:
    targets_to_process.append(butyl_acrylate_targets[0])

# Target 9: VAM
vam_targets = [col for col in df.columns if 'VAM_Domestic_华东' in col]
if not vam_targets:
    vam_targets = [col for col in df.columns if 'VAM_Domestic' in col]
if vam_targets:
    targets_to_process.append(vam_targets[0])

# Target 10: 2-EHA
eha_targets = [col for col in df.columns if '2_EHA_Domestic_华东' in col]
if not eha_targets:
    eha_targets = [col for col in df.columns if '2_EHA_Domestic' in col]
if eha_targets:
    targets_to_process.append(eha_targets[0])

# Target 11: Ethyl Acrylate
ea_targets = [col for col in df.columns if 'Ethyl_Acrylate_Domestic_华东' in col]
if not ea_targets:
    ea_targets = [col for col in df.columns if 'Ethyl_Acrylate_Domestic' in col]
if ea_targets:
    targets_to_process.append(ea_targets[0])

# Target 12 & 13: Acetone (V1 & V2)
acetone_targets = [col for col in df.columns if 'Acetone_Domestic_华东' in col]
if not acetone_targets:
    acetone_targets = [col for col in df.columns if 'Acetone_Domestic' in col]
if acetone_targets:
    targets_to_process.append(acetone_targets[0])

# Target 14: Dibasic Ester
dbe_targets = [col for col in df.columns if 'Dibasic_Ester_Domestic_华东' in col]
if not dbe_targets:
    dbe_targets = [col for col in df.columns if 'Dibasic_Ester_Domestic' in col]
if dbe_targets:
    targets_to_process.append(dbe_targets[0])


# Target 15: Dicarboxylic Acid
acid_targets = [col for col in df.columns if 'Dicarboxylic_Acid_Domestic_华东' in col]
if not acid_targets:
    acid_targets = [col for col in df.columns if 'Dicarboxylic_Acid_Domestic' in col]
if acid_targets:
    targets_to_process.append(acid_targets[0])

# Target 16: Isopropanol (IPA)
ipa_targets = [col for col in df.columns if 'Isopropanol_Domestic_华东' in col]
if not ipa_targets:
    ipa_targets = [col for col in df.columns if 'Isopropanol_Domestic' in col]
if ipa_targets:
    targets_to_process.append(ipa_targets[0])

# Target 17: Methoxy propyl acetate (MPA)
mpa_targets = [col for col in df.columns if 'PMA_Domestic_华东' in col]
if not mpa_targets:
    mpa_targets = [col for col in df.columns if 'PMA_Domestic' in col]
if mpa_targets:
    targets_to_process.append(mpa_targets[0])

# Target 18: Methoxy propanol (PM)
pm_targets = [col for col in df.columns if 'PM_Domestic_华东' in col]
if not pm_targets:
    pm_targets = [col for col in df.columns if 'PM_Domestic' in col]
if pm_targets:
    targets_to_process.append(pm_targets[0])

# Target 19: Isophthalic Acid (PIA)
pia_targets = [col for col in df.columns if 'Isophthalic_Acid_Domestic_华东' in col]
if not pia_targets:
    pia_targets = [col for col in df.columns if 'Isophthalic_Acid_Domestic' in col]
if pia_targets:
    targets_to_process.append(pia_targets[0])

# Target 20: Purified Terephthalic Acid (PTA)
pta_targets = [col for col in df.columns if 'PTA_Domestic_华东' in col]
if not pta_targets:
    pta_targets = [col for col in df.columns if 'PTA_Domestic' in col]
if pta_targets:
    targets_to_process.append(pta_targets[0])

# Target 21: n-Butanol
butanol_targets = [col for col in df.columns if 'n-Butanol_Domestic_华东' in col]
if not butanol_targets:
    butanol_targets = [col for col in df.columns if 'n-Butanol_Domestic' in col]
if butanol_targets:
    targets_to_process.append(butanol_targets[0])

# Target 22: Isobutanol
isobutanol_targets = [col for col in df.columns if 'Isobutanol_Domestic_华东' in col]
if not isobutanol_targets:
    isobutanol_targets = [col for col in df.columns if 'Isobutanol_Domestic' in col]
if isobutanol_targets:
    targets_to_process.append(isobutanol_targets[0])

# Target 23: MEK
mek_targets = [col for col in df.columns if 'MEK_Domestic_华东' in col]
if not mek_targets:
    mek_targets = [col for col in df.columns if 'MEK_Domestic' in col]
if mek_targets:
    targets_to_process.append(mek_targets[0])

# Target 24: Styrene
styrene_targets = [col for col in df.columns if 'Styrene_Domestic_华东' in col]
if not styrene_targets:
    styrene_targets = [col for col in df.columns if 'Styrene_Domestic' in col]
if styrene_targets:
    targets_to_process.append(styrene_targets[0])

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
            'p_Xylene': ['PX_Domestic'],
            'Reformed_Naphtha': ['Reformed_Naphtha_Domestic']
        }
    elif 'n-Butanol' in target:
        keywords = {
            'Propylene': ['Propylene_Domestic'],
            'Naphtha': ['Naphtha_Domestic']
        }
    elif 'Isobutanol' in target:
        keywords = {
            'Propylene': ['Propylene_Domestic'],
            'Naphtha': ['Naphtha_Domestic']
        }
    elif 'MEK' in target:
        keywords = {
            '2_Butene': ['2_Butene_Domestic'],
            'Naphtha': ['Naphtha_Domestic'],
            'n_Butane': ['n_Butane_Domestic'],
            '2_Butanol': ['2_Butanol_Domestic'],
            '1_Butene_2_Butene': ['1_Butene_2_Butene_Domestic'],
            'H2O': ['H2O_Domestic']
        }
    elif 'Styrene' in target:
        keywords = {
            'Ethylbenzene': ['Ethylbenzene_Domestic'],
            'Propylene': ['Propylene_Domestic'],
            'Reformed_Naphtha': ['Reformed_Naphtha_Domestic'],
            'Naphtha': ['Naphtha_Domestic']
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
