# -*- coding: utf-8 -*-
"""
OilChem Daily Pricing Intelligence Reporter
Computes 1-Day, 7-Day, and 15-Day price trends in USD/MT for:
- Final Products (Forecasting Targets)
- Raw Materials (Feedstocks / Inputs)

Generates an executive HTML email report and dispatches it via SMTP.
"""

import os
import sys
import smtplib
import argparse
import datetime
import pandas as pd
import requests
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Reconfigure stdout to UTF-8
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PIPELINE_DIR = os.path.dirname(os.path.abspath(__file__))
ALIGNED_CSV = os.path.join(PIPELINE_DIR, "oilchem_aligned_prices.csv")
REPORTS_DIR = os.path.join(PIPELINE_DIR, "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# PRODUCT MASTER DEFINITIONS
# ---------------------------------------------------------------------------

FINAL_PRODUCTS = [
    {"name": "Butyl Acetate", "key": "Butyl_Acetate", "pref_market": "华东"},
    {"name": "Ethyl Acetate", "key": "Ethyl_Acetate", "pref_market": "华东"},
    {"name": "n-Propyl Acetate", "key": "n_Propyl_Acetate", "pref_market": "华东"},
    {"name": "Acrylic Acid", "key": "Acrylic_Acid", "pref_market": "华东"},
    {"name": "Phthalic Anhydride", "key": "Phthalic_Anhydride", "pref_market": "华东"},
    {"name": "Maleic Anhydride", "key": "Maleic_Anhydride", "pref_market": "山东"},
    {"name": "MMA (Methyl Methacrylate)", "key": "MMA", "pref_market": "华东"},
    {"name": "Butyl Acrylate", "key": "Butyl_Acrylate", "pref_market": "华东"},
    {"name": "VAM (Vinyl Acetate Monomer)", "key": "VAM", "pref_market": "华东"},
    {"name": "2-EHA (2-Ethylhexyl Acrylate)", "key": "2_EHA", "pref_market": "华东"},
    {"name": "Ethyl Acrylate", "key": "Ethyl_Acrylate", "pref_market": "华东"},
    {"name": "Acetone", "key": "Acetone", "pref_market": "华东"},
    {"name": "Dibasic Ester (DBE)", "key": "Dibasic_Ester", "pref_market": "华东"},
    {"name": "Isopropanol (IPA)", "key": "Isopropanol", "pref_market": "山东"},
    {"name": "PMA (Methoxy Propyl Acetate)", "key": "PMA", "pref_market": "华东"},
    {"name": "PM (Methoxy Propanol)", "key": "PM", "pref_market": "华东"},
    {"name": "Isophthalic Acid (PIA)", "key": "Isophthalic_Acid", "pref_market": "华东"},
    {"name": "PTA", "key": "PTA", "pref_market": "华东"},
    {"name": "n-Butanol", "key": "n-Butanol", "pref_market": "华东"},
    {"name": "Isobutanol", "key": "Isobutanol", "pref_market": "华东"},
    {"name": "MEK (Methyl Ethyl Ketone)", "key": "MEK", "pref_market": "宁波"},
    {"name": "Styrene Monomer", "key": "Styrene", "pref_market": "中石化华东"},
    {"name": "Toluene", "key": "Toluene", "pref_market": "江苏"},
    {"name": "MEG (Monoethylene Glycol)", "key": "MEG", "pref_market": "华东"},
    {"name": "DEG (Diethylene Glycol)", "key": "DEG", "pref_market": "张家港"},
    {"name": "PG (Propylene Glycol)", "key": "PG", "pref_market": "江苏"},
    {"name": "Brent Crude Oil", "key": "Brent", "pref_market": "Global", "currency": "USD"}
]

RAW_MATERIALS = [
    {"name": "Ethylene", "key": "Ethylene", "pref_market": "华东"},
    {"name": "Propylene", "key": "Propylene", "pref_market": "山东"},
    {"name": "Benzene", "key": "Benzene", "pref_market": "华东"},
    {"name": "o-Xylene (Orthoxylene)", "key": "o_Xylene", "pref_market": "华东"},
    {"name": "m-Xylene (Metaxylene)", "key": "m_Xylene", "pref_market": "燕山石化"},
    {"name": "Paraxylene (PX)", "key": "PX", "pref_market": "上海石化"},
    {"name": "Cyclohexane", "key": "Cyclohexane", "pref_market": "山东"},
    {"name": "Methanol", "key": "Methanol", "pref_market": "山东中部"},
    {"name": "Ethanol", "key": "Ethanol", "pref_market": "苏南"},
    {"name": "n-Propanol", "key": "n-Propanol", "pref_market": "华东"},
    {"name": "Octanol (2-Ethylhexanol)", "key": "Octanol", "pref_market": "华东"},
    {"name": "Acetic Acid", "key": "Acetic_Acid", "pref_market": "江苏"},
    {"name": "Dicarboxylic Acid", "key": "Dicarboxylic_Acid", "pref_market": "华东"},
    {"name": "Propylene Oxide", "key": "Propylene_Oxide", "pref_market": "华东"},
    {"name": "Ethylene Oxide (EO)", "key": "EO", "pref_market": "华东"},
    {"name": "Nitric Acid", "key": "Nitric_Acid", "pref_market": "江苏"},
    {"name": "Natural Gas (TTF)", "key": "Gas_Europe_TTF", "pref_market": "", "currency": "EUR_MWH"}
]

# Market translations for display
REGION_TRANSLATION = {
    "华东": "East China",
    "华南": "South China",
    "华北": "North China",
    "山东": "Shandong",
    "山东中部": "Central Shandong",
    "江苏": "Jiangsu",
    "宁波": "Ningbo",
    "张家港": "Zhangjiagang",
    "苏南": "South Jiangsu",
    "苏北": "North Jiangsu",
    "上海石化": "Sinopec Shanghai",
    "中石化华东": "Sinopec East China",
    "燕山石化": "Sinopec Yanshan",
    "Global": "Global Benchmark",
    "TTF": "Dutch TTF"
}

# ---------------------------------------------------------------------------
# ENVIRONMENT & CREDENTIALS
# ---------------------------------------------------------------------------

def load_smtp_credentials():
    """Load SMTP settings from process environment (GitHub Actions) or local .env fallback."""
    env_vars = {
        "SMTP_HOST": "smtp.office365.com",
        "SMTP_PORT": "587",
        "SMTP_USER": "j.veiga@daxxgrp.com",
        "SMTP_FROM": "DAXX Tracking <j.veiga@daxxgrp.com>"
    }
    env_paths = [
        os.path.join(PIPELINE_DIR, "..", "App sales", "web-app", ".env"),
        os.path.join(PIPELINE_DIR, "..", "web-app", ".env"),
        os.path.join(PIPELINE_DIR, ".env")
    ]
    for ep in env_paths:
        if os.path.exists(ep):
            try:
                with open(ep, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            v = v.strip().strip('"').strip("'")
                            env_vars[k.strip()] = v
            except Exception:
                pass

    # Environment variables (e.g. from GitHub Actions secrets) take top priority
    for k in ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"]:
        if os.environ.get(k):
            env_vars[k] = os.environ[k]

    return env_vars


def get_live_usd_cny_rate(fallback_rate=7.25):
    """Fetch live USD/CNY exchange rate with graceful fallback."""
    try:
        r = requests.get("https://open.er-api.com/v6/latest/USD", timeout=8)
        if r.status_code == 200:
            data = r.json()
            cny = data.get("rates", {}).get("CNY")
            if cny and cny > 0:
                print(f"[FX] Fetched live USD/CNY exchange rate: {cny:.4f}")
                return float(cny)
    except Exception as e:
        print(f"[FX] Live exchange rate API failed ({e}). Using dataset fallback.")
    return fallback_rate


# ---------------------------------------------------------------------------
# PRICE EXTRACTION & EVOLUTION LOGIC
# ---------------------------------------------------------------------------

def find_best_column(df, prod_def):
    """Finds the most representative column for a product."""
    key = prod_def["key"]
    pref = prod_def.get("pref_market", "")
    
    # 1. Exact or composite match with preference
    if pref:
        target = f"{key}_Domestic_{pref}"
        if target in df.columns:
            return target
        target = f"{key}_{pref}"
        if target in df.columns:
            return target
        matches = [c for c in df.columns if key in c and pref in c]
        if matches:
            return matches[0]

    # 2. Match with Domestic
    domestic_matches = [c for c in df.columns if f"{key}_Domestic" in c]
    if domestic_matches:
        for m in domestic_matches:
            if "华东" in m:
                return m
        return domestic_matches[0]

    # 3. Any match
    any_matches = [c for c in df.columns if key in c and not c.endswith("_Rate")]
    if any_matches:
        return any_matches[0]

    return None


def calculate_metrics(df, prod_def, last_dt, d1, d7, d15, fx_live):
    """Computes Current Price, 1D, 7D, and 15D delta in USD/MT."""
    col = find_best_column(df, prod_def)
    if not col:
        return None

    currency = prod_def.get("currency", "CNY")

    def get_price_usd(dt):
        if dt not in df.index:
            sub = df.loc[df.index <= dt]
            if sub.empty:
                return None
            dt_use = sub.index.max()
        else:
            dt_use = dt

        val = df.loc[dt_use, col]
        if pd.isna(val):
            return None

        val = float(val)

        if currency == "USD":
            return val
        elif currency == "EUR_MWH":
            return val
        else:
            fx = df.loc[dt_use, "USD_CNY_Rate"] if "USD_CNY_Rate" in df.columns else fx_live
            if pd.isna(fx) or fx <= 0:
                fx = fx_live
            return val / float(fx)

    p0 = get_price_usd(last_dt)
    p1 = get_price_usd(d1)
    p7 = get_price_usd(d7)
    p15 = get_price_usd(d15)

    if p0 is None:
        return None

    def make_delta(cur, prev):
        if prev is None or prev == 0:
            return {"delta": 0.0, "pct": 0.0, "valid": False}
        diff = cur - prev
        pct = (diff / prev) * 100.0
        return {"delta": diff, "pct": pct, "valid": True}

    parts = col.split("_")
    raw_mkt = parts[-1] if len(parts) > 1 else ""
    display_mkt = REGION_TRANSLATION.get(raw_mkt, raw_mkt)

    return {
        "name": prod_def["name"],
        "series": col,
        "market": display_mkt,
        "price": p0,
        "currency": "USD/MT" if currency != "EUR_MWH" else "EUR/MWh",
        "1D": make_delta(p0, p1),
        "7D": make_delta(p0, p7),
        "15D": make_delta(p0, p15)
    }


# ---------------------------------------------------------------------------
# HTML REPORT GENERATOR
# ---------------------------------------------------------------------------

def format_trend_badge(metric):
    """Formats a price change as a stylish badge."""
    if not metric["valid"]:
        return '<span style="color: #9ca3af; font-size: 13px;">—</span>'

    delta = metric["delta"]
    pct = metric["pct"]

    if abs(delta) < 0.1:
        return '<span style="color: #6b7280; font-weight: 600; font-size: 13px;">0.0 (0.0%)</span>'
    elif delta > 0:
        return f'<span style="color: #059669; font-weight: 700; font-size: 13px;">▲ +{delta:.1f} <small style="font-weight: 500;">(+{pct:.1f}%)</small></span>'
    else:
        return f'<span style="color: #dc2626; font-weight: 700; font-size: 13px;">▼ {delta:.1f} <small style="font-weight: 500;">({pct:.1f}%)</small></span>'


def build_table_rows(items):
    """Generates HTML table rows for product items."""
    rows = []
    for i, it in enumerate(items):
        bg = "#ffffff" if i % 2 == 0 else "#f9fafb"
        p_str = f"${it['price']:,.1f}" if it['currency'] == "USD/MT" else f"€{it['price']:,.1f}"
        row = f"""
        <tr style="background-color: {bg}; border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 14px; font-weight: 600; color: #111827; font-size: 13px;">{it['name']}</td>
            <td style="padding: 10px 14px; color: #6b7280; font-size: 12px;">{it['market']}</td>
            <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #1f2937; font-size: 13px;">{p_str}</td>
            <td style="padding: 10px 14px; text-align: right;">{format_trend_badge(it['1D'])}</td>
            <td style="padding: 10px 14px; text-align: right;">{format_trend_badge(it['7D'])}</td>
            <td style="padding: 10px 14px; text-align: right;">{format_trend_badge(it['15D'])}</td>
        </tr>
        """
        rows.append(row)
    return "\n".join(rows)


def generate_email_html(last_date_str, fx_rate, final_items, raw_items):
    """Creates the complete, branded HTML email."""
    chem_items = [it for it in (final_items + raw_items) if it['1D']['valid'] and it['currency'] == 'USD/MT' and 'Brent' not in it['name']]
    gainers = [it for it in chem_items if it['1D']['delta'] > 0.05]
    decliners = [it for it in chem_items if it['1D']['delta'] < -0.05]

    top_gainer = max(gainers, key=lambda x: x['1D']['delta'], default=None)
    top_decliner = min(decliners, key=lambda x: x['1D']['delta'], default=None)

    gainer_html = f"<strong>{top_gainer['name']}</strong> ({top_gainer['market']}): +${top_gainer['1D']['delta']:.1f} USD/MT (+{top_gainer['1D']['pct']:.1f}%)" if top_gainer else "Stable / No significant 1-Day increases"
    decliner_html = f"<strong>{top_decliner['name']}</strong> ({top_decliner['market']}): -${abs(top_decliner['1D']['delta']):.1f} USD/MT ({top_decliner['1D']['pct']:.1f}%)" if top_decliner else "Stable / No significant 1-Day decreases"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OilChem Pricing Intelligence Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 30px 10px;">
    <tr>
        <td align="center">
            <table role="presentation" width="760" cellspacing="0" cellpadding="0" style="max-width: 760px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                
                <!-- HEADER -->
                <tr>
                    <td style="background: linear-gradient(135deg, #004B87 0%, #002b4d 100%); padding: 30px; text-align: center; color: #ffffff;">
                        <div style="font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #60a5fa; margin-bottom: 6px;">
                            DAXX Pricing Intelligence
                        </div>
                        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                            OilChem Daily Market Report
                        </h1>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #e5e7eb;">
                            Market Date: <strong>{last_date_str}</strong> &bull; Benchmark FX Rate: <strong>1 USD = {fx_rate:.4f} CNY</strong>
                        </p>
                    </td>
                </tr>

                <!-- HIGHLIGHTS / EXECUTIVE SUMMARY -->
                <tr>
                    <td style="padding: 24px 30px 10px 30px;">
                        <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
                            <tr>
                                <td width="50%" style="vertical-align: top; padding: 6px 12px;">
                                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #059669; margin-bottom: 4px;">
                                        ▲ Top 1-Day Gainer
                                    </div>
                                    <div style="font-size: 13px; color: #1e293b;">
                                        {gainer_html}
                                    </div>
                                </td>
                                <td width="50%" style="vertical-align: top; padding: 6px 12px; border-left: 1px solid #e2e8f0;">
                                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #dc2626; margin-bottom: 4px;">
                                        ▼ Top 1-Day Decliner
                                    </div>
                                    <div style="font-size: 13px; color: #1e293b;">
                                        {decliner_html}
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- SECTION 1: FINAL PRODUCTS -->
                <tr>
                    <td style="padding: 20px 30px 10px 30px;">
                        <div style="border-bottom: 2px solid #004B87; padding-bottom: 6px; margin-bottom: 12px;">
                            <h2 style="margin: 0; font-size: 15px; font-weight: 800; color: #004B87; text-transform: uppercase; letter-spacing: 0.5px;">
                                1. Final Products (Forecasting Targets)
                            </h2>
                        </div>
                        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                            <thead>
                                <tr style="background-color: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1;">
                                    <th style="padding: 10px 14px; text-align: left;">Product</th>
                                    <th style="padding: 10px 14px; text-align: left;">Benchmark Market</th>
                                    <th style="padding: 10px 14px; text-align: right;">Current (USD/MT)</th>
                                    <th style="padding: 10px 14px; text-align: right;">1-Day</th>
                                    <th style="padding: 10px 14px; text-align: right;">7-Days</th>
                                    <th style="padding: 10px 14px; text-align: right;">15-Days</th>
                                </tr>
                            </thead>
                            <tbody>
                                {build_table_rows(final_items)}
                            </tbody>
                        </table>
                    </td>
                </tr>

                <!-- SECTION 2: RAW MATERIALS -->
                <tr>
                    <td style="padding: 25px 30px 20px 30px;">
                        <div style="border-bottom: 2px solid #006838; padding-bottom: 6px; margin-bottom: 12px;">
                            <h2 style="margin: 0; font-size: 15px; font-weight: 800; color: #006838; text-transform: uppercase; letter-spacing: 0.5px;">
                                2. Raw Materials & Feedstocks
                            </h2>
                        </div>
                        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                            <thead>
                                <tr style="background-color: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1;">
                                    <th style="padding: 10px 14px; text-align: left;">Feedstock / Intermediate</th>
                                    <th style="padding: 10px 14px; text-align: left;">Benchmark Market</th>
                                    <th style="padding: 10px 14px; text-align: right;">Current (USD/MT)</th>
                                    <th style="padding: 10px 14px; text-align: right;">1-Day</th>
                                    <th style="padding: 10px 14px; text-align: right;">7-Days</th>
                                    <th style="padding: 10px 14px; text-align: right;">15-Days</th>
                                </tr>
                            </thead>
                            <tbody>
                                {build_table_rows(raw_items)}
                            </tbody>
                        </table>
                    </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                    <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
                        <p style="margin: 0 0 6px 0; font-weight: 600; color: #334155;">
                            DAXX Global Logistics & Chemical Intelligence Platform
                        </p>
                        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                            Automatically generated daily at 11:30 AM CET/CEST upon OilChem database synchronization. All domestic Chinese prices converted using reference FX rate.
                        </p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>

</body>
</html>
"""
    return html


# ---------------------------------------------------------------------------
# MAIN EXECUTION ROUTINE
# ---------------------------------------------------------------------------

def run_report(dry_run=False, recipient="j.veiga@daxxgrp.com"):
    print("==================================================")
    print("[REPORT] GENERATING OILCHEM DAILY PRICING REPORT")
    print("==================================================")

    if not os.path.exists(ALIGNED_CSV):
        print(f"[ERROR] Aligned prices file not found at: {ALIGNED_CSV}")
        return False

    print("1. Loading aligned price data...")
    df = pd.read_csv(ALIGNED_CSV)
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values('Date').set_index('Date')

    last_dt = df.index.max()
    d1 = last_dt - pd.Timedelta(days=1)
    d7 = last_dt - pd.Timedelta(days=7)
    d15 = last_dt - pd.Timedelta(days=15)

    last_date_str = last_dt.strftime("%Y-%m-%d")
    print(f"   Latest Date in Dataset: {last_date_str}")
    print(f"   Comparison Windows: 1D ({d1.strftime('%Y-%m-%d')}), 7D ({d7.strftime('%Y-%m-%d')}), 15D ({d15.strftime('%Y-%m-%d')})")

    # Get FX rate
    dataset_fx = float(df.loc[last_dt, "USD_CNY_Rate"]) if "USD_CNY_Rate" in df.columns else 7.25
    fx_rate = get_live_usd_cny_rate(fallback_rate=dataset_fx)

    # 2. Extract metrics for Final Products
    print("2. Computing metrics for Final Products...")
    final_items = []
    for prod in FINAL_PRODUCTS:
        m = calculate_metrics(df, prod, last_dt, d1, d7, d15, fx_rate)
        if m:
            final_items.append(m)
    print(f"   Calculated {len(final_items)} final products.")

    # 3. Extract metrics for Raw Materials
    print("3. Computing metrics for Raw Materials...")
    raw_items = []
    for prod in RAW_MATERIALS:
        m = calculate_metrics(df, prod, last_dt, d1, d7, d15, fx_rate)
        if m:
            raw_items.append(m)
    print(f"   Calculated {len(raw_items)} raw materials.")

    # 4. Generate HTML
    print("4. Generating HTML email template...")
    html_content = generate_email_html(last_date_str, fx_rate, final_items, raw_items)

    # Save local copy
    report_filename = f"daily_oilchem_report_{last_date_str}.html"
    report_path = os.path.join(REPORTS_DIR, report_filename)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"   Local HTML preview saved to: {report_path}")

    # 5. Dispatch Email via SMTP
    if dry_run:
        print("\n[DRY RUN] Email dispatch skipped as --dry-run flag is active.")
        print(f"Report file available at: {report_path}")
        return True

    print(f"5. Dispatching email to {recipient}...")
    smtp_env = load_smtp_credentials()

    host = smtp_env.get("SMTP_HOST")
    port = int(smtp_env.get("SMTP_PORT", 587))
    user = smtp_env.get("SMTP_USER")
    password = smtp_env.get("SMTP_PASS")
    sender = smtp_env.get("SMTP_FROM", user or "DAXX Tracking <j.veiga@daxxgrp.com>")

    if not host or not user or not password:
        print("[ERROR] SMTP credentials incomplete. Cannot dispatch live email.")
        print(f"Host: {host}, User: {user}, HasPass: {bool(password)}")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[OilChem Daily Pricing] Market Trends ({last_date_str}) - 1D, 7D, 15D Evolution"
    msg["From"] = sender
    msg["To"] = recipient

    part = MIMEText(html_content, "html", "utf-8")
    msg.attach(part)

    try:
        print(f"   Connecting to SMTP Server: {host}:{port} as {user}...")
        server = smtplib.SMTP(host, port, timeout=20)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(user, password)
        server.sendmail(sender, [recipient], msg.as_string())
        server.quit()
        print(f"[SUCCESS] Email successfully delivered to {recipient}!")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send email via SMTP: {e}")
        return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OilChem Daily Pricing Report")
    parser.add_argument("--dry-run", action="store_true", help="Generate HTML and print metrics without sending email")
    parser.add_argument("--recipient", default="j.veiga@daxxgrp.com", help="Email recipient")
    args = parser.parse_args()

    success = run_report(dry_run=args.dry_run, recipient=args.recipient)
    sys.exit(0 if success else 1)
