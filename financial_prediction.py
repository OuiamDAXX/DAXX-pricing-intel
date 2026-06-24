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
        'precursors': {'butanol': 'PM', 'acetic': 'Acetic_Acid'},
        'coefficients': {'butanol': 0.69, 'acetic': 0.46}
    }
}

# Helper to find matching column in dataframe for a product and region
def find_column_for_region(df, product_base, region):
    # Try exact match with domestic and region
    candidates = [col for col in df.columns if product_base in col and region in col]
    if candidates:
        return candidates[0]
    # Try any column containing product_base
    candidates = [col for col in df.columns if product_base in col]
    if candidates:
        return candidates[0]
    return None

# Load aligned daily prices
df = pd.read_csv(INPUT_CSV, index_col='Date', parse_dates=True)
df = df.ffill()

# Load lead lag result configurations
lead_lag_configs = {}
if os.path.exists(LEAD_LAG_CSV):
    try:
        ll_df = pd.read_csv(LEAD_LAG_CSV)
        for _, row in ll_df.iterrows():
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
    
    # Let's find all regions available for this product in df
    # Columns look like: Butyl_Acetate_Domestic_华东
    possible_cols = [c for c in df.columns if c.startswith(prod_key + '_')]
    regions = []
    for c in possible_cols:
        parts = c.split('_')
        if len(parts) >= 3:
            # Region is the last element
            regions.append(parts[-1])
            
    if not regions:
        regions = ['华东'] # Default fallback
        
    for region in set(regions):
        target_col = find_column_for_region(df, prod_key, region)
        if not target_col or target_col not in df.columns:
            continue
            
        print(f"Processing target: {target_col}")
        
        # 1. Collect Feedstocks
        feedstocks = {}
        for prec_key, raw_prod in conf['precursors'].items():
            feedstock_col = find_column_for_region(df, raw_prod, region)
            if feedstock_col and feedstock_col in df.columns:
                feedstocks[prec_key] = feedstock_col
                
        # 2. Calculate historical Spread/Margin
        coefs = conf['coefficients']
        spread = df[target_col].copy()
        valid_spread = True
        cost_series = pd.Series(0.0, index=df.index)
        for prec_key, f_col in feedstocks.items():
            coef = coefs.get(prec_key, 0.0)
            cost_series += df[f_col] * coef
            
        spread = df[target_col] - cost_series
        
        # 3. Technical Indicators on Spread
        rsi_series = calculate_rsi(spread, 14)
        bb_middle = spread.rolling(window=20).mean()
        bb_std = spread.rolling(window=20).std()
        bb_upper = bb_middle + 2 * bb_std
        bb_lower = bb_middle - 2 * bb_std
        
        current_spread = float(spread.iloc[-1])
        current_rsi = float(rsi_series.iloc[-1])
        current_bb_upper = float(bb_upper.iloc[-1]) if not np.isnan(bb_upper.iloc[-1]) else current_spread
        current_bb_lower = float(bb_lower.iloc[-1]) if not np.isnan(bb_lower.iloc[-1]) else current_spread
        current_bb_middle = float(bb_middle.iloc[-1]) if not np.isnan(bb_middle.iloc[-1]) else current_spread
        
        # Determine Buy/Sell Signal based on margin spread + RSI
        signal = "Neutral"
        reason = "The market is in a relatively stable phase. The theoretical margin spread is balanced compared to its historical average."
        
        if current_spread < current_bb_lower or current_rsi < 35:
            signal = "Buy"
            reason = "The margin spread is historically low and the RSI indicates an oversold condition. This is an excellent opportunity to buy feedstocks before an expected price increase in the target product."
        elif current_spread > current_bb_upper or current_rsi > 68:
            signal = "Delay Purchase"
            reason = "Margins on this product are currently very high or the market is overbought. It is recommended to delay feedstock purchases and wait for a correction."
            
        # 4. Multi-step forecasting (J+1 to J+14) using Ridge Regression
        predictions = []
        forecast_dates = []
        last_date = df.index[-1]
        
        # Collect optimal lags for this target
        target_lags = lead_lag_configs.get(target_col, {})
        
        # Create forecasting dataframe
        features_df = pd.DataFrame(index=df.index)
        features_df['target_t'] = df[target_col]
        features_df['target_diff7'] = df[target_col] - df[target_col].shift(7)
        
        feature_cols = ['target_t', 'target_diff7']
        
        # Add feedstock features with their optimal lag
        for prec_key, f_col in feedstocks.items():
            lag_days = target_lags.get(f_col, 0)
            col_name = f'feedstock_{prec_key}'
            features_df[col_name] = df[f_col].shift(lag_days)
            feature_cols.append(col_name)
            
        features_df = features_df.dropna()
        
        # Align target for future horizons
        horizon_preds = []
        for h in range(1, 15):
            y_train = df[target_col].shift(-h).loc[features_df.index].dropna()
            X_train = features_df.loc[y_train.index]
            
            if len(X_train) < 30:
                last_price = float(df[target_col].iloc[-1])
                pred_val = last_price
                horizon_preds.append(pred_val)
                continue
                
            model = SimpleRidge(alpha=1.0)
            model.fit(X_train, y_train)
            
            X_latest = features_df.iloc[[-1]]
            pred_val = float(model.predict(X_latest)[0])
            
            last_price = float(df[target_col].iloc[-1])
            pred_val = max(last_price * 0.5, min(last_price * 1.5, pred_val))
            
            horizon_preds.append(pred_val)
            
        # Direction of forecast
        price_now = float(df[target_col].iloc[-1])
        price_14d = horizon_preds[-1]
        pct_change = (price_14d - price_now) / price_now * 100
        
        direction = "Stable"
        if pct_change > 1.5:
            direction = "Bullish"
        elif pct_change < -1.5:
            direction = "Bearish"
            
        # 3.5 Calculate Risk Metrics
        returns = np.log(df[target_col] / df[target_col].shift(1)).dropna().iloc[-60:]
        ann_vol = float(returns.std() * np.sqrt(252) * 100) if len(returns) > 5 else 0.0
        
        price_diff_10d = (df[target_col] - df[target_col].shift(10)).dropna()
        var_95 = float(np.percentile(price_diff_10d, 95)) if len(price_diff_10d) > 10 else 0.0
        var_95 = max(0.0, var_95)
        
        risk_level = "Low"
        if ann_vol >= 20.0:
            risk_level = "High"
        elif ann_vol >= 10.0:
            risk_level = "Medium"

        # Generate forecast dates
        for day in range(1, 15):
            f_date = last_date + datetime.timedelta(days=day)
            forecast_dates.append(f_date.strftime('%Y-%m-%d'))
            
        output_data['products'][prod_key][region] = {
            'target_column': target_col,
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
            'prediction_dates': forecast_dates
        }

# Write output to json
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=4)

print(f"[SUCCESS] Financial forecasting data exported to {OUTPUT_JSON}")
print("==================================================")
