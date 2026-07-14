import pandas as pd
import numpy as np
import os
import json
import datetime
import sys

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
LEAD_LAG_CSV = os.path.normpath(os.path.join(BASE_DIR, "oilchem_lead_lag_results.csv"))
OUTPUT_JSON = os.path.normpath(os.path.join(BASE_DIR, "oilchem_backtest_results.json"))

print("==================================================")
print("[START] WALK-FORWARD MODEL BACKTESTER")
print("==================================================")

if not os.path.exists(INPUT_CSV):
    print(f"[ERROR] Input file not found: {INPUT_CSV}")
    sys.exit(1)

# Product configurations matching app.js
TARGET_CONFIGS = {
    'Butyl_Acetate': {
        'precursors': {'butanol': 'n-Butanol', 'acetic': 'Acetic_Acid'},
        'coefficients': {'butanol': 0.65, 'acetic': 0.53}
    },
    'Ethyl_Acetate': {
        'precursors': {'butanol': 'Ethanol', 'acetic': 'Acetic_Acid'},
        'coefficients': {'butanol': 0.53, 'acetic': 0.69}
    },
    'n_Propyl_Acetate': {
        'precursors': {'butanol': 'n-Propanol', 'acetic': 'Acetic_Acid'},
        'coefficients': {'butanol': 0.60, 'acetic': 0.59}
    },
    'Isopropyl_Acetate_Proxy': {
        'precursors': {'butanol': 'Isopropanol', 'acetic': 'Acetic_Acid'},
        'coefficients': {'butanol': 0.60, 'acetic': 0.59}
    },
    'Acrylic_Acid': {
        'precursors': {'butanol': 'Propylene'},
        'coefficients': {'butanol': 0.65}
    },
    'Phthalic_Anhydride': {
        'precursors': {'butanol': 'o_Xylene'},
        'coefficients': {'butanol': 0.75}
    },
    'Maleic_Anhydride': {
        'precursors': {'butanol': 'n-Butanol'},
        'coefficients': {'butanol': 0.85}
    },
    'MMA': {
        'precursors': {'butanol': 'Acetone', 'acetic': 'Propylene', 'methanol': 'Methanol'},
        'coefficients': {'butanol': 0.60, 'acetic': 0.45, 'methanol': 0.35}
    },
    'Butyl_Acrylate': {
        'precursors': {'butanol': 'Acrylic_Acid', 'acetic': 'n-Butanol'},
        'coefficients': {'butanol': 0.57, 'acetic': 0.59}
    },
    'VAM': {
        'precursors': {'butanol': 'Ethylene', 'acetic': 'Acetic_Acid'},
        'coefficients': {'butanol': 0.34, 'acetic': 0.71}
    },
    '2_EHA': {
        'precursors': {'butanol': 'Acrylic_Acid', 'acetic': 'Octanol'},
        'coefficients': {'butanol': 0.40, 'acetic': 0.72}
    },
    'Ethyl_Acrylate': {
        'precursors': {'butanol': 'Acrylic_Acid', 'acetic': 'Ethanol'},
        'coefficients': {'butanol': 0.73, 'acetic': 0.47}
    },
    'Acetone_V1': {
        'precursors': {'butanol': 'Isopropanol'},
        'coefficients': {'butanol': 1.05}
    },
    'Acetone_V2': {
        'precursors': {'butanol': 'Benzene', 'acetic': 'Propylene', 'gas': 'Phenol'},
        'coefficients': {'butanol': 1.40, 'acetic': 0.75, 'gas': -1.613}
    },
    'Dibasic_Ester': {
        'precursors': {'butanol': 'Dicarboxylic_Acid', 'acetic': 'Methanol'},
        'coefficients': {'butanol': 0.70, 'acetic': 0.35}
    },
    'Isopropanol': {
        'precursors': {'butanol': 'Propylene'},
        'coefficients': {'butanol': 0.72}
    },
    'PMA': {
        'precursors': {'po': 'Propylene_Oxide', 'acetic': 'Acetic_Acid', 'methanol': 'Methanol'},
        'coefficients': {'po': 0.48, 'acetic': 0.46, 'methanol': 0.26}
    },
    'PM': {
        'precursors': {'butanol': 'Propylene_Oxide'},
        'coefficients': {'butanol': 0.69}
    },
    'Isophthalic_Acid': {
        'precursors': {'butanol': 'm_Xylene'},
        'coefficients': {'butanol': 0.70}
    },
    'PTA': {
        'precursors': {'butanol': 'Xylene'},
        'coefficients': {'butanol': 0.67}
    },
    'n_Butanol': {
        'precursors': {'butanol': 'Propylene'},
        'coefficients': {'butanol': 0.60}
    },
    'Isobutanol': {
        'precursors': {'butanol': 'Propylene'},
        'coefficients': {'butanol': 0.60}
    },
    'MEK': {
        'precursors': {'butanol': '2_Butene'},
        'coefficients': {'butanol': 0.80}
    },
    'MEK_V2': {
        'precursors': {'butanol': '2_Butanol'},
        'coefficients': {'butanol': 1.05}
    },
    'Styrene': {
        'precursors': {'butanol': 'Ethylbenzene', 'acetic': 'Propylene'},
        'coefficients': {'butanol': 1.05, 'acetic': 0.30}
    },
    'Toluene': {
        'precursors': {'benzene': 'Benzene', 'methanol': 'Methanol'},
        'coefficients': {'benzene': 0.795, 'methanol': 0.327}
    },
    'PX': {
        'precursors': {'butanol': 'Toluene', 'acetic': 'Methanol'},
        'coefficients': {'butanol': 0.742, 'acetic': 0.258}
    }
}

class SimpleRidge:
    def __init__(self, alpha=1.0):
        self.alpha = alpha
        self.coef_ = None
        self.intercept_ = None

    def fit(self, X, y):
        X = np.asarray(X)
        y = np.asarray(y)
        self.x_mean_ = X.mean(axis=0)
        self.y_mean_ = y.mean()
        X_centered = X - self.x_mean_
        y_centered = y - self.y_mean_
        n_features = X.shape[1]
        A = np.dot(X_centered.T, X_centered) + self.alpha * np.eye(n_features)
        b = np.dot(X_centered.T, y_centered)
        self.coef_ = np.linalg.solve(A, b)
        self.intercept_ = self.y_mean_ - np.dot(self.x_mean_, self.coef_)
        return self

    def predict(self, X):
        X = np.asarray(X)
        return np.dot(X, self.coef_) + self.intercept_

FEEDSTOCK_BENCHMARKS = {
    'n-Butanol': 'n-Butanol_Domestic_山东',
    'Acetic_Acid': 'Acetic_Acid_Domestic_江苏',
    'Ethanol': 'Ethanol_Domestic_山东',
    'n-Propanol': 'n-Propanol_Domestic_华东',
    'Isopropanol': 'Isopropanol_Domestic_江苏',
    'Propylene': 'Propylene_Domestic_山东',
    'o_Xylene': 'o_Xylene_Domestic_华东',
    'Acetone': 'Acetone_Domestic_华东',
    'Methanol': 'Methanol_Domestic_山东中部',
    'Ethylene': 'Ethylene_Domestic_华东',
    'Octanol': 'Octanol_Domestic_山东',
    'Benzene': 'Benzene_Domestic_华东',
    'Dicarboxylic_Acid': 'Dicarboxylic_Acid_Domestic_华东',
    'Cyclohexane': 'Cyclohexane_Domestic_山东',
    'PM': 'PM_Domestic_华东',
    'm_Xylene': 'm_Xylene_Domestic_燕山石化',
    'PX': 'PX_Domestic_扬子石化',
    'Ethylbenzene': 'Ethylbenzene_Domestic_吉林石化',
    'Acrylic_Acid': 'Acrylic_Acid_Domestic_华东',
    'Toluene': 'Toluene_Domestic_山东',
    'Phenol': 'Phenol_Domestic_华东'
}

# Helper to find matching column in dataframe
def find_column_for_region(df, product_base, region, target_col=None, lead_lag_df=None, is_feedstock=False):
    # Normalize product_base (hyphens to underscores and vice versa)
    clean_base = product_base.replace('-', '_')
    hyphen_base = product_base.replace('_', '-')
    
    # Determine if this is an international/European region
    is_intl = any(x in str(region) for x in ["Europe", "Global", "Rotterdam", "NWE", "ARA"])
    
    # If it is a feedstock, check canonical benchmarks first (only for China regions)
    if is_feedstock and not is_intl and (product_base in FEEDSTOCK_BENCHMARKS or clean_base in FEEDSTOCK_BENCHMARKS):
        col = FEEDSTOCK_BENCHMARKS.get(product_base) or FEEDSTOCK_BENCHMARKS.get(clean_base)
        if col in df.columns:
            return col

    # 1. Exact match with region (e.g. starts with product_base + '_')
    exact_match = [col for col in df.columns if (col.startswith(clean_base + '_') or col.startswith(hyphen_base + '_')) and region in col]
    if exact_match:
        return exact_match[0]
    
    # Partial match containing both product_base and region
    partial_match = [col for col in df.columns if (clean_base in col or hyphen_base in col) and region in col]
    if partial_match:
        return partial_match[0]
        
    # 1.5 Fallback to Europe precursor columns if in Europe/Global region
    if is_intl:
        eu_match = [col for col in df.columns if col.startswith(clean_base + '_Europe_') or col.startswith(hyphen_base + '_Europe_') or (clean_base in col and '_Europe_' in col) or (hyphen_base in col and '_Europe_' in col)]
        if eu_match:
            return eu_match[0]
        global_match = [col for col in df.columns if col.startswith(clean_base + '_Global_') or col.startswith(hyphen_base + '_Global_') or (clean_base in col and '_Global_' in col) or (hyphen_base in col and '_Global_' in col)]
        if global_match:
            return global_match[0]

    # 2. Dynamic Fallback: Lead-Lag correlation (highest absolute correlation for this target)
    if target_col and lead_lag_df is not None and not lead_lag_df.empty:
        mask = (lead_lag_df['Target'] == target_col) & (lead_lag_df['Feature'].str.contains(clean_base, na=False) | lead_lag_df['Feature'].str.contains(hyphen_base, na=False))
        target_rows = lead_lag_df[mask].copy()
        if not target_rows.empty:
            target_rows['abs_corr'] = target_rows['Max_Correlation'].abs()
            target_rows = target_rows.sort_values(by='abs_corr', ascending=False)
            best_feature = target_rows.iloc[0]['Feature']
            if best_feature in df.columns:
                return best_feature

    # 3. Fallback: exact product_base but restricted by region type to avoid mixing China/Europe
    fallback_exact = [col for col in df.columns if col.startswith(clean_base + '_') or col.startswith(hyphen_base + '_')]
    if is_intl:
        fallback_exact = [c for c in fallback_exact if 'Europe' in c or 'Global' in c or 'NWE' in c or 'Rotterdam' in c or 'ARA' in c]
    else:
        fallback_exact = [c for c in fallback_exact if not ('Europe' in c or 'Global' in c or 'NWE' in c or 'Rotterdam' in c or 'ARA' in c)]
        
    if fallback_exact:
        return fallback_exact[0]
        
    # 4. Fallback: any partial match restricted by region type
    fallback_partial = [col for col in df.columns if clean_base in col or hyphen_base in col]
    if is_intl:
        fallback_partial = [c for c in fallback_partial if 'Europe' in c or 'Global' in c or 'NWE' in c or 'Rotterdam' in c or 'ARA' in c]
    else:
        fallback_partial = [c for c in fallback_partial if not ('Europe' in c or 'Global' in c or 'NWE' in c or 'Rotterdam' in c or 'ARA' in c)]
        
    if fallback_partial:
        return fallback_partial[0]
        
    return product_base

# Load dataset
df = pd.read_csv(INPUT_CSV, index_col='Date', parse_dates=True)
df = df.ffill()

# Load lead lag config
lead_lag_configs = {}
lead_lag_df = pd.DataFrame()
if os.path.exists(LEAD_LAG_CSV):
    try:
        lead_lag_df = pd.read_csv(LEAD_LAG_CSV)
        for _, row in lead_lag_df.iterrows():
            target = row['Target']
            feature = row['Feature']
            lag = int(row['Optimal_Lag_Days'])
            if target not in lead_lag_configs:
                lead_lag_configs[target] = {}
            lead_lag_configs[target][feature] = lag
    except Exception as e:
        print(f"[WARNING] Could not parse lead-lag CSV: {e}")

# Helper to calculate RSI
def calculate_rsi(series, periods=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=periods).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=periods).mean()
    rs = gain / (loss + 1e-9)
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50)

# We backtest over the last 180 days
BACKTEST_WINDOW = 180

backtest_results = {}

for prod_key, conf in TARGET_CONFIGS.items():
    backtest_results[prod_key] = {}
    
    # Identify target columns
    possible_cols = [c for c in df.columns if c.startswith(prod_key + '_') or c.startswith(prod_key.replace('_', '-') + '_')]
    regions = []
    for c in possible_cols:
        parts = c.split('_')
        if len(parts) >= 3:
            regions.append(parts[-1])
            
    # Check if any precursor has European data to enable feedstock_index mode for Europe
    has_eu_precursor = False
    for prec_key, raw_prod in conf['precursors'].items():
        clean_p = raw_prod.replace('-', '_')
        eu_cols = [c for c in df.columns if (clean_p in c) and ('Europe' in c or 'NWE' in c or 'Rotterdam' in c or 'ARA' in c)]
        if eu_cols:
            has_eu_precursor = True
            break
    if has_eu_precursor:
        regions.append('Europe')

    if not regions:
        regions = ['华东']
        
    for region in set(regions):
        target_col = find_column_for_region(df, prod_key, region, target_col=None, lead_lag_df=lead_lag_df, is_feedstock=False)
        target_exists = target_col and target_col in df.columns
        
        # 1. Collect Feedstocks
        feedstocks = {}
        for prec_key, raw_prod in conf['precursors'].items():
            feedstock_col = find_column_for_region(df, raw_prod, region, target_col=target_col, lead_lag_df=lead_lag_df, is_feedstock=True)
            if feedstock_col and feedstock_col in df.columns:
                feedstocks[prec_key] = feedstock_col
                
        # Determine Mode
        if target_exists and len(feedstocks) > 0:
            analysis_mode = "margin"
            active_col = target_col
        elif target_exists and len(feedstocks) == 0:
            analysis_mode = "price"
            active_col = target_col
        elif not target_exists and len(feedstocks) > 0:
            analysis_mode = "feedstock_index"
            active_col = list(feedstocks.values())[0]
        else:
            analysis_mode = "low_data"
            active_col = None
            
        if not active_col:
            continue
            
        print(f"Backtesting target: {target_col if target_exists else prod_key} | Mode: {analysis_mode} | Active: {active_col}")
        
        # Calculate historical margin spread or active column
        if analysis_mode == "margin":
            coefs = conf['coefficients']
            cost_series = pd.Series(0.0, index=df.index)
            for prec_key, f_col in feedstocks.items():
                cost_series += df[f_col] * coefs.get(prec_key, 0.0)
            spread = df[target_col] - cost_series
        elif analysis_mode == "feedstock_index" and 'coefficients' in conf and len(conf['coefficients']) > 0:
            coefs = conf['coefficients']
            cost_series = pd.Series(0.0, index=df.index)
            for prec_key, f_col in feedstocks.items():
                cost_series += df[f_col] * coefs.get(prec_key, 0.0)
            spread = cost_series
        else:
            cost_series = df[active_col].copy()
            spread = df[active_col].copy()
            
        # 2. Walk-Forward Prediction validation
        errors_14d = []
        mapes_14d = []
        
        # Determine backtest range
        n_days = len(df)
        if n_days <= BACKTEST_WINDOW + 30:
            print(f"   [SKIP] Not enough historical data to backtest: {n_days} days.")
            continue
            
        start_idx = n_days - BACKTEST_WINDOW - 14
        
        # Prepare prediction features
        target_lags = lead_lag_configs.get(active_col, {})
        features_df = pd.DataFrame(index=df.index)
        features_df['target_t'] = df[active_col]
        features_df['target_diff7'] = df[active_col] - df[active_col].shift(7)
        feature_cols = ['target_t', 'target_diff7']
        
        for prec_key, f_col in feedstocks.items():
            if f_col == active_col:
                continue
            lag_days = target_lags.get(f_col, 0)
            col_name = f'feedstock_{prec_key}'
            features_df[col_name] = df[f_col].shift(lag_days)
            feature_cols.append(col_name)
            
        features_df = features_df.dropna()
        
        # Simulate active buying based on margin spread
        active_purchase_costs = []
        passive_purchase_costs = [] # DCA (buying every day)
        
        # We step through each day in the backtest window
        for idx in range(start_idx, n_days - 14):
            eval_date = df.index[idx]
            
            # Predict price at J+14 using features up to T
            train_features = features_df.loc[:eval_date]
            if len(train_features) < 30:
                continue
                
            actual_price_14d = df[active_col].iloc[idx + 14]
            
            # Train model to predict Y_{t+14}
            y_train = df[active_col].shift(-14).loc[train_features.index].dropna()
            X_train = train_features.loc[y_train.index]
            
            if len(X_train) >= 30:
                model = SimpleRidge(alpha=1.0)
                model.fit(X_train, y_train)
                
                # Predict
                X_latest = train_features.iloc[[-1]]
                pred_price_14d = float(model.predict(X_latest)[0])
                
                # Clip prediction
                last_price = float(df[active_col].iloc[idx])
                pred_price_14d = max(last_price * 0.5, min(last_price * 1.5, pred_price_14d))
                
                # Errors
                err = abs(pred_price_14d - actual_price_14d)
                if actual_price_14d > 0 and not np.isnan(actual_price_14d):
                    mape = (err / actual_price_14d) * 100
                    errors_14d.append(err)
                    mapes_14d.append(mape)
            
            # Simulated Trading Strategy on feedstocks:
            # We look at Bollinger Bands of the spread up to eval_date
            historical_spreads = spread.loc[:eval_date]
            if len(historical_spreads) < 60:
                continue
                
            current_spread_val = historical_spreads.iloc[-1]
            roll_mean = historical_spreads.rolling(60).mean().iloc[-1]
            roll_std = historical_spreads.rolling(60).std().iloc[-1]
            lower_band = roll_mean - 2 * roll_std
            upper_band = roll_mean + 2 * roll_std
            rsi_val = calculate_rsi(historical_spreads, 14).iloc[-1]
            
            # Decision
            signal = "Neutral"
            if current_spread_val < lower_band or rsi_val < 35:
                signal = "Buy"
            elif current_spread_val > upper_band or rsi_val > 68:
                signal = "Delay"
                
            # Simulate cost
            # Feedstocks cost at day T
            current_cost = float(cost_series.loc[eval_date])
            
            # Passive: buy 1 unit every day
            passive_purchase_costs.append(current_cost)
            
            # Active strategy: 
            # If Buy, we buy 1.5 units (representing stocking up)
            # If Delay, we buy 0.5 units (minimal purchase, drawing down stocks)
            # If Neutral, we buy 1.0 unit
            if signal == "Buy":
                active_purchase_costs.append(current_cost * 1.5)
            elif signal == "Delay":
                active_purchase_costs.append(current_cost * 0.5)
            else:
                active_purchase_costs.append(current_cost * 1.0)
                
        # Compute summary stats
        avg_mape = float(np.mean(mapes_14d)) if mapes_14d else 0.0
        if np.isnan(avg_mape) or np.isinf(avg_mape):
            avg_mape = 0.0
        avg_mae = float(np.mean(errors_14d)) if errors_14d else 0.0
        if np.isnan(avg_mae) or np.isinf(avg_mae):
            avg_mae = 0.0
        precision_pct = max(0.0, min(100.0, 100.0 - avg_mape))
        
        # Compute buying savings
        total_passive = sum(passive_purchase_costs)
        # To make it comparable, active bought total sum(units)
        # Let's count active units bought
        active_units = []
        # Re-verify signal loop unit weight
        for idx in range(start_idx, n_days - 14):
            eval_date = df.index[idx]
            historical_spreads = spread.loc[:eval_date]
            if len(historical_spreads) < 20:
                continue
            current_spread_val = historical_spreads.iloc[-1]
            roll_mean = historical_spreads.rolling(20).mean().iloc[-1]
            roll_std = historical_spreads.rolling(20).std().iloc[-1]
            lower_band = roll_mean - 2 * roll_std
            rsi_val = calculate_rsi(historical_spreads, 14).iloc[-1]
            
            if current_spread_val < lower_band or rsi_val < 35:
                active_units.append(1.5)
            elif current_spread_val > (roll_mean + 2 * roll_std) or rsi_val > 68:
                active_units.append(0.5)
            else:
                active_units.append(1.0)
                
        avg_passive_price = float(np.mean(passive_purchase_costs)) if passive_purchase_costs else 0.0
        
        # Weighted average cost of active purchase
        weighted_active = sum(active_purchase_costs) / sum(active_units) if active_units and sum(active_units) > 0 else 0.0
        
        # Savings
        savings_val = avg_passive_price - weighted_active
        savings_pct = (savings_val / avg_passive_price * 100) if avg_passive_price > 0 else 0.0
        
        # If savings is negative, clamp or just report it
        # In reality, the strategy should produce positive savings
        backtest_results[prod_key][region] = {
            'target_column': active_col,
            'analysis_mode': analysis_mode,
            'test_days': len(mapes_14d),
            'mape_14d': round(avg_mape, 2) if not np.isnan(avg_mape) and not np.isinf(avg_mape) else 0.0,
            'mae_14d': round(avg_mae, 1) if not np.isnan(avg_mae) and not np.isinf(avg_mae) else 0.0,
            'precision_pct': round(precision_pct, 2) if not np.isnan(precision_pct) and not np.isinf(precision_pct) else 0.0,
            'baseline_avg_cost': round(avg_passive_price, 1) if not np.isnan(avg_passive_price) and not np.isinf(avg_passive_price) else 0.0,
            'active_avg_cost': round(weighted_active, 1) if not np.isnan(weighted_active) and not np.isinf(weighted_active) else 0.0,
            'savings_per_ton': round(savings_val, 1) if not np.isnan(savings_val) and not np.isinf(savings_val) else 0.0,
            'savings_pct': round(savings_pct, 2) if not np.isnan(savings_pct) and not np.isinf(savings_pct) else 0.0
        }

# Write results
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(backtest_results, f, ensure_ascii=False, indent=4)

print(f"[SUCCESS] Walk-forward backtest complete. Data exported to {OUTPUT_JSON}")
print("==================================================")
