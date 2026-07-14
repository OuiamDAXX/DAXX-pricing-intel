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

DEFAULT_DIR = r"c:\Documents\A4\Satge\Prediction des prix\OilChem"
if os.path.exists(DEFAULT_DIR):
    BASE_DIR = DEFAULT_DIR
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_CSV = os.path.normpath(os.path.join(BASE_DIR, "oilchem_aligned_prices.csv"))
LEAD_LAG_CSV = os.path.normpath(os.path.join(BASE_DIR, "oilchem_lead_lag_results.csv"))
OUTPUT_JSON = os.path.normpath(os.path.join(BASE_DIR, "oilchem_financial_forecasts.json"))

print("==================================================")
print("[START] FINANCIAL FORECASTING & SIGNALS GENERATOR")
print("==================================================")

if not os.path.exists(INPUT_CSV):
    print(f"[ERROR] Input file not found: {INPUT_CSV}")
    sys.exit(1)

# Product configurations matching app.js
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
        'precursors': {'butanol': 'Benzene', 'acetic': 'Propylene'},
        'coefficients': {'butanol': 1.40, 'acetic': 0.75}
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

# Load aligned daily prices
df = pd.read_csv(INPUT_CSV, index_col='Date', parse_dates=True)
df = df.ffill()

# Load lead lag result configurations
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

# Main structures to hold output
output_data = {
    'last_updated': df.index.max().strftime('%Y-%m-%d'),
    'products': {}
}

# Identify targets from CONFIGS
for prod_key, conf in TARGET_CONFIGS.items():
    output_data['products'][prod_key] = {}
    
    # Resolve base name (strip _V1/_V2 variations and handle proxies)
    base_name = prod_key.split('_V')[0]
    if base_name == 'Isopropyl_Acetate_Proxy':
        base_name = 'n_Propyl_Acetate'
        
    # Let's find all regions available for this product in df
    # Columns look like: Butyl_Acetate_Domestic_华东
    possible_cols = [c for c in df.columns if c.startswith(base_name + '_') or c.startswith(base_name.replace('_', '-') + '_')]
    regions = []
    for c in possible_cols:
        parts = c.split('_')
        if len(parts) >= 3:
            # Region is the last element
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
        regions = ['华东'] # Default fallback
        
    for region in set(regions):
        target_col = find_column_for_region(df, base_name, region, target_col=None, lead_lag_df=lead_lag_df, is_feedstock=False)
        target_exists = target_col and target_col in df.columns
        
        # 1. Collect Feedstocks
        feedstocks = {}
        for prec_key, raw_prod in conf['precursors'].items():
            feedstock_col = find_column_for_region(df, raw_prod, region, target_col=target_col, lead_lag_df=lead_lag_df, is_feedstock=True)
            if feedstock_col and feedstock_col in df.columns:
                feedstocks[prec_key] = feedstock_col
                
        # 2. Determine Analysis Mode
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
            
        print(f"Processing target: {target_col if target_exists else prod_key} | Mode: {analysis_mode} | Active Column: {active_col}")
         
        # 3. Calculate historical Spread/Margin (or fallback to absolute price)
        if analysis_mode == "margin":
            coefs = conf['coefficients']
            cost_series = pd.Series(0.0, index=df.index)
            for prec_key, f_col in feedstocks.items():
                coef = coefs.get(prec_key, 0.0)
                cost_series += df[f_col] * coef
            spread = df[target_col] - cost_series
        elif analysis_mode == "feedstock_index" and 'coefficients' in conf and len(conf['coefficients']) > 0:
            coefs = conf['coefficients']
            cost_series = pd.Series(0.0, index=df.index)
            for prec_key, f_col in feedstocks.items():
                coef = coefs.get(prec_key, 0.0)
                cost_series += df[f_col] * coef
            spread = cost_series
        else:
            spread = df[active_col].copy()
            
        # 4. Technical Indicators on Spread
        rsi_series = calculate_rsi(spread, 14)
        bb_middle = spread.rolling(window=60).mean()
        bb_std = spread.rolling(window=60).std()
        bb_upper = bb_middle + 2 * bb_std
        bb_lower = bb_middle - 2 * bb_std
        
        current_spread = float(spread.iloc[-1])
        current_rsi = float(rsi_series.iloc[-1])
        current_bb_upper = float(bb_upper.iloc[-1]) if not np.isnan(bb_upper.iloc[-1]) else current_spread
        current_bb_lower = float(bb_lower.iloc[-1]) if not np.isnan(bb_lower.iloc[-1]) else current_spread
        current_bb_middle = float(bb_middle.iloc[-1]) if not np.isnan(bb_middle.iloc[-1]) else current_spread
        
        # Determine Market Conditions Signal based on active series + RSI (objective descriptions)
        signal = "Standard"
        if analysis_mode == "margin":
            reason = "The margin spread is currently within its standard historical range, indicating balanced market conditions between feedstock costs and finished product prices."
            if current_spread < current_bb_lower or current_rsi < 35:
                signal = "Favorable"
                reason = "The theoretical margin spread is in the bottom percentile (oversold). Historically, this indicates a period where feedstock costs are highly competitive relative to finished product prices."
            elif current_spread > current_bb_upper or current_rsi > 68:
                signal = "Unfavorable"
                reason = "The theoretical margin spread is in the upper percentile (overbought). Historically, this indicates a period of high valuation where margins are stretched and a correction towards the mean is statistically more likely."
        elif analysis_mode == "price":
            reason = "The market price is currently within its standard historical range, indicating stable and balanced pricing conditions."
            if current_spread < current_bb_lower or current_rsi < 35:
                signal = "Favorable"
                reason = "The absolute market price is in the bottom percentile (oversold). Historically, this indicates a period where the product price is competitive and represents a potential buying window."
            elif current_spread > current_bb_upper or current_rsi > 68:
                signal = "Unfavorable"
                reason = "The absolute market price is in the upper percentile (overbought). Historically, this indicates a period of high valuation where prices are stretched and a correction towards the mean is statistically more likely."
        elif analysis_mode == "feedstock_index":
            reason = f"Final product price data is currently unavailable. Decision support is calculated directly on the primary feedstock {active_col}. Feedstock prices are currently in their standard range."
            if current_spread < current_bb_lower or current_rsi < 35:
                signal = "Favorable"
                reason = f"Final product price data is unavailable. Primary feedstock cost {active_col} is in the bottom percentile (low cost). A lower feedstock cost historically translates to a buying window for raw materials before finished product prices recover."
            elif current_spread > current_bb_upper or current_rsi > 68:
                signal = "Unfavorable"
                reason = f"Final product price data is unavailable. Primary feedstock cost {active_col} is in the upper percentile (high cost). Rising feedstock costs historically put pressure on finished product pricing, suggesting a period of high procurement costs."
        else:
            reason = "Limited pricing data available. Analysis is based on simple momentum and historical seasonal trends."
            
        # Collect optimal lags for this target
        target_lags = lead_lag_configs.get(active_col, {})
        
        # Create forecasting dataframe
        features_df = pd.DataFrame(index=df.index)
        features_df['target_t'] = df[active_col]
        features_df['target_diff7'] = df[active_col] - df[active_col].shift(7)
        
        feature_cols = ['target_t', 'target_diff7']
        
        # Add feedstock features with their optimal lag
        for prec_key, f_col in feedstocks.items():
            if f_col == active_col:
                continue
            lag_days = target_lags.get(f_col, 0)
            col_name = f'feedstock_{prec_key}'
            features_df[col_name] = df[f_col].shift(lag_days)
            feature_cols.append(col_name)
            
        features_df = features_df.dropna()
        
        # Align target for future horizons
        horizon_preds = []
        coeff_lists = {prec_key: [] for prec_key in feedstocks.keys()}
        latest_feedstock_prices = {}
        for prec_key, f_col in feedstocks.items():
            latest_feedstock_prices[prec_key] = float(df[f_col].iloc[-1])

        for h in range(1, 15):
            y_train = df[active_col].shift(-h).loc[features_df.index].dropna()
            X_train = features_df.loc[y_train.index]
            
            if len(X_train) < 30:
                last_price = float(df[active_col].iloc[-1])
                pred_val = last_price
                horizon_preds.append(pred_val)
                for prec_key in feedstocks.keys():
                    coeff_lists[prec_key].append(0.0)
                continue
                
            model = SimpleRidge(alpha=1.0)
            model.fit(X_train, y_train)
            
            X_latest = features_df.iloc[[-1]]
            pred_val = float(model.predict(X_latest)[0])
            
            last_price = float(df[active_col].iloc[-1])
            pred_val = max(last_price * 0.5, min(last_price * 1.5, pred_val))
            
            horizon_preds.append(pred_val)
            
            # Save coefficients for this horizon
            for prec_key in feedstocks.keys():
                col_name = f'feedstock_{prec_key}'
                if col_name in X_train.columns:
                    col_idx = list(X_train.columns).index(col_name)
                    coeff_val = float(model.coef_[col_idx])
                else:
                    coeff_val = 0.0
                coeff_lists[prec_key].append(coeff_val)
            
        # Direction of forecast
        price_now = float(df[active_col].iloc[-1])
        price_14d = horizon_preds[-1]
        pct_change = (price_14d - price_now) / price_now * 100
        
        direction = "Stable"
        if pct_change > 1.5:
            direction = "Bullish"
        elif pct_change < -1.5:
            direction = "Bearish"
            
        # 3.5 Calculate Risk Metrics
        returns = np.log(df[active_col] / df[active_col].shift(1)).dropna().iloc[-60:]
        ann_vol = float(returns.std() * np.sqrt(252) * 100) if len(returns) > 5 else 0.0
        
        price_diff_10d = (df[active_col] - df[active_col].shift(10)).dropna()
        var_95 = float(np.percentile(price_diff_10d, 95)) if len(price_diff_10d) > 10 else 0.0
        var_95 = max(0.0, var_95)
        
        risk_level = "Low"
        if ann_vol >= 20.0:
            risk_level = "High"
        elif ann_vol >= 10.0:
            risk_level = "Medium"

        # Generate forecast dates
        last_date = df.index[-1]
        forecast_dates = []
        for day in range(1, 15):
            f_date = last_date + datetime.timedelta(days=day)
            forecast_dates.append(f_date.strftime('%Y-%m-%d'))
            
        # Calculate monthly seasonal price averages
        target_monthly = df[active_col].groupby(df.index.month).mean().fillna(0.0).round(1).tolist()
        feedstocks_monthly = {}
        for prec_key, f_col in feedstocks.items():
            feedstocks_monthly[prec_key] = df[f_col].groupby(df.index.month).mean().fillna(0.0).round(1).tolist()
            
        output_data['products'][prod_key][region] = {
            'target_column': active_col,
            'analysis_mode': analysis_mode,
            'current_price': price_now,
            'rsi': round(current_rsi, 1),
            'spread': round(current_spread, 1),
            'bollinger': {
                'upper': round(current_bb_upper, 1),
                'middle': round(current_bb_middle, 1),
                'lower': round(current_bb_lower, 1)
            },
            'signal': signal,
            'signal_reason': reason,
            'volatility_annualized': round(ann_vol, 1),
            'var_10d_95': round(var_95, 1),
            'risk_level': risk_level,
            'forecast_14d_price': round(price_14d, 1),
            'forecast_direction': direction,
            'forecast_pct_change': round(pct_change, 2),
            'predictions': [round(p, 1) for p in horizon_preds],
            'prediction_dates': forecast_dates,
            'feedstock_coefficients': coeff_lists,
            'feedstock_prices': latest_feedstock_prices,
            'seasonality_monthly': {
                'target': target_monthly,
                'feedstocks': feedstocks_monthly
            }
        }

# Write output to json
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=4)

print(f"[SUCCESS] Financial forecasting data exported to {OUTPUT_JSON}")
print("==================================================")
