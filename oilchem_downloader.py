# -*- coding: utf-8 -*-
"""
OilChem Automated Data Downloader
Downloads historical price data for chemical products using direct API calls.
Does NOT use Selenium or open any browser window (100% headless API extraction).
"""

import os
import json
import time
import requests
import hashlib
import pandas as pd
from datetime import datetime
import sys

# Reconfigure stdout to use UTF-8 to avoid encoding crashes on Windows consoles
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


# ==========================================
# CONFIGURATION
# ==========================================
USERNAME = "qdhljhxxcl"
PASSWORD = "a123456"

DEFAULT_DIR = r"C:\Documents\A4\Satge\Prediction des prix\OilChem"
if os.path.exists(DEFAULT_DIR):
    BASE_DIR = DEFAULT_DIR
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(BASE_DIR, "data")
COOKIE_PATH = os.path.join(BASE_DIR, "session_cookies.json")


os.makedirs(DATA_DIR, exist_ok=True)

# scope: history since 2021
DATE_START = "2021-01-01"
DATE_END = datetime.today().strftime('%Y-%m-%d')

# Products to retrieve
# Format: (English Name, Chinese Keyword, businessType)
# businessType=3 -> China Domestic prices
# businessType=4 -> International prices
PRODUCTS = [
    ("Butyl_Acetate_Domestic", "醋酸丁酯", 3),
    ("n-Butanol_Domestic", "正丁醇", 3),
    ("Acetic_Acid_Domestic", "冰醋酸", 3),
    ("Propylene_Domestic", "丙烯", 3),
    ("Methanol_Domestic", "甲醇", 3),
    ("Ethyl_Acetate_Domestic", "醋酸乙酯", 3),
    ("Ethanol_Domestic", "乙醇", 3),
    ("Ethylene_Domestic", "乙烯", 3),
    ("n_Propyl_Acetate_Domestic", "醋酸正丙酯", 3),
    ("Isopropanol_Domestic", "异丙醇", 3),
    ("n-Propanol_Domestic", "正丙醇", 3),
    ("Acrylic_Acid_Domestic", "丙烯酸", 3),
    ("Naphtha_Domestic", "石脑油", 3),
    ("Phthalic_Anhydride_Domestic", "苯酐", 3),
    ("o_Xylene_Domestic", "邻二甲苯", 3),
    ("Reformed_Naphtha_Domestic", "重整石脑油", 3),
    ("Maleic_Anhydride_Domestic", "顺酐", 3),
    ("n_Butane_Domestic", "正丁烷", 3),
    ("MMA_Domestic", "甲基丙烯酸甲酯", 3),
    ("Acetone_Domestic", "丙酮", 3),
    ("Butyl_Acrylate_Domestic", "丙烯酸丁酯", 3),
    ("VAM_Domestic", "醋酸乙烯", 3),
    ("2_EHA_Domestic", "丙烯酸异辛酯", 3),
    ("Octanol_Domestic", "辛醇", 3),
    ("Ethyl_Acrylate_Domestic", "丙烯酸乙酯", 3),
    ("Benzene_Domestic", "纯苯", 3),
    ("Cyclohexane_Domestic", "环己烷", 3),
    ("Nitric_Acid_Domestic", "硝酸", 3),
    ("Propylene_Oxide_Domestic", "环氧丙烷", 3),
    ("PM_Domestic", "PM", 3),
    ("PMA_Domestic", "PMA", 3),
    ("Isophthalic_Acid_Domestic", "间苯二甲酸", 3),
    ("m_Xylene_Domestic", "间二甲苯", 2),
    ("PTA_Domestic", "PTA", 3),
    ("PX_Domestic", "PX", 2),
    ("Isobutanol_Domestic", "异丁醇", 3),
    ("MEK_Domestic", "丁酮", 3),
    ("2_Butene_Domestic", "醚后C4", 2),
    ("Styrene_Domestic", "苯乙烯", 2),
    ("Ethylbenzene_Domestic", "乙苯", 2)
]

# Create session
session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Referer": "https://dc.oilchem.net/page/",
    "Origin": "https://dc.oilchem.net",
})

# ==========================================
# HELPERS: SESSION MANAGEMENT
# ==========================================

def load_cookies():
    """Loads saved cookies from disk and applies them to the request session."""
    if os.path.exists(COOKIE_PATH):
        try:
            with open(COOKIE_PATH, "r", encoding="utf-8") as f:
                cookies = json.load(f)
            
            # Clear existing cookies in session
            session.cookies.clear()
            
            token_val = None
            for cookie in cookies:
                session.cookies.set(cookie['name'], cookie['value'], domain=cookie.get('domain'), path=cookie.get('path', '/'))
                if cookie['name'] == '_member_user_tonken_':
                    token_val = cookie['value']
            
            cookie_str = "; ".join([f"{c['name']}={c['value']}" for c in cookies])
            session.headers.update({"Cookie": cookie_str})
            
            # Update the token header using the correct format we discovered!
            if token_val:
                session.headers.update({"token": f"_member_user_tonken_={token_val}"})
                
            print("[OK] Cookies loaded from session_cookies.json")
            return True
        except Exception as e:
            print(f"[ERROR] Loading cookies: {e}")
    return False

def test_session():
    """Test if session cookies are valid by requesting user info endpoint."""
    test_url = "https://member.oilchem.net/membercenter/user/info"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
        "Referer": "https://member.oilchem.net/",
        "Origin": "https://member.oilchem.net",
    }
    try:
        r = session.post(test_url, headers=headers, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, dict) and data.get("status") == "200":
                user_info = data.get("response", {})
                print(f"[OK] Session is active for user: {user_info.get('username')}")
                return True
    except Exception as e:
        print(f"[WARNING] Session check failed: {e}")
    return False

def run_login_flow():
    """Performs direct API request login to capture cookies without browser."""
    print("[LOGIN] Session expired or missing. Logging in via direct API request...")
    
    login_url = "https://passport.oilchem.net/member/login/login"
    payload = {
        "target": "https://www.oilchem.net",
        "username": USERNAME,
        "password": hashlib.md5(PASSWORD.encode('utf-8')).hexdigest(),
        "errorPaw": PASSWORD,
        "captchaId": "a17cc715e78a4afc8c43cd85da9d7254",
        "vcode": "loginError"
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": "https://passport.oilchem.net/member/login/index",
        "Origin": "https://passport.oilchem.net"
    }
    
    try:
        login_session = requests.Session()
        r = login_session.post(login_url, data=payload, headers=headers, allow_redirects=False, timeout=15)
        
        if r.status_code == 302:
            cookies_list = []
            for cookie in login_session.cookies:
                cookies_list.append({
                    "name": cookie.name,
                    "value": cookie.value,
                    "domain": cookie.domain,
                    "path": cookie.path
                })
            
            if cookies_list:
                with open(COOKIE_PATH, "w", encoding="utf-8") as f:
                    json.dump(cookies_list, f, indent=2, ensure_ascii=False)
                print(f"[SAVE] Cookies successfully saved to {COOKIE_PATH}")
                return True
            else:
                print("[ERROR] Login succeeded but no cookies were returned.")
        else:
            print(f"[ERROR] Direct login API returned status code {r.status_code}. Response: {r.text[:200]}")
    except Exception as e:
        print(f"[ERROR] Direct login failed due to error: {e}")
    return False

# ==========================================
# HELPERS: DATA RETRIEVAL
# ==========================================

def search_variety_markets(keyword, business_type):
    """Searches for variety and returns list of available markets matching the business type."""
    url = "https://search.oilchem.net/pricecenter/getMarketPrice"
    breed_list = []
    if keyword == "PX":
        breed_list = [{"id": "222"}]
        query_val = ""
    elif keyword == "PTA":
        breed_list = [{"id": "460"}]
        query_val = "PTA"
    elif keyword == "异丁醇":
        breed_list = [{"id": "144"}]
        query_val = "异丁醇"
    elif keyword == "丁酮":
        breed_list = [{"id": "119"}]
        query_val = "丁酮"
    elif keyword == "醚后C4":
        breed_list = [{"id": "217"}]
        query_val = "醚后C4"
    elif keyword == "苯乙烯":
        breed_list = [{"id": "221"}]
        query_val = "苯乙烯"
    elif keyword == "乙苯":
        breed_list = [{"id": "1725"}]
        query_val = "乙苯"
    else:
        query_val = keyword
        
    payload = {
        "pageNo": 1,
        "pageSize": 100,
        "query": query_val,
        "breedList": breed_list,
        "priceTypeList": [],
        "areaList": [],
        "marketList": [],
        "enterpriseList": [],
        "specList": []
    }
    try:
        r = session.post(url, json=payload, timeout=15)
        if r.status_code == 200:
            data = r.json()
            items = data.get("dataList")
            if isinstance(items, list):
                # Filter by business_type (3 or 4)
                filtered_items = []
                for item in items:
                    if item.get("businessType") == business_type:
                        filtered_items.append(item)
                return filtered_items
    except Exception as e:
        print(f"[ERROR] Searching variety for keyword {keyword}: {e}")
    return None

def download_price_history(business_type, business_id, index_price_type):
    """Downloads historical price data from dc.oilchem.net API."""
    url = "https://dc.oilchem.net/ndc/price/curve/getSingleCurve"
    payload = {
        "businessType": business_type,
        "twoLevelBusinessType": 0,
        "businessId": int(business_id),
        "indexPriceType": int(index_price_type) if index_price_type is not None else 0,
        "timeType": 0,
        "queryStartDate": DATE_START,
        "queryEndDate": DATE_END
    }
    try:
        r = session.post(url, json=payload, timeout=15)
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, dict) and data.get("status") == "200":
                resp = data.get("response", {})
                if isinstance(resp, dict) and "priceDataList" in resp:
                    return resp["priceDataList"]
            else:
                print(f" (API error: {data.get('message')})", end="")
    except Exception as e:
        print(f" (Error: {e})", end="")
    return None

def clean_filename(name):
    """Cleans a string to make it a safe filename."""
    return "".join(c for c in name if c.isalnum() or c in (' ', '_', '-')).rstrip()

# ==========================================
# MAIN EXECUTION ROUTINE
# ==========================================

def main():
    print("==================================================")
    print("[START] STARTING AUTOMATED OILCHEM DATA RETRIEVAL")
    print(f"Period: {DATE_START} to {DATE_END}")
    print("==================================================")
    
    # 1. Handle session cookies
    if not load_cookies() or not test_session():
        if not run_login_flow() or not load_cookies() or not test_session():
            print("[ERROR] Authentication failed. Cookies are invalid. Exiting.")
            sys.exit(1)
    
    print("[OK] Authentication validated successfully. Headless API download active.")
    
    all_downloaded_data = []
    summary = []
    
    # 2. Iterate and download products
    for eng_name, keyword, btype in PRODUCTS:
        print(f"\n[SEARCH] Processing: {eng_name} [businessType={btype}]...")
        
        markets = search_variety_markets(keyword, btype)
        if not markets:
            print(f"[WARNING] No markets found for {eng_name}.")
            continue
        
        # Deduplicate markets by businessTypeTabId to avoid redundant requests and rate-limiting
        seen_ids = set()
        unique_markets = []
        for market in markets:
            bid = market.get("businessTypeTabId")
            if bid and bid not in seen_ids:
                seen_ids.add(bid)
                unique_markets.append(market)
        markets = unique_markets
        
        print(f"Found {len(markets)} unique markets.")
        
        for market in markets:
            business_id = market.get("businessTypeTabId")
            index_price_type = market.get("indexPriceType")
            
            market_name = market.get("internalMarketName") or market.get("factoryName") or "Unknown"
            spec_name = market.get("specName") or market.get("spec") or ""
            
            if not business_id:
                continue
            
            full_market_display = f"{market_name} {spec_name}".strip()
            print(f"  [DOWNLOAD] Downloading history: {full_market_display} (ID: {business_id})...", end="", flush=True)
            
            rows = download_price_history(btype, business_id, index_price_type)
            if rows:
                cleaned_rows = []
                for row in rows:
                    cleaned_rows.append({
                        "数据日期": row.get("dataDate"),
                        "产品名称": row.get("varietiesName"),
                        "区域": row.get("regionName"),
                        "市场": row.get("internalMarketName") or market_name,
                        "最低价": row.get("lowPrice"),
                        "最高价": row.get("highPrice"),
                        "主流价": row.get("middlePrice"),
                        "涨跌值": row.get("dataRiseOrFall"),
                        "涨跌幅": row.get("dataRate"),
                        "单位": row.get("unitValuationName"),
                        "备注": row.get("remark") or row.get("priceTypeName") or ""
                    })
                
                df = pd.DataFrame(cleaned_rows)
                df["product_eng"] = eng_name
                df["business_type"] = btype
                
                # Safe filename
                safe_market = clean_filename(full_market_display)
                filename = f"{eng_name}_{safe_market}.csv"
                filepath = os.path.join(DATA_DIR, filename)
                
                df.to_csv(filepath, index=False, encoding="utf-8-sig")
                print(f" Done. Saved {len(df)} records.")
                
                all_downloaded_data.append(df)
                summary.append({
                    "Product": eng_name,
                    "Market": full_market_display,
                    "Records": len(df),
                    "File": filename
                })
            else:
                print(" Failed (No data).")
            
            time.sleep(0.5)
        
        time.sleep(1)
        
    # 3. Consolidate all data into a single master file
    csv_files = [os.path.join(DATA_DIR, f) for f in os.listdir(DATA_DIR) if f.endswith('.csv')]
    all_dfs = []
    for f in csv_files:
        try:
            all_dfs.append(pd.read_csv(f))
        except Exception as e:
            print(f"[WARNING] Error reading {f}: {e}")
            
    if all_dfs:
        master_df = pd.concat(all_dfs, ignore_index=True)
        master_path = os.path.join(BASE_DIR, "oilchem_all_data.csv")
        master_df.to_csv(master_path, index=False, encoding="utf-8-sig")
        
        print("\n==================================================")
        print("[SUCCESS] DATA RETRIEVAL COMPLETE!")
        print(f"Master files saved to:\n  - CSV: {master_path}")
        print(f"Total entries: {len(master_df)}")
        print("==================================================")
        
        # Print summary
        summary_df = pd.DataFrame(summary)
        print("\nSummary of downloaded datasets:")
        print(summary_df.to_string(index=False))
    else:
        print("\n[WARNING] No data downloaded. Please check session/APIs.")


if __name__ == "__main__":
    main()
