/* ==========================================================================
   OILCHEM DASHBOARD APPLICATION LOGIC (VANILLA JS) - MULTI-PRODUCT & REGION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // API data paths
    const PRICES_CSV_PATH = "oilchem_aligned_prices.csv?t=" + new Date().getTime();
    const LEAD_LAG_CSV_PATH = "oilchem_lead_lag_results.csv?t=" + new Date().getTime();

    // Currency conversion variables and state
    let exchangeRates = { USD: 1, CNY: 7.25 };
    let currentCurrency = localStorage.getItem('currency') || 'CNY';

    // Set currency dropdown initial value
    const currencySelect = document.getElementById('currency-select');
    if (currencySelect) {
        currencySelect.value = currentCurrency;
        currencySelect.addEventListener('change', (e) => {
            currentCurrency = e.target.value;
            localStorage.setItem('currency', currentCurrency);
            // Re-render components that display currency/prices
            updateKPIs();
            if (typeof initializeChart === 'function') {
                initializeChart();
            }
            if (typeof updateChemicalTree === 'function') {
                updateChemicalTree();
            }
            if (typeof updateFinancialSignals === 'function') {
                updateFinancialSignals();
            }
            if (typeof updateSidebarTabs === 'function') {
                updateSidebarTabs();
            }
            if (typeof renderTable === 'function') {
                renderTable();
            }
        });
    }

    async function fetchExchangeRates() {
        try {
            const response = await fetch('https://open.er-api.com/v6/latest/USD');
            const data = await response.json();
            if (data.result === 'success' && data.rates) {
                exchangeRates.USD = data.rates.USD || 1;
                exchangeRates.CNY = data.rates.CNY || 7.25;
                exchangeRates.EUR = data.rates.EUR || 0.92;
                console.log('Fetched live exchange rates:', exchangeRates);
                updateHeaderExchangeRates();
            }
        } catch (e) {
            console.error('Failed to fetch live exchange rates, using defaults:', e);
        }
    }

    function updateHeaderExchangeRates() {
        const headerRateVal = document.getElementById('header-rate-val');
        const headerEurUsdVal = document.getElementById('header-eur-usd-val');
        const rateIndicatorBox = document.getElementById('rate-indicator-box');
        
        let usdCny = exchangeRates.CNY || 7.25;
        if (rawPricesData && rawPricesData.length > 0) {
            const lastRowWithRate = rawPricesData.slice().reverse().find(r => r.USD_CNY_Rate);
            if (lastRowWithRate && lastRowWithRate.USD_CNY_Rate) {
                usdCny = parseFloat(lastRowWithRate.USD_CNY_Rate) || usdCny;
            }
        }
        
        if (headerRateVal) {
            headerRateVal.textContent = usdCny.toFixed(4);
        }
        
        if (headerEurUsdVal && exchangeRates.EUR) {
            const eurUsd = 1 / exchangeRates.EUR;
            headerEurUsdVal.textContent = eurUsd.toFixed(4);
        }
        
        if (rateIndicatorBox) {
            rateIndicatorBox.style.display = 'flex';
        }
    }

    function convertValue(valInCNY, date = null) {
        if (typeof valInCNY !== 'number') {
            valInCNY = parseFloat(valInCNY);
        }
        if (isNaN(valInCNY)) return 0;
        if (currentCurrency === 'CNY') {
            return valInCNY;
        } else if (currentCurrency === 'USD') {
            let rate = exchangeRates.CNY || 7.25;
            if (date && rawPricesData && rawPricesData.length > 0) {
                const row = rawPricesData.find(r => r.Date === date);
                if (row && row.USD_CNY_Rate) {
                    rate = parseFloat(row.USD_CNY_Rate) || rate;
                }
            } else if (rawPricesData && rawPricesData.length > 0) {
                const lastRow = rawPricesData[rawPricesData.length - 1];
                if (lastRow && lastRow.USD_CNY_Rate) {
                    rate = parseFloat(lastRow.USD_CNY_Rate) || rate;
                }
            }
            return valInCNY / rate;
        }
        return valInCNY;
    }

    function getCurrencySymbol() {
        if (currentCurrency === 'CNY') return '¥';
        if (currentCurrency === 'USD') return '$';
        return '¥';
    }

    function formatVal(valInCNY, decimals = 1) {
        const converted = convertValue(valInCNY);
        const unit = 't';
        return `${Number(converted).toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        })} ${getCurrencySymbol()}/${unit}`;
    }

    // Theme Management (Dark/Light mode)
    const themeToggleBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';

    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            themeToggleBtn.innerHTML = isLight ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        });
    }

    // Region translations map
    const REGION_MAP = {
        '华东': 'East China',
        '华南': 'South China',
        '华北': 'North China',
        '山东': 'Shandong',
        '江苏': 'Jiangsu',
        '宁波': 'Ningbo',
        '四川': 'Sichuan',
        '河南': 'Henan',
        '湖北': 'Hubei',
        '东北': 'Northeast',
        '西北': 'Northwest',
        '西南': 'Southwest',
        '山西': 'Shanxi',
        '浙江': 'Zhejiang',
        '辽宁': 'Liaoning',
        '吉林': 'Jilin',
        '云南': 'Yunnan',
        '广东': 'Guangdong',
        '广西': 'Guangxi',
        '河北': 'Hebei',
        '川渝': 'Sichuan-Chongqing',
        '重庆': 'Chongqing',
        '东莞': 'Dongguan',
        '苏北': 'North Jiangsu',
        '苏南': 'South Jiangsu',
        '锦州': 'Jinzhou',
        '黑龙江': 'Heilongjiang',
        '东营': 'Dongying',
        '华中': 'Central China',
        '山东鲁中': 'Central Shandong',
        '鲁东': 'East Shandong',
        '临沂': 'Linyi',
        '云南中东部地区': 'Central-East Yunnan',
        '内蒙古': 'Inner Mongolia',
        '唐山': 'Tangshan',
        '天津': 'Tianjin',
        '新疆北疆': 'North Xinjiang',
        '新疆南疆': 'South Xinjiang',
        '新疆疆外': 'Outside Xinjiang',
        '昭通': 'Zhaotong',
        '格尔木': 'Golmud',
        '榆林': 'Yulin',
        '济宁': 'Jining',
        '淄bo': 'Zibo',
        '淄博': 'Zibo',
        '甘肃': 'Gansu',
        'Fujian': 'Fujian',
        '福建': 'Fujian',
        '贵州': 'Guizhou',
        '鄂尔多斯北线': 'Ordos North',
        '鄂尔多斯南线': 'Ordos South',
        '银川': 'Yinchuan',
        '陕西关中': 'Shaanxi Guanzhong',
        '连云港': 'Lianyungang',
        '鲁西南': 'Southwest Shandong',
        '黄海西岸': 'West Yellow Sea Coast',
        '燕山石化': 'Yanshan Petrochemical',
        '弘润石化': 'Hongrun Petrochemical',
        'Yahoo': 'Yahoo Finance',
        'NWE': 'Northwest Europe',
        'Gulf': 'US Gulf Coast',
        'Global': 'Global / International',
        '山东 异构级': 'Shandong (Isomer)',
        '广东 异构级': 'Guangdong (Isomer)',
        '福建 异构级': 'Fujian (Isomer)',
        '广东 溶剂级': 'Guangdong (Solvent)',
        '京津 异构级': 'Beijing-Tianjin (Isomer)',
        '武汉 异构级': 'Wuhan (Isomer)',
        '江苏 异构级': 'Jiangsu (Isomer)',
        '江苏 溶剂级': 'Jiangsu (Solvent)',
        '宁波 异构级': 'Ningbo (Isomer)',
        '张家港 溶剂级': 'Zhangjiagang (Solvent)',
        '西南 异构级': 'Southwest (Isomer)',
        '中国': 'China',
        '吉林石化': 'Jilin Petrochemical',
        '广州石化': 'Guangzhou Petrochemical',
        '茂名石化': 'Maoming Petrochemical',
        '上海石化': 'Shanghai Petrochemical',
        '天津石化': 'Tianjin Petrochemical',
        '扬子炼化': 'Yangzi Refining',
        '扬子石化': 'Yangzi Petrochemical',
        '金陵石化': 'Jinling Petrochemical',
        '镇海炼化': 'Zhenhai Refining',
        '中沙天津': 'Sinopec Sabic Tianjin',
        '中海壳牌': 'CNOOC Shell',
        '中石化华东': 'Sinopec East China',
        '京博思达睿新材料': 'Jingbo Star New Materials',
        '兰州汇丰': 'Lanzhou Huifeng',
        '华星石化': 'Huaxing Petrochemical',
        '古雷石化': 'Gulei Petrochemical',
        '唐山旭阳': 'Tangshan Xuyang',
        '大庆石化': 'Daqing Petrochemical',
        '天津大沽': 'Tianjin Dagu',
        '安徽嘉玺': 'Anhui Jiaxi',
        '山东利华益': 'Shandong Lihuayi',
        '山东晟原': 'Shandong Shengyuan',
        '抚顺石化': 'Fushun Petrochemical',
        '河北盛腾': 'Hebei Shengteng',
        '浙江石化': 'Zhejiang Petrochemical',
        '淄博峻辰': 'Zibo Junchen',
        '渤化发展': 'Bohua Development',
        '燕山石化': 'Yanshan Petrochemical',
        '盛虹石化': 'Shenghong Petrochemical',
        '连云港石化': 'Lianyungang Petrochemical',
        '锦西石化': 'Jinxi Petrochemical',
        '青岛炼化': 'Qingdao Refining',
        '齐鲁石化': 'Qilu Petrochemical',
        '万通石化': 'Wantong Petrochemical',
        '双峰石化': 'Shuangfeng Petrochemical',
        '浙江宁波': 'Zhejiang Ningbo',
        '临汾': 'Linfen',
        '晋城': 'Jincheng',
        '山东中部': 'Central Shandong'
    };

    // Helper to translate Chinese regions and refinery names in a string
    function translateTextRegions(text) {
        if (!text) return "";
        let result = text;
        const keys = Object.keys(REGION_MAP).sort((a, b) => b.length - a.length);
        for (const key of keys) {
            if (result.includes(key)) {
                // Using split/join is a safe alternative to replaceAll in older browsers
                result = result.split(key).join(REGION_MAP[key]);
            }
        }
        return result;
    }

    // Product configurations using base product keys
    const TARGET_CONFIGS = {
        'Butyl_Acetate': {
            title: "Butyl Acetate",
            precursors: {
                butyl: 'Butyl_Acetate',
                butanol: 'n-Butanol',
                acetic: 'Acetic_Acid',
                methanol: 'Methanol',
                gas: 'Gas'
            },
            labels: {
                butyl: "Butyl Acetate (Target)",
                butanol: "n-Butanol (Feedstock)",
                acetic: "Acetic Acid (Feedstock)",
                methanol: "Methanol (Upstream)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'Butyl_Acetate',
                'n-Butanol',
                'Acetic_Acid',
                'Methanol',
                'Propylene'
            ]
        },
        'Ethyl_Acetate': {
            title: "Ethyl Acetate",
            precursors: {
                butyl: 'Ethyl_Acetate',
                butanol: 'Ethanol',
                acetic: 'Acetic_Acid',
                methanol: 'Methanol',
                gas: 'Gas'
            },
            labels: {
                butyl: "Ethyl Acetate (Target)",
                butanol: "Ethanol (Feedstock)",
                acetic: "Acetic Acid (Feedstock)",
                methanol: "Methanol (Upstream)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'Ethyl_Acetate',
                'Ethanol',
                'Acetic_Acid',
                'Methanol',
                'Ethylene'
            ]
        },
        'n_Propyl_Acetate': {
            title: "Propyl Acetate",
            precursors: {
                butyl: 'n_Propyl_Acetate',
                butanol: 'n-Propanol',
                acetic: 'Acetic_Acid',
                methanol: 'Methanol',
                gas: 'Gas'
            },
            labels: {
                butyl: "Propyl Acetate (Target)",
                butanol: "n-Propanol (Feedstock)",
                acetic: "Acetic Acid (Feedstock)",
                methanol: "Methanol (Upstream)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'n_Propyl_Acetate',
                'n-Propanol',
                'Acetic_Acid',
                'Methanol',
                'Propylene'
            ]
        },
        'Isopropyl_Acetate_Proxy': {
            title: "Isopropyl Acetate",
            precursors: {
                butyl: 'n_Propyl_Acetate', // Proxy
                butanol: 'Isopropanol',
                acetic: 'Acetic_Acid',
                methanol: 'Methanol',
                gas: 'Gas'
            },
            labels: {
                butyl: "Isopropyl Acetate (Proxy)",
                butanol: "Isopropanol (Feedstock)",
                acetic: "Acetic Acid (Feedstock)",
                methanol: "Methanol (Upstream)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'n_Propyl_Acetate',
                'Isopropanol',
                'Acetic_Acid',
                'Methanol',
                'Propylene'
            ]
        },
        'Acrylic_Acid': {
            title: "Acrylic Acid",
            precursors: {
                butyl: 'Acrylic_Acid',
                butanol: 'Propylene',
                acetic: 'Naphtha'
            },
            labels: {
                butyl: "Acrylic Acid (Target)",
                butanol: "Propylene (Feedstock)",
                acetic: "Naphtha (Upstream)"
            },
            defaultChecked: [
                'Acrylic_Acid',
                'Propylene',
                'Naphtha'
            ]
        },
        'Phthalic_Anhydride': {
            title: "Phthalic Anhydride",
            precursors: {
                butyl: 'Phthalic_Anhydride',
                butanol: 'o_Xylene',
                acetic: 'Reformed_Naphtha',
                methanol: 'Methanol'
            },
            labels: {
                butyl: "Phthalic Anhydride (Target)",
                butanol: "o-Xylene (Feedstock)",
                acetic: "Reformed Naphtha (Feedstock)",
                methanol: "Methanol (Upstream)"
            },
            defaultChecked: [
                'Phthalic_Anhydride',
                'o_Xylene',
                'Reformed_Naphtha',
                'Methanol'
            ]
        },
        'Maleic_Anhydride': {
            title: "Maleic Anhydride",
            precursors: {
                butyl: 'Maleic_Anhydride',
                butanol: 'n-Butanol',
                acetic: 'n-Butanol',
                methanol: 'n-Butanol',
                gas: 'Gas'
            },
            labels: {
                butyl: "Maleic Anhydride (Target)",
                butanol: "n-Butanol (Feedstock)",
                acetic: "n-Butanol (Feedstock)",
                methanol: "n-Butanol (Feedstock)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'Maleic_Anhydride',
                'n-Butanol',
                'Gas_Europe_TTF'
            ]
        },
        'MMA': {
            title: "Methyl Methacrylate (MMA)",
            precursors: {
                butyl: 'MMA',
                butanol: 'Acetone',
                acetic: 'Propylene',
                methanol: 'Methanol',
                gas: 'Gas'
            },
            labels: {
                butyl: "MMA (Target)",
                butanol: "Acetone (Feedstock)",
                acetic: "Propylene (Feedstock)",
                methanol: "Methanol (Upstream)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'MMA',
                'Acetone',
                'Propylene',
                'Methanol',
                'Gas_Europe_TTF'
            ]
        },
        'Butyl_Acrylate': {
            title: "Butyl Acrylate",
            precursors: {
                butyl: 'Butyl_Acrylate',
                butanol: 'Acrylic_Acid',
                acetic: 'n-Butanol',
                methanol: 'Propylene'
            },
            labels: {
                butyl: "Butyl Acrylate (Target)",
                butanol: "Acrylic Acid (Feedstock)",
                acetic: "n-Butanol (Feedstock)",
                methanol: "Propylene (Upstream)"
            },
            defaultChecked: [
                'Butyl_Acrylate',
                'Acrylic_Acid',
                'n-Butanol',
                'Propylene'
            ]
        },
        'VAM': {
            title: "Vinyl Acetate Monomer (VAM)",
            precursors: {
                butyl: 'VAM',
                butanol: 'Ethylene',
                acetic: 'Acetic_Acid',
                methanol: 'Methanol',
                gas: 'Gas'
            },
            labels: {
                butyl: "VAM (Target)",
                butanol: "Ethylene (Feedstock)",
                acetic: "Acetic Acid (Feedstock)",
                methanol: "Methanol (Upstream)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'VAM',
                'Ethylene',
                'Acetic_Acid',
                'Methanol',
                'Naphtha'
            ]
        },
        '2_EHA': {
            title: "2-Ethylhexyl Acrylate",
            precursors: {
                butyl: '2_EHA',
                butanol: 'Acrylic_Acid',
                acetic: 'Octanol',
                methanol: 'Propylene'
            },
            labels: {
                butyl: "2-EHA (Target)",
                butanol: "Acrylic Acid (Feedstock)",
                acetic: "2-Ethylhexanol (Feedstock)",
                methanol: "Propylene (Upstream)"
            },
            defaultChecked: [
                '2_EHA',
                'Acrylic_Acid',
                'Octanol',
                'Propylene'
            ]
        },
        'Ethyl_Acrylate': {
            title: "Ethyl Acrylate",
            precursors: {
                butyl: 'Ethyl_Acrylate',
                butanol: 'Acrylic_Acid',
                acetic: 'Ethanol',
                methanol: 'Ethylene'
            },
            labels: {
                butyl: "Ethyl Acrylate (Target)",
                butanol: "Acrylic Acid (Feedstock)",
                acetic: "Ethanol (Feedstock)",
                methanol: "Ethylene (Upstream)"
            },
            defaultChecked: [
                'Ethyl_Acrylate',
                'Acrylic_Acid',
                'Ethanol',
                'Ethylene',
                'Propylene'
            ]
        },
        'Acetone_V1': {
            title: "Acetone (Route 1)",
            precursors: {
                butyl: 'Acetone',
                butanol: 'Isopropanol',
                acetic: 'Propylene',
                methanol: 'Propylene'
            },
            labels: {
                butyl: "Acetone (Target)",
                butanol: "Isopropanol (Feedstock)",
                acetic: "Propylene (Feedstock)",
                methanol: "Propylene (Upstream)"
            },
            defaultChecked: [
                'Acetone',
                'Isopropanol',
                'Propylene'
            ]
        },
        'Acetone_V2': {
            title: "Acetone (Route 2)",
            precursors: {
                butyl: 'Acetone',
                butanol: 'Benzene',
                acetic: 'Propylene',
                methanol: 'Naphtha'
            },
            labels: {
                butyl: "Acetone (Target)",
                butanol: "Benzene (Feedstock)",
                acetic: "Propylene (Feedstock)",
                methanol: "Naphtha (Upstream)"
            },
            defaultChecked: [
                'Acetone',
                'Benzene',
                'Propylene',
                'Naphtha',
                'Reformed_Naphtha'
            ]
        },
        'Dibasic_Ester': {
            title: "Dibasic Ester (DBE)",
            precursors: {
                butyl: 'Dibasic_Ester',
                butanol: 'Dicarboxylic_Acid',
                acetic: 'Methanol',
                methanol: 'Cyclohexane',
                gas: 'Gas'
            },
            labels: {
                butyl: "Dibasic Ester (Target)",
                butanol: "Dicarboxylic Acid (Feedstock)",
                acetic: "Methanol (Feedstock)",
                methanol: "Cyclohexane (Upstream)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'Dibasic_Ester',
                'Dicarboxylic_Acid',
                'Methanol',
                'Cyclohexane',
                'Gas_Europe_TTF'
            ]
        },
        'Isopropanol': {
            title: "Isopropyl Alcohol (IPA)",
            precursors: {
                butyl: 'Isopropanol',
                butanol: 'Propylene',
                acetic: 'Naphtha',
                methanol: 'Naphtha'
            },
            labels: {
                butyl: "IPA (Target)",
                butanol: "Propylene (Feedstock)",
                acetic: "Naphtha (Upstream)",
                methanol: "Naphtha (Upstream)"
            },
            defaultChecked: [
                'Isopropanol',
                'Propylene',
                'Naphtha'
            ]
        },
        'PMA': {
            title: "Methoxy propyl acetate (MPA)",
            precursors: {
                butyl: 'PMA',
                butanol: 'Propylene_Oxide',
                acetic: 'Acetic_Acid',
                methanol: 'Methanol',
                gas: 'Gas'
            },
            labels: {
                butyl: "MPA (Target)",
                butanol: "Propylene Oxide (Feedstock)",
                acetic: "Acetic Acid (Feedstock)",
                methanol: "Methanol (Feedstock)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'PMA',
                'Propylene_Oxide',
                'Acetic_Acid',
                'Methanol'
            ]
        },
        'PM': {
            title: "Methoxy propanol (PM)",
            precursors: {
                butyl: 'PM',
                butanol: 'Propylene_Oxide',
                acetic: 'Methanol',
                methanol: 'Propylene',
                gas: 'Gas'
            },
            labels: {
                butyl: "PM (Target)",
                butanol: "Propylene Oxide (Feedstock)",
                acetic: "Methanol (Feedstock)",
                methanol: "Propylene (Upstream)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'PM',
                'Propylene_Oxide',
                'Methanol',
                'Propylene',
                'Gas_Europe_TTF'
            ]
        },
        'Isophthalic_Acid': {
            title: "Isophthalic Acid (PIA)",
            precursors: {
                butyl: 'Isophthalic_Acid',
                butanol: 'm_Xylene',
                acetic: 'Reformed_Naphtha',
                methanol: 'm_Xylene'
            },
            labels: {
                butyl: "Isophthalic Acid (Target)",
                butanol: "m-Xylene (Feedstock)",
                acetic: "Reformed Naphtha (Feedstock)",
                methanol: "m-Xylene (Feedstock)"
            },
            defaultChecked: [
                'Isophthalic_Acid',
                'm_Xylene',
                'Reformed_Naphtha'
            ]
        },
        'PTA': {
            title: "Purified Terephthalic Acid (PTA)",
            precursors: {
                butyl: 'PTA',
                butanol: 'Xylene',
                acetic: 'Reformed_Naphtha'
            },
            labels: {
                butyl: "PTA (Target)",
                butanol: "Mixed Xylene (Feedstock)",
                acetic: "Reformed Naphtha (Upstream)"
            },
            defaultChecked: [
                'PTA',
                'Xylene',
                'Reformed_Naphtha'
            ]
        },
        'n_Butanol': {
            title: "n-Butanol",
            precursors: {
                butyl: 'n-Butanol',
                butanol: 'Propylene',
                acetic: 'Naphtha',
                methanol: 'Naphtha',
                gas: 'Gas'
            },
            labels: {
                butyl: "n-Butanol (Target)",
                butanol: "Propylene (Feedstock)",
                acetic: "Naphtha (Upstream)",
                methanol: "Naphtha (Upstream)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'n-Butanol',
                'Propylene',
                'Naphtha',
                'Gas_Europe_TTF'
            ]
        },
        'Isobutanol': {
            title: "Isobutanol",
            precursors: {
                butyl: 'Isobutanol',
                butanol: 'Propylene',
                acetic: 'Naphtha',
                methanol: 'Naphtha',
                gas: 'Gas'
            },
            labels: {
                butyl: "Isobutanol (Target)",
                butanol: "Propylene (Feedstock)",
                acetic: "Naphtha (Upstream)",
                methanol: "Naphtha (Upstream)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'Isobutanol',
                'Propylene',
                'Naphtha',
                'Gas_Europe_TTF'
            ]
        },
        'MEK': {
            title: "Methyl Ethyl Ketone (MEK) Route 1",
            precursors: {
                butyl: 'MEK',
                butanol: '2_Butene',
                acetic: 'Naphtha',
                methanol: 'Naphtha'
            },
            labels: {
                butyl: "MEK (Target)",
                butanol: "2-Butene (Feedstock)",
                acetic: "Naphtha / Butane (Upstream)",
                methanol: "Naphtha / Butane (Upstream)"
            },
            defaultChecked: [
                'MEK',
                '2_Butene',
                'Naphtha'
            ]
        },
        'MEK_V2': {
            title: "Methyl Ethyl Ketone (MEK) Route 2",
            precursors: {
                butyl: 'MEK',
                butanol: '2_Butanol',
                acetic: '1_Butene_2_Butene',
                methanol: '1_Butene_2_Butene'
            },
            labels: {
                butyl: "MEK (Target)",
                butanol: "2-Butanol (Feedstock)",
                acetic: "1-But. / 2-Buteno (Upstream)",
                methanol: "1-But. / 2-Buteno (Upstream)"
            },
            defaultChecked: [
                'MEK',
                '2_Butanol',
                '1_Butene_2_Butene'
            ]
        },
        'Styrene': {
            title: "Styrene",
            precursors: {
                butyl: 'Styrene',
                benzene: 'Benzene',
                ethylene: 'Ethylene'
            },
            labels: {
                butyl: "Styrene (Target)",
                benzene: "Benzene (Feedstock)",
                ethylene: "Ethylene (Feedstock)"
            },
            defaultChecked: [
                'Styrene',
                'Benzene',
                'Ethylene'
            ]
        },
        'Toluene': {
            title: "Toluene",
            precursors: {
                butyl: 'Toluene',
                butanol: 'Benzene',
                acetic: 'Methanol',
                gas: 'Gas'
            },
            labels: {
                butyl: "Toluene (Target)",
                butanol: "Benzene (Feedstock)",
                acetic: "Methanol (Feedstock)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'Toluene',
                'Benzene',
                'Methanol',
                'Gas_Europe_TTF'
            ]
        },
        'Xylene': {
            title: "Mixed Xylene",
            precursors: {
                butyl: 'Xylene',
                butanol: 'Naphtha',
                acetic: 'Brent',
                gas: 'Gas'
            },
            labels: {
                butyl: "Mixed Xylene (Target)",
                butanol: "Naphtha (Feedstock)",
                acetic: "Brent Crude (Upstream)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'Xylene',
                'Naphtha',
                'Brent',
                'Gas_Europe_TTF'
            ]
        },
        'MEG': {
            title: "Monoethylene Glycol (MEG)",
            precursors: {
                butyl: 'MEG',
                butanol: 'EO',
                acetic: 'Ethylene',
                methanol: 'Naphtha',
                gas: 'Gas'
            },
            labels: {
                butyl: "MEG (Target)",
                butanol: "Ethylene Oxide (Feedstock)",
                acetic: "Ethylene (Upstream)",
                methanol: "Naphtha (Upstream)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'MEG',
                'EO',
                'Ethylene',
                'Naphtha',
                'Gas_Europe_TTF'
            ]
        },
        'DEG': {
            title: "Diethylene Glycol (DEG)",
            precursors: {
                butyl: 'DEG',
                butanol: 'EO',
                acetic: 'Ethylene',
                methanol: 'Naphtha',
                gas: 'Gas'
            },
            labels: {
                butyl: "DEG (Target)",
                butanol: "Ethylene Oxide (Feedstock)",
                acetic: "Ethylene (Upstream)",
                methanol: "Naphtha (Upstream)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'DEG',
                'EO',
                'Ethylene',
                'Naphtha',
                'Gas_Europe_TTF'
            ]
        },
        'PG': {
            title: "Propylene Glycol (PG)",
            precursors: {
                butyl: 'PG',
                butanol: 'Propylene_Oxide',
                acetic: 'Propylene',
                methanol: 'Naphtha',
                gas: 'Gas'
            },
            labels: {
                butyl: "Propylene Glycol (Target)",
                butanol: "Propylene Oxide (Feedstock)",
                acetic: "Propylene (Upstream)",
                methanol: "Naphtha (Upstream)",
                gas: "Natural Gas (Upstream)"
            },
            defaultChecked: [
                'PG',
                'Propylene_Oxide',
                'Propylene',
                'Naphtha',
                'Gas_Europe_TTF'
            ]
        },
        'Brent': {
            title: "Brent Crude",
            precursors: {
                butyl: 'Brent'
            },
            labels: {
                butyl: "Brent Crude Oil",
                butanol: "n-Butanol",
                acetic: "Acetic Acid",
                methanol: "Methanol"
            },
            defaultChecked: [
                'Brent'
            ]
        }
    };

    // Color palette for chart series (matching glassmorphism design)
    const CHART_COLORS = [
        '#06b6d4', // Electric Cyan (Target)
        '#6366f1', // Indigo (n-Butanol / Ethanol)
        '#10b981', // Emerald (Acetic Acid)
        '#f59e0b', // Amber (Methanol)
        '#f43f5e', // Rose (Propylene / Ethylene)
        '#a855f7', // Purple
        '#84cc16'  // Lime
    ];

    // Application state
    let currentProduct = 'Butyl_Acetate';
    let currentRegion = '华东';
    let currentTarget = '';      // Resolved complete column name
    let rawPricesData = [];      // Raw array of objects parsed from CSV
    let priceHeaders = [];       // Array of column names
    let alignedDates = [];       // Sorted array of Date objects
    let chartInstance = null;
    let selectedSeries = [];     // Column names selected for plot
    let timeRangeDays = "all";   // "all", 365, 180, 90
    let rawLeadLagData = [];     // Raw array of lead-lag results
    let KPI_COLUMNS = {};        // Dynamic columns mapping for KPIs
    let currentChartView = 'trend'; // 'trend' or 'seasonal'
    let seasonalMetricMode = 'price'; // 'price' or 'margin'
    let activeSidebarTab = 'signals'; // 'signals', 'procurement', 'feedstocks'
    
    // Pagination state
    let currentPage = 1;
    const rowsPerPage = 10;
    let filteredData = [];       // Data currently in table after search
    let financialForecastsData = null;
    let backtestResultsData = null;
    let whatIfState = {};
    let simulatedForecastPoints = null;
    const FORECAST_JSON_PATH = "oilchem_financial_forecasts.json?t=" + new Date().getTime();
    const BACKTEST_JSON_PATH = "oilchem_backtest_results.json?t=" + new Date().getTime();

    // ==========================================
    // INITIALIZATION & LOADING
    // ==========================================
    loadData();

    async function loadData() {
        try {
            // Fetch exchange rates first
            await fetchExchangeRates();

            // Fetch forecasts first
            try {
                const fResponse = await fetch(FORECAST_JSON_PATH);
                if (fResponse.ok) {
                    financialForecastsData = await fResponse.json();
                }
            } catch (err) {
                console.warn("Could not load financial forecasts json:", err);
            }

            // Fetch backtest results
            try {
                const bResponse = await fetch(BACKTEST_JSON_PATH);
                if (bResponse.ok) {
                    backtestResultsData = await bResponse.json();
                }
            } catch (err) {
                console.warn("Could not load backtest results json:", err);
            }

            // 1. Fetch Prices CSV
            const pricesResponse = await fetch(PRICES_CSV_PATH);
            if (!pricesResponse.ok) throw new Error("Failed to load prices CSV.");
            const pricesText = await pricesResponse.text();

            // 2. Fetch and parse Lead-Lag CSV, then Prices CSV sequentially using callbacks
            const leadLagResponse = await fetch(LEAD_LAG_CSV_PATH);
            if (leadLagResponse.ok) {
                const leadLagText = await leadLagResponse.text();
                Papa.parse(leadLagText, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true,
                    complete: function(leadLagResult) {
                        rawLeadLagData = leadLagResult.data;
                        
                        // Parse Prices CSV after Lead-Lag is ready
                        Papa.parse(pricesText, {
                            header: true,
                            skipEmptyLines: true,
                            dynamicTyping: true,
                            complete: function(pricesResult) {
                                processPrices(pricesResult.data);
                                if (rawLeadLagData.length > 0 && currentTarget) {
                                    displayLeadLag(rawLeadLagData);
                                }
                            }
                        });
                    }
                });
            } else {
                console.warn("Could not find lead-lag results file.");
                // Fallback: parse prices anyway
                Papa.parse(pricesText, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true,
                    complete: function(pricesResult) {
                        processPrices(pricesResult.data);
                        document.getElementById('lead-lag-list-container').innerHTML = 
                            `<div class="lead-lag-info"><p>No lead-lag results available.</p></div>`;
                    }
                });
            }

        } catch (error) {
            console.error("Initialization Error:", error);
            showErrorState();
        }
    }

    const FEEDSTOCK_BENCHMARKS = {
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
        'Xylene': 'Xylene_Domestic_山东',
        'Ethylbenzene': 'Ethylbenzene_Domestic_吉林石化',
        'Acrylic_Acid': 'Acrylic_Acid_Domestic_华东',
        'Toluene': 'Toluene_Domestic_山东',
        'EO': 'EO_Domestic_华东',
        'Propylene_Oxide': 'Propylene_Oxide_Domestic_华东',
        'Naphtha': 'Naphtha_Domestic_中国'
    };

    // Helper to resolve the correct column name with region fallback
    function resolveColumnForRegion(baseProd, region, isFeedstock = false) {
        if (!baseProd) return null;
        const cleanBase = baseProd.replace(/-/g, '_');
        const mainReg = getMainRegionForSubRegion(region);
        
        if (isFeedstock && mainReg !== 'Europe' && mainReg !== 'Global' && (FEEDSTOCK_BENCHMARKS[baseProd] || FEEDSTOCK_BENCHMARKS[cleanBase])) {
            const col = FEEDSTOCK_BENCHMARKS[baseProd] || FEEDSTOCK_BENCHMARKS[cleanBase];
            if (priceHeaders.includes(col)) return col;
        }

        // 1. Find exact match for baseProd/cleanBase and region
        const exact = priceHeaders.find(h => (h.startsWith(baseProd + '_') || h.startsWith(cleanBase + '_')) && h.includes(region));
        if (exact) return exact;
        const partial = priceHeaders.find(h => (h.includes(baseProd) || h.includes(cleanBase)) && h.includes(region));
        if (partial) return partial;

        // 1.5 Fallback to Europe or Global precursor columns if in Europe/Global region
        if (mainReg === 'Europe') {
            const euFallback = priceHeaders.find(h => 
                h.startsWith(baseProd + '_Europe_') || h.startsWith(cleanBase + '_Europe_') || 
                (h.includes(baseProd) && h.includes('_Europe_')) || (h.includes(cleanBase) && h.includes('_Europe_'))
            );
            if (euFallback) return euFallback;
        }
        if (mainReg === 'Global') {
            const globalFallback = priceHeaders.find(h => 
                h.startsWith(baseProd + '_Global_') || h.startsWith(cleanBase + '_Global_') ||
                (h.includes(baseProd) && h.includes('_Global_')) || (h.includes(cleanBase) && h.includes('_Global_'))
            );
            if (globalFallback) return globalFallback;
            const euFallback = priceHeaders.find(h => 
                h.startsWith(baseProd + '_Europe_') || h.startsWith(cleanBase + '_Europe_') || 
                (h.includes(baseProd) && h.includes('_Europe_')) || (h.includes(cleanBase) && h.includes('_Europe_'))
            );
            if (euFallback) return euFallback;
        }

        // 2. Dynamic Fallback: Try to find a region for baseProd that has computed Lead-Lag data for currentTarget
        if (rawLeadLagData && rawLeadLagData.length > 0) {
            const targetRows = rawLeadLagData.filter(item => 
                item.Target === currentTarget && 
                item.Feature && 
                (item.Feature.includes(baseProd) || item.Feature.includes(cleanBase))
            );
            if (targetRows.length > 0) {
                // Sort by absolute correlation to pick the strongest reference market
                targetRows.sort((a, b) => Math.abs(b.Max_Correlation) - Math.abs(a.Max_Correlation));
                const bestFeature = targetRows[0].Feature;
                // Verify it exists in priceHeaders
                if (priceHeaders.includes(bestFeature)) return bestFeature;
            }
        }

        // 3. Fallback: exact baseProd but restricted to active region group to avoid mixing China/Europe
        const fallbackExact = priceHeaders.find(h => {
            if (!(h.startsWith(baseProd + '_') || h.startsWith(cleanBase + '_'))) return false;
            const hReg = getMainRegionForSubRegion(h);
            return hReg === mainReg || hReg === 'Global' || (mainReg === 'Global' && hReg === 'Europe') || (mainReg === 'Europe' && hReg === 'Global');
        });
        if (fallbackExact) return fallbackExact;
        
        // 4. Fallback: any partial match restricted to active region group
        const fallbackPartial = priceHeaders.find(h => {
            if (!(h.includes(baseProd) || h.includes(cleanBase))) return false;
            const hReg = getMainRegionForSubRegion(h);
            return hReg === mainReg || hReg === 'Global' || (mainReg === 'Global' && hReg === 'Europe') || (mainReg === 'Europe' && hReg === 'Global');
        });
        return fallbackPartial || null;
    }

    function resolveTargetColumn(product, region) {
        const mainReg = getMainRegionForSubRegion(region);
        const prefix = mainReg === 'Europe' ? 'Europe' : (mainReg === 'Global' ? 'Global' : 'Domestic');
        const fallbackReg = mainReg === 'Europe' ? 'DDP Northwest Europe' : (mainReg === 'Global' ? 'Global' : '华东');

        if (product === 'Isopropyl_Acetate_Proxy') {
            return priceHeaders.find(h => h.includes('n_Propyl_Acetate') && h.includes(region)) || `n_Propyl_Acetate_${prefix}_${fallbackReg}`;
        }
        if (product === 'Acetone_V1' || product === 'Acetone_V2') {
            return priceHeaders.find(h => h.includes('Acetone') && h.includes(region)) || `Acetone_${prefix}_${fallbackReg}`;
        }
        if (product === 'Xylene') {
            return priceHeaders.find(h => h.includes('Xylene') && !h.includes('o_Xylene') && !h.includes('m_Xylene') && h.includes(region)) || `Xylene_${prefix}_${fallbackReg}`;
        }
        return priceHeaders.find(h => h.includes(product) && h.includes(region)) || `${product}_${prefix}_${region}`;
    }

    // Extract regions available in CSV for a given product
    function getAvailableRegionsForProduct(product) {
        if (product === 'Brent') {
            return ['Global'];
        }
        let basePattern = product;
        if (product === 'Isopropyl_Acetate_Proxy') {
            basePattern = 'n_Propyl_Acetate';
        } else if (product === 'Acetone_V1' || product === 'Acetone_V2') {
            basePattern = 'Acetone';
        }
        
        const matchedCols = priceHeaders.filter(h => {
            if (product === 'Xylene') {
                return (h.startsWith(basePattern + '_Domestic_') || h.startsWith(basePattern + '_Europe_') || h.startsWith(basePattern + '_Global_')) && !h.includes('o_Xylene') && !h.includes('m_Xylene');
            }
            return h.startsWith(basePattern + '_Domestic_') || h.startsWith(basePattern + '_Europe_') || h.startsWith(basePattern + '_Global_');
        });

        const regions = [];
        matchedCols.forEach(col => {
            let subRegion = col;
            for (const prefix of [basePattern + '_Domestic_', basePattern + '_Europe_', basePattern + '_Global_']) {
                if (col.startsWith(prefix)) {
                    subRegion = col.substring(prefix.length);
                    break;
                }
            }
            if (subRegion && !regions.includes(subRegion)) {
                regions.push(subRegion);
            }
        });
        return regions.length > 0 ? regions : ['华东'];
    }

    function getDefaultRegionForProduct(product) {
        const defaultMap = {
            'Butyl_Acetate': '华东',
            'Ethyl_Acetate': '华东',
            'n_Propyl_Acetate': '华东',
            'Isopropyl_Acetate_Proxy': '华东',
            'Acrylic_Acid': '华东',
            'Phthalic_Anhydride': '华东',
            'Maleic_Anhydride': '山东',
            'MMA': '华东',
            'Butyl_Acrylate': '华东',
            'VAM': '华东',
            '2_EHA': '华东',
            'Ethyl_Acrylate': '华东',
            'Acetone_V1': '华东',
            'Acetone_V2': '华东',
            'Dibasic_Ester': '华东',
            'Isopropanol': '江苏',
            'PMA': '华东',
            'PM': '华东',
            'MEG': '华东',
            'DEG': '张家港',
            'PG': '山东',
            'Xylene': '山东',
            'Brent': 'Global'
        };
        return defaultMap[product] || '华东';
    }

    // Mapping sub-regions to Main Region Groups
    const MAIN_REGION_GROUPS = {
        'Chine': ['华东', '华南', '华北', '山东', '江苏', '宁波', '四川', '河南', '湖北', '东北', '西北', '西南', '山西', '浙江', '辽宁', '吉林', '云南', '广东', '广西', '河北', '川渝', '重庆', '东莞', '苏北', '苏南', '锦州', '黑龙江', '东营', '华中', '山东魯中', '山东鲁中', '鲁东', '临沂', '裂解', '醚后', '万通石化', '上海石化', '东方华龙', '东明石化', '东辰石化', '中化泉州', '中海外能源', '中海精细', '丰利石化', '九江石化', '亚通石化', '京博石化', '北海炼厂', '华北石化', '华星石化', '华联石化', '呼和浩特石化', '大庆中蓝', '大庆炼化', '大港地区', '大港石化', '大连石化', '大连西太石化', '天弘化学', '宁夏宝丰', '山东垦利', '山东海科', '延安炼厂', '弘润石化', '扬州石化', '无棣鑫岳', '昆仑东营港', '昌邑石化', '武汉石化', '永鑫化工', '汇丰石化', '江苏新海', '沈阳蜡化', '沧州炼厂', '沧州西部', '济南炼厂', '海科瑞林', '淮安清江石化', '湖北金澳', '湛江东兴', '潍坊润星', '燕山石化', '石家庄炼化', '福建盛桐', '胜利油田', '茂名石化', '荆门石化', '西太地区', '辽河石化', '金陵石化', '鑫泰石化', '锦州石化', '青岛石化', '万州 工业', '万州 民用', '三亚 工业', '三亚 民用', '东莞 车用', '乌鲁木齐 工业', '乌鲁木齐 民用', '乌鲁木齐 车用', '佛山 工业', '佛山 民用', '佛山 车用', '兰州 工业', '兰州 民用', '兰州 车用', '南京 工业', '南京 民用', '南京 车用', '南宁 民用', '南昌 民用', '咸阳 民用', '哈尔滨 工业', '哈尔滨 民用', '嘉兴 工业', '嘉兴 民用', '太原 工业', '太原 民用', '威海 民用', '宁波 工业', '宁波 民用', '宜昌 工业', '宝鸡 民用', '广州 工业', '广州 民用', '廊坊 工业', '扬州 工业', '日照 工业', '杭州 工业', '杭州 民用', '柳州 民用', '桂林 工业', '武汉 工业', '武汉 民用', '武汉 车用', '江西 工业', '沈阳 工业', '沈阳 民用', '沧州 工业', '济南 民用', '济南 车用', '济宁 民用', '海口 工业', '淄博 工业', '淄博 民用', '深圳 工业', '深圳 民用', '温州 工业', '温州 民用', '湖州 工业', '湖州 民用', '滨州 车用', '潍坊 工业', '烟台 民用', '珠海 工业', '珠海 民用', '石家庄 工业', '石家庄 民用', '福州 工业', '福州 民用', '聊城 工业', '聊城 民用', '舟山 工业', '舟山 民用', 'Jingmen', '荆门 工业', '西安 工业', '西安 民用', '西安 车用', '贵阳 工业', '贵阳 民用', '辽阳 工业', '辽阳 民用', '郑州 工业', '郑州 民用', '郑州 车用', '重庆 工业', '重庆 民用', '重庆 车用', '金华 工业', '金华 民用', '铜川 民用', '锦州 工业', '锦州 民用', '长沙 工业', '长沙 民用', '长沙 车用', '青岛 车用', '西咸', '西宁', '西安', '吉林石化', '广州石化', '茂名石化', '扬子石化', '镇海炼化', '中沙天津', '中海壳牌', '中石化华东', '京博思达睿新材料', '兰州汇丰', '兰州石化', '古雷石化', '唐山旭阳', '大庆石化', '天津大沽', '安徽嘉玺', '山东利华益', '山东晟原', '抚顺石化', '河北盛腾', '浙江石化', '淄博峻辰', '渤化发展', '盛虹石化', '菏泽玉皇', '连云港石化', '锦西石化', '青岛炼化', '齐鲁石化', '京津', '张家港', '西南 异构级', '华东 醚后C4', '上海石化 醚后C4', '东方华龙 醚后C4', '东明石化 醚后C4', '东辰石化 醚后C4', '中化泉州 醚后C4', '中海外能源 醚后C4', '中海精细 醚后C4', '丰利石化 醚后C4', '九江石化 醚后C4', '亚通石化 醚后C4', '京博石化 醚后C4', '北海炼厂 醚后C4', '华北石化 醚后C4', '华星石化 醚后C4', '华联石化 醚后C4', '呼和浩特石化 醚后C4', '大庆中蓝 醚后C4', '大庆炼化 醚后C4', '大港地区 醚后C4', '大港石化 醚后C4', '大连石化 醚后C4', '大连西太石化 醚后C4', '天弘化学 醚后C4', '宁夏宝丰 醚后C4', '山东垦利 醚后C4', '山东海科 醚后C4', '延安炼厂 醚后C4', '弘润石化 醚后C4', '扬州石化 醚后C4', '无棣鑫岳 醚后C4', '昆仑东营港 醚后C4', '昌邑石化 醚后C4', '武汉石化 醚后C4', '永鑫化工 醚后C4', '汇丰石化 醚后C4', '江苏新海 醚后C4', '沈阳蜡化 醚后C4', '沧州炼厂 醚后C4', '沧州西部 醚后C4', '济南炼厂 醚后C4', '海科瑞林 醚后C4', '淮安清江石化 醚后C4', '湖北金澳 醚后C4', '湛江东兴 醚后C4', '潍坊润星 醚后C4', '石家庄炼化 醚后C4', '福建盛桐 醚后C4', '胜利油田 醚后C4', '茂名石化 醚后C4', '荆门石化 醚后C4', '西太地区 醚后C4', '辽河石化 醚后C4', '金陵石化 醚后C4', '鑫泰石化 醚后C4', '锦州石化 醚后C4', '青岛石化 醚后C4', '张家港 溶剂级', '吉林 电子级无水', '吉林 普级', '吉林 无水', '吉林 优级', '黑龙江 优级', '黑龙江 普级', '黑龙江 电子级无水', '黑龙江 无水', '苏北 无水', '苏北 普级', '苏南 普级', '河南 优级', '河南 无水', '河南 电子级无水', '河北 优级', '河北 无水', '山东 木薯无水', '山东 木薯普级', '山东 优级', '山东 小麦普级', '安徽 普级', '安徽 无水', '四川 玉米95', '云南 普级', '东莞 普级', '锦州 普级', '广东 木薯95', '广东 木薯无水', '广东 糖蜜95', '广西 木薯95', '广西 木薯无水', '广西 糖蜜95', '扬子炼化', '金陵石化', '华东 萘法', '广东 萘法', '河北 萘法', '黄海西岸', '鲁西南', '山东 固体', '山东 液体', '江苏 固体', '江苏 液体', '山西 固体', '河南 固体', '河南 液体', '河北 液体', '浙江 液体', '顺酐 华南 固体', '华南 固体', '华南 液体', '顺酐 华南 液体', '顺酐 山东 固体', '顺酐 山东 液体', '顺酐 江苏 固体', '顺酐 江苏 液体', '顺酐 山西 固体', '顺酐 河南 固体', '顺酐 河南 液体', '顺酐 浙江 液体', '顺酐 河北 液体', '顺酐 西北 固体', '西北 固体', '鲁东 液体', '东营 国标', '临汾 国标', '临沂 国标', '云南中东部地区 国标', '内蒙古 国标', '唐山 国标', '四川 国标', '天津 国标', '山东中部 国标', '山西 国标', '川渝 国标', '广东 进口', '广西 国标', '新疆北疆 国标', '新疆南疆 国标', '新疆疆外 国标', '昭通 国标', '晋城 国标', '格尔木 国标', '榆林 国标', '河北 国标', '济宁 国标', '淄博 国标', '甘肃 国标', '福建 进口', '贵州 国标', '鄂尔多斯北线 国标', '鄂尔多斯南线 国标', '重庆 国标', '银川 国标', '陕西关中 国标', '山东 加氢石脑油', '山东 直馏石脑油', '东营 加氢石脑油', '东营 直馏石脑油', '淄博 直馏石脑油', '滨州 加氢石脑油', '滨州 直馏石脑油', '潍坊 加氢石脑油', '东北 98', '华南 98', '安徽 98', '山东 60', '山东 68', '山东 98', '广东 68', '江苏 68', '江苏 98', '河南 60', '河南 68', '河南 98', '浙江 98', '甘宁 98', '皖北 68', '皖北 98', '皖南 68', '皖南 98', '西北 98', '兰州汇丰', '兰州石化', '华星石化', '华锦石化', '吉林石化', '大庆石化', '天津大沽', '山东利华益', '山东晟原', '广州石化', '抚顺石化', '河北盛腾', '浙江石化', '茂名石化', '菏泽玉皇', '锦州石化', '青岛炼化', '齐鲁石化', '京津 异构级', '宁波 异构级', '山东 异构级', '广东 异构级', '广东 溶剂级', '张家港 溶剂级', '武汉 异构级', '江苏 异构级', '江苏 溶剂级', '福建 异构级', '西南 异构级', '华中 固体', '华北 固体', '华东 固体', '华南 固体', '山东 固体', '江苏 固体', '浙江 固体', '四川 固体', '吉林 固体', '东北 固体', '西北 固体', '山西 固体', '川渝 固体', '河北 固体', '河南 固体', '北京 固体', '天津 固体', '中国 85-99', '山东 低纯', '山东 高纯', '顺酐 鲁东 液体', '华东 聚合级', '山东 聚合级', '吉林石化 电子级无水', '上海', '东北', '福建'],
        'Europe': ['Europe', 'NWE', 'Northwest Europe', '西北欧', '西北欧鹿特丹', 'FD NWE', 'FOB Rotterdam', 'DDP Northwest Europe', 'FL FD NWE', 'FL FOB Rotterdam', 'MN FD NWE', 'FCA ARA', 'T2 FOB Rotterdam', 'T2 FD NWE', 'FD NWE Spot', 'FOB ARA', 'CIF ARA', 'Industrial Grade FCA NWE', 'Pharmaceutical Grade FCA NWE', 'Chem Grade CIF NWE', 'DDP Northwest Europe'],
        'Global': ['Global', 'International', 'Yahoo', 'Gulf', 'US Gulf Coast', '美国', '美国海湾', '日本', '韩国', '东南亚', '中国']
    };

    function getMainRegionForSubRegion(subRegion) {
        if (!subRegion) return 'Chine';
        const strSub = String(subRegion);
        for (const [mainReg, subs] of Object.entries(MAIN_REGION_GROUPS)) {
            if (subs.includes(strSub)) return mainReg;
        }
        if (strSub.includes('Europe') || strSub.includes('NWE') || strSub.includes('Rotterdam') || strSub.includes('ARA')) {
            return 'Europe';
        }
        return 'Chine'; // Default fallback
    }

    // Populate region select dynamically (two-level hierarchy)
    function populateRegionSelector(product) {
        const mainRegionSelect = document.getElementById('market-main-region-select');
        const regionSelect = document.getElementById('market-region-select');
        if (!mainRegionSelect || !regionSelect) return;

        mainRegionSelect.innerHTML = "";
        regionSelect.innerHTML = "";

        const subRegions = getAvailableRegionsForProduct(product);

        // Determine available Main Regions
        const availableMainRegions = [];
        subRegions.forEach(subReg => {
            const mainReg = getMainRegionForSubRegion(subReg);
            if (!availableMainRegions.includes(mainReg)) {
                availableMainRegions.push(mainReg);
            }
        });

        // Always include Europe to "prepare the terrain" as requested
        if (!availableMainRegions.includes('Europe')) {
            availableMainRegions.push('Europe');
        }

        // Sort available main regions: China, Europe, Global
        const order = ['Chine', 'Europe', 'Global'];
        const sortedMainRegions = order.filter(r => availableMainRegions.includes(r));
        availableMainRegions.forEach(r => {
            if (!sortedMainRegions.includes(r)) sortedMainRegions.push(r);
        });

        const mainRegionMap = {
            'Chine': 'China',
            'Europe': 'Europe',
            'Global': 'Global / International'
        };

        sortedMainRegions.forEach(mainReg => {
            const opt = document.createElement('option');
            opt.value = mainReg;
            opt.textContent = mainRegionMap[mainReg] || mainReg;
            mainRegionSelect.appendChild(opt);
        });

        // Resolve product default region
        const preferredSubDefault = getDefaultRegionForProduct(product);
        const preferredMainDefault = getMainRegionForSubRegion(preferredSubDefault);

        let activeMainRegion = sortedMainRegions[0];
        if (sortedMainRegions.includes(preferredMainDefault)) {
            activeMainRegion = preferredMainDefault;
        }
        mainRegionSelect.value = activeMainRegion;

        populateSubRegionSelector(product, activeMainRegion);
    }

    function populateSubRegionSelector(product, mainRegion) {
        const regionSelect = document.getElementById('market-region-select');
        if (!regionSelect) return;
        regionSelect.innerHTML = "";

        const subRegions = getAvailableRegionsForProduct(product);
        const filteredSubRegions = subRegions.filter(subReg => getMainRegionForSubRegion(subReg) === mainRegion);

        const subregionLabel = document.getElementById('market-subregion-label');

        if (filteredSubRegions.length === 0) {
            const opt = document.createElement('option');
            opt.value = mainRegion;
            opt.textContent = `No subregion (${mainRegion})`;
            regionSelect.appendChild(opt);
            regionSelect.disabled = true;
            if (subregionLabel) subregionLabel.style.opacity = '0.5';
            currentRegion = mainRegion;
        } else {
            regionSelect.disabled = false;
            if (subregionLabel) subregionLabel.style.opacity = '1';

            filteredSubRegions.forEach(subReg => {
                const opt = document.createElement('option');
                opt.value = subReg;
                opt.textContent = REGION_MAP[subReg] || subReg;
                regionSelect.appendChild(opt);
            });

            const preferredSubDefault = getDefaultRegionForProduct(product);
            let defaultSubRegion = filteredSubRegions[0];
            if (filteredSubRegions.includes(preferredSubDefault)) {
                defaultSubRegion = preferredSubDefault;
            } else {
                const preferredRegionsOrder = ['华东', '山东', '华南', '华北', '江苏', 'Global', 'Europe'];
                for (const pref of preferredRegionsOrder) {
                    if (filteredSubRegions.includes(pref)) {
                        defaultSubRegion = pref;
                        break;
                    }
                }
            }
            regionSelect.value = defaultSubRegion;
            currentRegion = defaultSubRegion;
        }
    }

    // Update active KPI columns based on current target config and region
    function updateKPIColumns() {
        const config = TARGET_CONFIGS[currentProduct];
        if (!config) return;
        KPI_COLUMNS = {
            butyl: resolveColumnForRegion(config.precursors.butyl, currentRegion, false),
            butanol: resolveColumnForRegion(config.precursors.butanol, currentRegion, true),
            acetic: resolveColumnForRegion(config.precursors.acetic, currentRegion, true),
            methanol: resolveColumnForRegion(config.precursors.methanol, currentRegion, true),
            gas: resolveColumnForRegion(config.precursors.gas, currentRegion, true)
        };
    }

    // Check if a header is related to the active product
    // Helper to check if a header matches a product name exactly (avoiding substring collisions)
    function headerMatches(header, key) {
        if (!header) return false;
        if (key === 'Propylene') {
            return header.includes('Propylene') && !header.includes('Propylene_Oxide') && !header.includes('Propylene_Glycol') && !header.includes('PG');
        }
        if (key === 'Ethylene') {
            return header.includes('Ethylene') && !header.includes('Ethylene_Glycol') && !header.includes('Ethylene_Oxide') && !header.includes('EO_') && !header.includes('MEG') && !header.includes('DEG');
        }
        if (key === 'Xylene') {
            return header.includes('Xylene') && !header.includes('o_Xylene') && !header.includes('m_Xylene');
        }
        if (key === 'Benzene') {
            return header.includes('Benzene') && !header.includes('Ethylbenzene');
        }
        return header.includes(key);
    }

    // Check if a header is related to the active product
    function isColumnRelated(header, product) {
        if (!header) return false;
        if (product === 'Butyl_Acetate') {
            return headerMatches(header, 'Butyl_Acetate') || 
                   headerMatches(header, 'n-Butanol') || 
                   headerMatches(header, 'Acetic_Acid') || 
                   headerMatches(header, 'Methanol') || 
                   headerMatches(header, 'Propylene') ||
                   headerMatches(header, 'Gas');
        } else if (product === 'Ethyl_Acetate') {
            return headerMatches(header, 'Ethyl_Acetate') || 
                   headerMatches(header, 'Ethanol') || 
                   headerMatches(header, 'Acetic_Acid') || 
                   headerMatches(header, 'Ethylene') || 
                   headerMatches(header, 'Methanol') ||
                   headerMatches(header, 'Gas');
        } else if (product === 'n_Propyl_Acetate' || product === 'Isopropyl_Acetate_Proxy') {
            return headerMatches(header, 'n_Propyl_Acetate') || 
                   headerMatches(header, 'n-Propanol') || 
                   headerMatches(header, 'Isopropanol') || 
                   headerMatches(header, 'Acetic_Acid') || 
                   headerMatches(header, 'Propylene') || 
                   headerMatches(header, 'Methanol') ||
                   headerMatches(header, 'Gas');
        } else if (product === 'Acrylic_Acid') {
            return headerMatches(header, 'Acrylic_Acid') || 
                   headerMatches(header, 'Propylene') || 
                   headerMatches(header, 'Naphtha') || 
                   headerMatches(header, 'Methanol');
        } else if (product === 'Phthalic_Anhydride') {
            return headerMatches(header, 'Phthalic_Anhydride') || 
                   headerMatches(header, 'o_Xylene') || 
                   headerMatches(header, 'Reformed_Naphtha') || 
                   headerMatches(header, 'Methanol');
        } else if (product === 'Maleic_Anhydride') {
            return headerMatches(header, 'Maleic_Anhydride') || 
                   headerMatches(header, 'n-Butanol') ||
                   headerMatches(header, 'Gas');
        } else if (product === 'MMA') {
            return headerMatches(header, 'MMA') || 
                   headerMatches(header, 'Acetone') || 
                   headerMatches(header, 'Propylene') || 
                   headerMatches(header, 'Methanol') ||
                   headerMatches(header, 'Gas');
        } else if (product === 'Butyl_Acrylate') {
            return headerMatches(header, 'Butyl_Acrylate') || 
                   headerMatches(header, 'Acrylic_Acid') || 
                   headerMatches(header, 'n-Butanol') || 
                   headerMatches(header, 'Propylene') || 
                   headerMatches(header, 'Methanol');
        } else if (product === 'VAM') {
            return headerMatches(header, 'VAM') || 
                   headerMatches(header, 'Ethylene') || 
                   headerMatches(header, 'Acetic_Acid') || 
                   headerMatches(header, 'Naphtha') || 
                   headerMatches(header, 'Ethanol') || 
                   headerMatches(header, 'Methanol') ||
                   headerMatches(header, 'Gas');
        } else if (product === '2_EHA') {
            return headerMatches(header, '2_EHA') || 
                   headerMatches(header, 'Acrylic_Acid') || 
                   headerMatches(header, 'Octanol') || 
                   headerMatches(header, 'Propylene') || 
                   headerMatches(header, 'Methanol');
        } else if (product === 'Ethyl_Acrylate') {
            return headerMatches(header, 'Ethyl_Acrylate') || 
                   headerMatches(header, 'Acrylic_Acid') || 
                   headerMatches(header, 'Ethanol') || 
                   headerMatches(header, 'Propylene') || 
                   headerMatches(header, 'Ethylene');
        } else if (product === 'Acetone_V1') {
            return headerMatches(header, 'Acetone') || 
                   headerMatches(header, 'Isopropanol') || 
                   headerMatches(header, 'Propylene');
        } else if (product === 'Acetone_V2') {
            return headerMatches(header, 'Acetone') || 
                   headerMatches(header, 'Benzene') || 
                   headerMatches(header, 'Propylene') || 
                   headerMatches(header, 'Reformed_Naphtha') || 
                   headerMatches(header, 'Naphtha');
        } else if (product === 'Dibasic_Ester') {
            return headerMatches(header, 'Dibasic_Ester') || 
                   headerMatches(header, 'Dicarboxylic_Acid') || 
                   headerMatches(header, 'Methanol') || 
                   headerMatches(header, 'Cyclohexane') ||
                   headerMatches(header, 'Gas');
        } else if (product === 'Isopropanol') {
            return headerMatches(header, 'Isopropanol') || 
                   headerMatches(header, 'Propylene') || 
                   headerMatches(header, 'Naphtha');
        } else if (product === 'PMA') {
            return headerMatches(header, 'PMA') || 
                   headerMatches(header, 'Propylene_Oxide') || 
                   headerMatches(header, 'Acetic_Acid') || 
                   headerMatches(header, 'Methanol') ||
                   headerMatches(header, 'Gas');
        } else if (product === 'PM') {
            return headerMatches(header, 'PM') || 
                   headerMatches(header, 'Propylene_Oxide') || 
                   headerMatches(header, 'Methanol') || 
                   headerMatches(header, 'Propylene') ||
                   headerMatches(header, 'Gas');
        } else if (product === 'Isophthalic_Acid') {
            return headerMatches(header, 'Isophthalic_Acid') || 
                   headerMatches(header, 'm_Xylene') || 
                   headerMatches(header, 'Reformed_Naphtha');
        } else if (product === 'PTA') {
            return headerMatches(header, 'PTA') || 
                   headerMatches(header, 'Xylene') || 
                   headerMatches(header, 'Reformed_Naphtha');
        } else if (product === 'n_Butanol') {
            return headerMatches(header, 'n-Butanol') || 
                   headerMatches(header, 'Propylene') || 
                   headerMatches(header, 'Naphtha') ||
                   headerMatches(header, 'Gas');
        } else if (product === 'Isobutanol') {
            return headerMatches(header, 'Isobutanol') || 
                   headerMatches(header, 'Propylene') || 
                   headerMatches(header, 'Naphtha') ||
                   headerMatches(header, 'Gas');
        } else if (product === 'MEK') {
            return headerMatches(header, 'MEK') || 
                   headerMatches(header, '2_Butene') || 
                   headerMatches(header, 'Naphtha') || 
                   headerMatches(header, 'n_Butane');
        } else if (product === 'MEK_V2') {
            return headerMatches(header, 'MEK') || 
                   headerMatches(header, '2_Butanol') || 
                   headerMatches(header, '1_Butene_2_Butene');
        } else if (product === 'Styrene') {
            return headerMatches(header, 'Styrene') || 
                   headerMatches(header, 'Ethylbenzene') || 
                   headerMatches(header, 'Propylene') || 
                   headerMatches(header, 'Reformed_Naphtha') || 
                   headerMatches(header, 'Naphtha');
        } else if (product === 'Toluene') {
            return headerMatches(header, 'Toluene') || 
                   headerMatches(header, 'Benzene') || 
                   headerMatches(header, 'Methanol') ||
                   headerMatches(header, 'Gas');
        } else if (product === 'MEG' || product === 'DEG') {
            return headerMatches(header, 'MEG') || 
                   headerMatches(header, 'DEG') || 
                   headerMatches(header, 'EO_Domestic') || 
                   headerMatches(header, 'Ethylene') || 
                   headerMatches(header, 'Naphtha');
        } else if (product === 'PG') {
            return headerMatches(header, 'PG_Domestic') || 
                   headerMatches(header, 'Propylene_Oxide') || 
                   headerMatches(header, 'Propylene') || 
                   headerMatches(header, 'Naphtha');
        } else if (product === 'Xylene') {
            return headerMatches(header, 'Xylene_Domestic') || 
                   headerMatches(header, 'Naphtha') || 
                   headerMatches(header, 'Brent');
        } else if (product === 'Brent') {
            return headerMatches(header, 'Brent');
        }
        return false;
    }

    // ==========================================
    // DATA PROCESSING
    // ==========================================
    function processPrices(data) {
        if (!data || data.length === 0) return;
        
        rawPricesData = data;
        updateHeaderExchangeRates();
        priceHeaders = Object.keys(data[0]).filter(header => header !== 'Date');
        rawPricesData.sort((a, b) => new Date(a.Date) - new Date(b.Date));
        alignedDates = rawPricesData.map(row => row.Date);
        filteredData = [...rawPricesData];

        // Set default values from DOM
        const selectProductEl = document.getElementById('target-product-select');
        if (selectProductEl) {
            selectProductEl.selectedIndex = 0;
            currentProduct = selectProductEl.value;
        }

        populateRegionSelector(currentProduct);
        currentTarget = resolveTargetColumn(currentProduct, currentRegion);
        updateKPIColumns();

        // Update titles of KPIs dynamically on initial load
        const config = TARGET_CONFIGS[currentProduct];
        if (config) {
            document.querySelector('#kpi-butyl h3').textContent = config.labels.butyl;
            document.querySelector('#kpi-butanol h3').textContent = config.labels.butanol;
            document.querySelector('#kpi-acetic h3').textContent = config.labels.acetic;
            document.querySelector('#kpi-methanol h3').textContent = config.labels.methanol;

            const leadLagDesc = document.querySelector('#lead-lag-card .card-header p');
            if (leadLagDesc) {
                leadLagDesc.textContent = `Correlations vs. ${config.title} (Target)`;
            }
        }

        if (alignedDates.length > 0) {
            const lastDate = alignedDates[alignedDates.length - 1];
            document.getElementById('last-updated-date').textContent = lastDate;
        }

        updateKPIs();
        createSeriesSelectors();
        initializeChart();
        renderTable();
        
        if (rawLeadLagData && rawLeadLagData.length > 0) {
            displayLeadLag(rawLeadLagData);
        }
        
        updateFinancialSignals();
        updateChemicalTree();
        checkDataAvailability();
    }

    // ==========================================
    // KPI Badges Update
    // ==========================================
    function updateKPIs() {
        const totalRows = rawPricesData.length;
        if (totalRows === 0) return;

        const latestRow = rawPricesData[totalRows - 1];
        // Compare with 7 days ago if possible, otherwise fall back to previous day
        const previousRow = totalRows > 7 ? rawPricesData[totalRows - 8] : (totalRows > 1 ? rawPricesData[totalRows - 2] : latestRow);

        const seenCols = new Set();
        Object.entries(KPI_COLUMNS).forEach(([key, colName]) => {
            const cardEl = document.getElementById(`kpi-${key}`);
            const valEl = document.getElementById(`kpi-${key}-val`);
            const changeEl = document.getElementById(`kpi-${key}-change`);
            
            if (!cardEl || !valEl || !changeEl) return;

            if (!colName || seenCols.has(colName)) {
                cardEl.style.display = 'none';
                return;
            }
            cardEl.style.display = 'flex';
            seenCols.add(colName);

            if (latestRow[colName] !== undefined && latestRow[colName] !== null) {
                const currentVal = latestRow[colName];
                const prevVal = previousRow[colName] || currentVal;
                const absChange = currentVal - prevVal;
                const pctChange = prevVal !== 0 ? (absChange / prevVal) * 100 : 0;
                
                valEl.textContent = formatVal(currentVal, 1);
                
                if (absChange > 0.05) {
                    changeEl.className = 'kpi-change';
                    changeEl.innerHTML = `<span class="kpi-trend-badge positive"><i class="fa-solid fa-arrow-trend-up"></i> +${pctChange.toFixed(2)}%</span>`;
                } else if (absChange < -0.05) {
                    changeEl.className = 'kpi-change';
                    changeEl.innerHTML = `<span class="kpi-trend-badge negative"><i class="fa-solid fa-arrow-trend-down"></i> ${pctChange.toFixed(2)}%</span>`;
                } else {
                    changeEl.className = 'kpi-change';
                    changeEl.innerHTML = `<span class="kpi-trend-badge neutral"><i class="fa-solid fa-minus"></i> Stable</span>`;
                }
            } else {
                valEl.textContent = "N/A";
                changeEl.className = 'kpi-change';
                changeEl.innerHTML = `<span class="kpi-trend-badge neutral">-</span>`;
            }
        });
    }

    // ==========================================
    // CHECKBOX SELECTORS CREATION
    // ==========================================
    function createSeriesSelectors() {
        const container = document.getElementById('series-checkboxes');
        if (!container) return;
        container.innerHTML = "";

        const config = TARGET_CONFIGS[currentProduct];
        const defaultMatches = config.defaultChecked
            .map(col => resolveColumnForRegion(col, currentRegion, col !== config.precursors.butyl))
            .filter(col => col && priceHeaders.includes(col));
        let relatedHeaders = priceHeaders.filter(h => isColumnRelated(h, currentProduct));

        // Filter headers by region to prevent showing China feedstocks in Europe view and vice versa
        const mainReg = getMainRegionForSubRegion(currentRegion);
        if (mainReg === 'Europe' || mainReg === 'Global') {
            relatedHeaders = relatedHeaders.filter(h => h.includes('_Europe_') || h.includes('_Global_') || h.includes('_Global') || h.includes('Europe') || h.includes('Global'));
        } else {
            relatedHeaders = relatedHeaders.filter(h => !h.includes('_Europe_') && !h.includes('_Global_') && !h.includes('_Global') && !h.includes('Europe') && !h.includes('Global'));
        }

        selectedSeries = [...defaultMatches];

        relatedHeaders.forEach((header) => {
            const shouldBeChecked = defaultMatches.includes(header);

            const label = document.createElement('label');
            const isTargetCol = header.includes('Acetone') || header.includes(config.title.split(' ')[0]);
            label.className = `check-tag ${shouldBeChecked ? 'active' : ''} ${isTargetCol ? 'accent' : ''}`;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = shouldBeChecked;
            checkbox.value = header;
            
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    selectedSeries.push(header);
                    label.classList.add('active');
                } else {
                    selectedSeries = selectedSeries.filter(s => s !== header);
                    label.classList.remove('active');
                }
                updateChartData();
                displayLeadLag(rawLeadLagData);
            });

            label.appendChild(checkbox);
            
            let displayName = translateTextRegions(header)
                .replace('_Domestic', '')
                .replace('Octanol', '2-Ethylhexanol')
                .replace(/_/g, ' ');
            
            label.appendChild(document.createTextNode(displayName));
            container.appendChild(label);
        });
    }

    function calculateMargin(row, product, region) {
        const config = TARGET_CONFIGS[product];
        if (!config) return null;

        const targetCol = resolveColumnForRegion(config.precursors.butyl, region, false);
        const targetVal = row[targetCol];
        if (targetVal === undefined || targetVal === null) return null;

        // Approximate precursor consumption coefficients per ton of product
        const coefficients = {
            'Butyl_Acetate': {
                'butanol': 0.65, // n-butanol
                'acetic': 0.53   // acetic acid
            },
            'Ethyl_Acetate': {
                'butanol': 0.53, // ethanol
                'acetic': 0.69   // acetic acid
            },
            'n_Propyl_Acetate': {
                'butanol': 0.60, // n-propanol
                'acetic': 0.59   // acetic acid
            },
            'Isopropyl_Acetate_Proxy': {
                'butanol': 0.60, // isopropanol
                'acetic': 0.59   // acetic acid
            },
            'Acrylic_Acid': {
                'butanol': 0.65  // propylene
            },
            'Phthalic_Anhydride': {
                'butanol': 0.75  // o-xylene
            },
            'Maleic_Anhydride': {
                'butanol': 0.85  // n-butanol
            },
            'MMA': {
                'butanol': 0.60, // acetone
                'acetic': 0.45,  // propylene
                'methanol': 0.35 // methanol
            },
            'Butyl_Acrylate': {
                'butanol': 0.57, // acrylic acid
                'acetic': 0.59   // n-butanol
            },
            'VAM': {
                'butanol': 0.34, // ethylene
                'acetic': 0.71   // acetic acid
            },
            '2_EHA': {
                'butanol': 0.40, // acrylic acid
                'acetic': 0.72   // octanol
            },
            'Ethyl_Acrylate': {
                'butanol': 0.73, // acrylic acid
                'acetic': 0.47   // ethanol
            },
            'Acetone_V1': {
                'butanol': 1.05  // isopropanol
            },
            'Acetone_V2': {
                'butanol': 1.40, // benzene
                'acetic': 0.75   // propylene
            },
            'Dibasic_Ester': {
                'butanol': 0.70, // dicarboxylic acid
                'acetic': 0.35   // methanol
            },
            'Isopropanol': {
                'butanol': 0.72  // propylene
            },
            'PMA': {
                'butanol': 0.69, // PM
                'acetic': 0.46   // acetic acid
            },
            'PM': {
                'butanol': 0.69  // propylene oxide
            },
            'Isophthalic_Acid': {
                'butanol': 0.70  // m-xylene
            },
            'PTA': {},
            'n_Butanol': {
                'butanol': 0.60  // propylene
            },
            'Isobutanol': {
                'butanol': 0.60  // propylene
            },
            'MEK': {
                'butanol': 0.80  // 2-butene
            },
            'MEK_V2': {
                'butanol': 1.05  // 2-butanol
            },
            'Styrene': {
                'benzene': 0.80,  // benzene
                'ethylene': 0.30  // ethylene
            },
            'MEG': {
                'butanol': 0.57   // ethylene oxide (EO)
            },
            'DEG': {
                'butanol': 0.30   // ethylene oxide (EO), co-product of MEG
            },
            'PG': {
                'butanol': 0.70   // propylene oxide (PO)
            },
            'Xylene': {
                'butanol': 1.08   // Naphtha pesada
            }
        };

        const formula = coefficients[product];
        if (!formula) return null;

        let precursorsCost = 0;
        let valid = true;

        for (const [precursorKey, coef] of Object.entries(formula)) {
            const rawColName = config.precursors[precursorKey];
            if (!rawColName) {
                valid = false;
                break;
            }
            const colName = resolveColumnForRegion(rawColName, region, true);
            const val = row[colName];
            if (val === undefined || val === null) {
                valid = false;
                break;
            }
            precursorsCost += val * coef;
        }

        if (!valid) return null;

        // Theoretical Margin = Target Price - Feedstock Costs
        return targetVal - precursorsCost;
    }

    function checkDataAvailability() {
        const hasRealData = priceHeaders.includes(currentTarget) || priceHeaders.some(h => {
            if (!isColumnRelated(h, currentProduct)) return false;
            return getMainRegionForSubRegion(h) === getMainRegionForSubRegion(currentRegion);
        });
        const loader = document.getElementById('chart-loader');
        const chartDiv = document.getElementById('main-chart');
        
        if (!loader || !chartDiv) return;

        if (!hasRealData) {
            chartDiv.style.opacity = '0.1';
            loader.style.display = 'flex';
            loader.style.flexDirection = 'column';
            loader.style.alignItems = 'center';
            loader.style.justifyContent = 'center';
            
            let message = "";
            let title = "";
            if (currentRegion === 'Europe' || getMainRegionForSubRegion(currentRegion) === 'Europe') {
                title = "European Market Integration";
                message = "Historical price data for Europe is currently being prepared. Predictive Ridge models and pricing benchmarks for European hubs (NWE/Rotterdam) will be integrated in the next release.";
            } else {
                title = "Data Temporarily Unavailable";
                message = `No active price series found for ${currentProduct.replace(/_/g, ' ')} in region ${translateTextRegions(currentRegion)}. Please select a different region or check back later.`;
            }

            loader.innerHTML = `
                <div class="no-data-overlay-content" style="text-align: center; max-width: 500px; padding: 25px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; backdrop-filter: blur(10px); box-shadow: var(--shadow-glass);">
                    <i class="fa-solid fa-earth-europe" style="font-size: 3rem; color: var(--accent-blue); margin-bottom: 15px; text-shadow: 0 0 10px rgba(6, 182, 212, 0.4);"></i>
                    <h3 style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin-bottom: 10px;">${title}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">${message}</p>
                </div>
            `;
            return false;
        } else {
            chartDiv.style.opacity = '1';
            loader.style.display = 'none';
            loader.innerHTML = `
                <div class="spinner"></div>
                <p>Loading charts...</p>
            `;
            return true;
        }
    }

    function initializeChart() {
        const isSeasonal = (currentChartView === 'seasonal');
        const seriesData = getChartSeries();
        const dashArrayOpt = seriesData.map(s => s.name.includes('Forecast') ? 5 : (s.name.includes('Simulated') ? 4 : 0));
        const widthOpt = seriesData.map(s => s.name.includes('Simulated') ? 2.5 : 3.5);

        const options = {
            chart: {
                type: 'line',
                height: 450,
                background: 'transparent',
                foreColor: '#94a3b8',
                toolbar: {
                    show: true
                },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            theme: {
                mode: 'dark'
            },
            colors: CHART_COLORS,
            stroke: {
                curve: 'smooth',
                width: widthOpt,
                dashArray: dashArrayOpt
            },
            grid: {
                borderColor: 'rgba(255, 255, 255, 0.05)',
                strokeDashArray: 4
            },
            series: seriesData,
            xaxis: isSeasonal ? {
                type: 'datetime',
                labels: {
                    format: 'MMM',
                    style: {
                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                    }
                }
            } : {
                type: 'datetime',
                labels: {
                    style: {
                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                    }
                }
            },
            yaxis: {
                title: {
                    text: (isSeasonal && seasonalMetricMode === 'margin') ? `Theoretical Margin (${getCurrencySymbol()}/Ton)` : `Market Price (${getCurrencySymbol()}/Ton)`,
                    style: {
                        color: '#94a3b8',
                        fontSize: '12px',
                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                    }
                },
                labels: {
                    formatter: function (val) {
                        return val ? val.toLocaleString('en-US') : '';
                    },
                    style: {
                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                    }
                }
            },
            tooltip: {
                theme: 'dark',
                shared: true,
                intersect: false,
                x: {
                    format: isSeasonal ? 'dd MMM' : 'dd MMM yyyy'
                }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'left',
                fontFamily: 'Plus Jakarta Sans, sans-serif'
            }
        };

        if (chartInstance) {
            chartInstance.destroy();
        }
        console.log("Initializing chart with shared tooltip: true, intersect: false");
        chartInstance = new ApexCharts(document.querySelector("#main-chart"), options);
        chartInstance.render();
        checkDataAvailability();
    }

    function getChartSeries() {
        if (currentChartView === 'seasonal') {
            const config = TARGET_CONFIGS[currentProduct];
            if (!config) return [];
            
            const targetCol = resolveColumnForRegion(config.precursors.butyl, currentRegion, false);
            
            // Group by year
            const yearsData = {};
            rawPricesData.forEach(row => {
                const date = new Date(row.Date);
                if (isNaN(date.getTime())) return;
                
                const year = date.getFullYear();
                const month = date.getMonth();
                const day = date.getDate();
                
                // Standardize layout timeline on leap year 2024 to support overlay mapping
                const dummyDate = new Date(2024, month, day);
                
                if (!yearsData[year]) {
                    yearsData[year] = [];
                }
                
                const val = (seasonalMetricMode === 'margin')
                    ? calculateMargin(row, currentProduct, currentRegion)
                    : row[targetCol];
                    
                if (val !== undefined && val !== null) {
                    yearsData[year].push({
                        x: dummyDate.getTime(),
                        y: convertValue(val)
                    });
                }
            });
            
            // Format series
            const series = [];
            const sortedYears = Object.keys(yearsData).sort();
            sortedYears.forEach((year) => {
                // sort chronologically within the year
                yearsData[year].sort((a, b) => a.x - b.x);
                series.push({
                    name: `Year ${year}`,
                    data: yearsData[year]
                });
            });
            return series;
        }

        let slicedData = rawPricesData;
        if (timeRangeDays !== "all") {
            slicedData = rawPricesData.slice(-parseInt(timeRangeDays));
        }

        const series = [];
        const targetColor = '#06b6d4'; // Target product color (Cyan)
        const compColors = [
            '#6366f1', // Indigo
            '#10b981', // Emerald
            '#f59e0b', // Amber
            '#f43f5e', // Rose
            '#a855f7', // Purple
            '#84cc16', // Lime
            '#fd79a8', // Pastel Pink
            '#e17055', // Terracotta
            '#00b894'  // Mint Green
        ];
        
        let compColorIdx = 0;

        selectedSeries.forEach((col) => {
            let color = '';
            
            // Check if this matches the active target product column
            const isMainTarget = (col === currentTarget);
            
            if (isMainTarget) {
                color = targetColor;
            } else {
                // Assign a unique color sequentially to avoid duplicates
                color = compColors[compColorIdx % compColors.length];
                compColorIdx++;
            }
            
            let sName = translateTextRegions(col).replace('_Domestic', '').replace('Octanol', '2-Ethylhexanol').replace('Gas_Europe_TTF', 'Natural Gas (TTF)').replace(/_/g, ' ');
            if (col.includes('_Europe_')) {
                const parts = col.split('_Europe_');
                const base = parts[0].replace(/_/g, ' ').replace('Octanol', '2-Ethylhexanol').replace('Gas', 'Natural Gas');
                const sub = translateTextRegions(parts[1]).replace(/_/g, ' ');
                if (!isMainTarget) {
                    sName = `${base} (${sub})`;
                } else {
                    sName = `${base} ${sub}`;
                }
            }
            if (currentProduct === 'Isopropyl_Acetate_Proxy' && col.includes('n_Propyl_Acetate')) {
                sName = sName.replace('n Propyl Acetate', 'Isopropyl Acetate (Proxy)');
            }
            series.push({
                name: sName,
                color: color,
                type: 'line',
                data: slicedData.map(row => ({
                    x: new Date(row.Date).getTime(),
                    y: convertValue(row[col], row.Date)
                }))
            });
        });

        // 5. Add forecast line if available
        if (financialForecastsData && financialForecastsData.products && financialForecastsData.products[currentProduct]) {
            const productData = financialForecastsData.products[currentProduct];
            const forecasts = productData[currentRegion] || null;
            if (forecasts && forecasts.predictions && forecasts.prediction_dates) {
                const targetCol = resolveTargetColumn(currentProduct, currentRegion);
                let lastRealVal = null;
                let lastRealDate = null;
                
                if (slicedData.length > 0 && targetCol && slicedData[slicedData.length - 1][targetCol] !== undefined) {
                    lastRealVal = slicedData[slicedData.length - 1][targetCol];
                    lastRealDate = slicedData[slicedData.length - 1].Date;
                }
                
                const forecastDataPoints = [];
                for (let i = 0; i < slicedData.length - 1; i++) {
                    forecastDataPoints.push({
                        x: new Date(slicedData[i].Date).getTime(),
                        y: null
                    });
                }
                if (lastRealVal !== null && lastRealDate !== null) {
                    forecastDataPoints.push({
                        x: new Date(lastRealDate).getTime(),
                        y: convertValue(lastRealVal)
                    });
                }
                forecasts.predictions.forEach((val, idx) => {
                    forecastDataPoints.push({
                        x: new Date(forecasts.prediction_dates[idx]).getTime(),
                        y: convertValue(val)
                    });
                });
                
                series.push({
                    name: `${TARGET_CONFIGS[currentProduct].title} Forecast (14d)`,
                    color: '#e84393', // Vibrant Neon Pink/Magenta to make it stand out
                    type: 'line',
                    data: forecastDataPoints
                });

                // Add Simulated Scenario curve
                if (simulatedForecastPoints && simulatedForecastPoints.length > 0) {
                    const simDataPoints = [];
                    for (let i = 0; i < slicedData.length - 1; i++) {
                        simDataPoints.push({
                            x: new Date(slicedData[i].Date).getTime(),
                            y: null
                        });
                    }
                    if (lastRealVal !== null && lastRealDate !== null) {
                        simDataPoints.push({
                            x: new Date(lastRealDate).getTime(),
                            y: convertValue(lastRealVal)
                        });
                    }
                    simulatedForecastPoints.forEach((val, idx) => {
                        simDataPoints.push({
                            x: new Date(forecasts.prediction_dates[idx]).getTime(),
                            y: convertValue(val)
                        });
                    });
                    series.push({
                        name: 'Simulated Scenario',
                        color: '#f39c12', // Warm amber/orange
                        type: 'line',
                        data: simDataPoints
                    });
                }
            }
        }

        return series;
    }

    function updateChartData() {
        if (!chartInstance) return;
        
        if (currentChartView === 'seasonal') {
            initializeChart();
            return;
        }
        
        let slicedData = rawPricesData;
        if (timeRangeDays !== "all") {
            slicedData = rawPricesData.slice(-parseInt(timeRangeDays));
        }
        
        const newDates = slicedData.map(row => row.Date);
        const seriesData = getChartSeries();
        const dashArrayOpt = seriesData.map(s => s.name.includes('Forecast') ? 5 : (s.name.includes('Simulated') ? 4 : 0));
        const widthOpt = seriesData.map(s => s.name.includes('Simulated') ? 2.5 : 3.5);
        
        console.log("Updating chart options with shared tooltip: true, intersect: false");
        chartInstance.updateOptions({
            series: seriesData,
            xaxis: {
                type: 'datetime',
                labels: {
                    format: undefined
                }
            },
            tooltip: {
                theme: 'dark',
                shared: true,
                intersect: false,
                x: {
                    format: 'dd MMM yyyy'
                }
            },
            stroke: {
                curve: 'smooth',
                width: widthOpt,
                dashArray: dashArrayOpt
            }
        });
        checkDataAvailability();
    }

    // ==========================================
    // LEAD-LAG SIDEBAR LIST
    // ==========================================
    function displayLeadLag(data) {
        const container = document.getElementById('lead-lag-list-container');
        if (!container) return;
        container.innerHTML = "";

        const config = TARGET_CONFIGS[currentProduct];
        const allowedBaseProds = config ? config.defaultChecked.filter(base => {
            if (base === 'Propylene' && !selectedSeries.some(sel => sel.includes('Propylene') && !sel.includes('Propylene_Oxide'))) return false;
            if (base === 'Ethylene' && !selectedSeries.some(sel => sel.includes('Ethylene') && !sel.includes('Ethylene_Glycol'))) return false;
            return selectedSeries.some(sel => sel.includes(base));
        }) : [];

        const filtered = [];
        allowedBaseProds.forEach(base => {
            // Exclude the target product itself
            const targetPrefix = config.defaultChecked[0];
            if (base === targetPrefix || currentTarget.includes(base)) return;

            const targetRows = data.filter(item => {
                if (item.Target !== currentTarget || !item.Feature) return false;
                if (base === 'Propylene' && item.Feature.includes('Propylene_Oxide')) return false;
                if (base === 'Ethylene' && item.Feature.includes('Ethylene_Glycol')) return false;
                return item.Feature.includes(base);
            });
            if (targetRows.length === 0) return;

            const exactCheckedCol = selectedSeries.find(sel => {
                if (base === 'Propylene' && sel.includes('Propylene_Oxide')) return false;
                if (base === 'Ethylene' && sel.includes('Ethylene_Glycol')) return false;
                return sel.includes(base);
            });
            const exactMatch = targetRows.find(row => row.Feature === exactCheckedCol);

            if (exactMatch) {
                filtered.push(exactMatch);
            } else {
                filtered.push(targetRows[0]);
            }
        });

        if (filtered.length === 0) {
            container.innerHTML = `<div class="lead-lag-info"><p>No lead-lag results available for this target region.</p></div>`;
            updateInsights([]);
            updateChemicalTree();
            return;
        }

        filtered.sort((a, b) => Math.abs(b.Max_Correlation) - Math.abs(a.Max_Correlation));

        filtered.forEach(item => {
            const featureName = item.Feature;
            const optLag = parseInt(item.Optimal_Lag_Days);
            const maxCorr = parseFloat(item.Max_Correlation);

            const isDirect = featureName.includes('n-Butanol') || 
                             featureName.includes('Ethanol') || 
                             featureName.includes('Isopropanol') || 
                             featureName.includes('Acetic_Acid') || 
                             featureName.includes('Octanol') ||
                             featureName.includes('Acrylic_Acid') ||
                             featureName.includes('Benzene') ||
                             featureName.includes('Ethylene') ||
                             featureName.includes('Propylene_Oxide') ||
                             featureName.includes('EO') ||
                             featureName.includes('Dicarboxylic_Acid');
            const tagClass = isDirect ? 'direct' : 'upstream';
            const tagLabel = isDirect ? 'Direct Feedstock' : 'Upstream / Other';

            const itemDiv = document.createElement('div');
            itemDiv.className = 'lead-lag-item';

            const absPercent = Math.min(100, Math.round(Math.abs(maxCorr) * 100));
            const barColor = maxCorr >= 0 ? 'var(--color-cyan)' : 'var(--color-rose)';
            const cleanFeature = translateTextRegions(featureName).replace('_Domestic', '').replace('Octanol', '2-Ethylhexanol').replace(/_/g, ' ');

            itemDiv.innerHTML = `
                <div class="lead-lag-item-header">
                    <span class="lead-lag-name" title="${cleanFeature}">${cleanFeature}</span>
                    <span class="lead-lag-tag ${tagClass}">${tagLabel}</span>
                </div>
                <div class="lead-lag-metrics">
                    <div class="metric-box">
                        Max Correlation: <strong>${maxCorr >= 0 ? '+' : ''}${maxCorr.toFixed(3)}</strong>
                    </div>
                    <div class="metric-box">
                        Optimal Lag: <span class="lag-badge">${optLag} Day${optLag > 1 ? 's' : ''}</span>
                    </div>
                </div>
                <div class="corr-bar-wrapper">
                    <div class="corr-bar-fill" style="width: 0%; background-color: ${barColor}"></div>
                </div>
            `;

            container.appendChild(itemDiv);

            setTimeout(() => {
                const fillBar = itemDiv.querySelector('.corr-bar-fill');
                if (fillBar) fillBar.style.width = `${absPercent}%`;
            }, 150);
        });

        // Generate insights and update value chain diagram
        updateInsights(data);
        updateChemicalTree();
    }

    // ==========================================
    // AUTOMATIC INSIGHTS GENERATION
    // ==========================================
    function updateInsights(data) {
        const container = document.getElementById('insights-container');
        if (!container) return;
        container.innerHTML = "";

        const config = TARGET_CONFIGS[currentProduct];
        const allowedBaseProds = config ? config.defaultChecked.filter(base => {
            if (base === 'Propylene' && !selectedSeries.some(sel => sel.includes('Propylene') && !sel.includes('Propylene_Oxide'))) return false;
            if (base === 'Ethylene' && !selectedSeries.some(sel => sel.includes('Ethylene') && !sel.includes('Ethylene_Glycol'))) return false;
            return selectedSeries.some(sel => sel.includes(base));
        }) : [];

        const filtered = [];
        allowedBaseProds.forEach(base => {
            const targetPrefix = config.defaultChecked[0];
            if (base === targetPrefix || currentTarget.includes(base)) return;

            const targetRows = data.filter(item => {
                if (item.Target !== currentTarget || !item.Feature) return false;
                if (base === 'Propylene' && item.Feature.includes('Propylene_Oxide')) return false;
                if (base === 'Ethylene' && item.Feature.includes('Ethylene_Glycol')) return false;
                return item.Feature.includes(base);
            });
            if (targetRows.length === 0) return;

            const exactCheckedCol = selectedSeries.find(sel => {
                if (base === 'Propylene' && sel.includes('Propylene_Oxide')) return false;
                if (base === 'Ethylene' && sel.includes('Ethylene_Glycol')) return false;
                return sel.includes(base);
            });
            const exactMatch = targetRows.find(row => row.Feature === exactCheckedCol);

            if (exactMatch) {
                filtered.push(exactMatch);
            } else {
                filtered.push(targetRows[0]);
            }
        });

        if (filtered.length === 0) {
            container.innerHTML = `<p class="neutral-text">No correlation insights available for the selected region.</p>`;
            return;
        }

        // Sort by absolute correlation
        filtered.sort((a, b) => Math.abs(b.Max_Correlation) - Math.abs(a.Max_Correlation));

        // Get top 2 leading indicators
        const topIndicators = filtered.slice(0, 2);
        let html = '';

        topIndicators.forEach((item) => {
            const feature = translateTextRegions(item.Feature).replace('_Domestic', '').replace(/_/g, ' ');
            const corr = parseFloat(item.Max_Correlation);
            const lag = parseInt(item.Optimal_Lag_Days);
            const absCorr = Math.abs(corr);

            let iconClass = 'fa-circle-info';
            let insightClass = 'neutral-insight';
            let message = '';

            if (absCorr >= 0.7) {
                insightClass = corr >= 0 ? 'positive-insight' : 'warning-insight';
                iconClass = corr >= 0 ? 'fa-circle-check' : 'fa-circle-exclamation';
            }

            if (corr >= 0.5) {
                message = `<strong>${feature}</strong> has a strong positive correlation of <strong>+${corr.toFixed(2)}</strong> with a lead time of <strong>${lag} days</strong>. A price movement here historically propagates to ${config.title} in about ${lag} days.`;
            } else if (corr <= -0.5) {
                message = `<strong>${feature}</strong> is negatively correlated (<strong>${corr.toFixed(2)}</strong>) with a lag of <strong>${lag} days</strong>, suggesting inverse price trends.`;
            } else {
                message = `<strong>${feature}</strong> has a moderate correlation of <strong>${corr >= 0 ? '+' : ''}${corr.toFixed(2)}</strong> leading by <strong>${lag} days</strong>.`;
            }

            html += `
                <div class="insight-item ${insightClass}">
                    <i class="fa-solid ${iconClass} insight-icon"></i>
                    <div>${message}</div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // ==========================================
    // CHEMICAL VALUE CHAIN TREE DIAGRAM
    // ==========================================
    function updateChemicalTree() {
        const container = document.getElementById('chemical-tree-container');
        if (!container) return;
        container.innerHTML = "";

        const config = TARGET_CONFIGS[currentProduct];
        if (!config) return;

        const productFlows = {
            'Butyl_Acetate': {
                upstreamA: 'Propylene',
                feedstockA: 'n-Butanol',
                upstreamB: 'Methanol',
                feedstockB: 'Acetic_Acid',
                target: 'Butyl_Acetate'
            },
            'Ethyl_Acetate': {
                upstreamA: 'Ethylene',
                feedstockA: 'Ethanol',
                upstreamB: 'Methanol',
                feedstockB: 'Acetic_Acid',
                target: 'Ethyl_Acetate'
            },
            'n_Propyl_Acetate': {
                upstreamA: 'Propylene',
                feedstockA: 'n-Propanol',
                upstreamB: 'Methanol',
                feedstockB: 'Acetic_Acid',
                target: 'n_Propyl_Acetate'
            },
            'Isopropyl_Acetate_Proxy': {
                upstreamA: 'Propylene',
                feedstockA: 'Isopropanol',
                upstreamB: 'Methanol',
                feedstockB: 'Acetic_Acid',
                target: 'Isopropyl_Acetate_Proxy'
            },
            'Acrylic_Acid': {
                upstreamA: 'Naphtha',
                feedstockA: 'Propylene',
                upstreamB: '',
                feedstockB: '',
                target: 'Acrylic_Acid'
            },
            'Phthalic_Anhydride': {
                upstreamA: 'Reformed_Naphtha',
                feedstockA: 'o_Xylene',
                upstreamB: '',
                feedstockB: '',
                target: 'Phthalic_Anhydride'
            },
            'Maleic_Anhydride': {
                upstreamA: (getMainRegionForSubRegion(currentRegion) === 'Europe') ? 'Gas_Europe_TTF' : '',
                feedstockA: 'n-Butanol',
                upstreamB: '',
                feedstockB: '',
                target: 'Maleic_Anhydride'
            },
            'MMA': {
                upstreamA: 'Propylene',
                feedstockA: 'Acetone',
                upstreamB: (getMainRegionForSubRegion(currentRegion) === 'Europe') ? 'Gas_Europe_TTF' : '',
                feedstockB: 'Methanol',
                target: 'MMA'
            },
            'Butyl_Acrylate': {
                upstreamA: 'Propylene',
                feedstockA: 'Acrylic_Acid',
                upstreamB: 'Propylene',
                feedstockB: 'n-Butanol',
                target: 'Butyl_Acrylate'
            },
            'VAM': {
                upstreamA: 'Naphtha',
                feedstockA: 'Ethylene',
                upstreamB: 'Methanol',
                feedstockB: 'Acetic_Acid',
                target: 'VAM'
            },
            '2_EHA': {
                upstreamA: 'Propylene',
                feedstockA: 'Acrylic_Acid',
                upstreamB: 'Propylene',
                feedstockB: 'Octanol',
                target: '2_EHA'
            },
            'Ethyl_Acrylate': {
                upstreamA: 'Propylene',
                feedstockA: 'Acrylic_Acid',
                upstreamB: 'Ethylene',
                feedstockB: 'Ethanol',
                target: 'Ethyl_Acrylate'
            },
            'Acetone_V1': {
                upstreamA: 'Propylene',
                feedstockA: 'Isopropanol',
                upstreamB: '',
                feedstockB: '',
                target: 'Acetone'
            },
            'Acetone_V2': {
                upstreamA: 'Reformed_Naphtha',
                feedstockA: 'Benzene',
                upstreamB: 'Naphtha',
                feedstockB: 'Propylene',
                target: 'Acetone'
            },
            'Isopropanol': {
                upstreamA: 'Naphtha',
                feedstockA: 'Propylene',
                upstreamB: '',
                feedstockB: '',
                target: 'Isopropanol'
            },
            'Dibasic_Ester': {
                upstreamA: 'Cyclohexane',
                feedstockA: 'Dicarboxylic_Acid',
                upstreamB: (getMainRegionForSubRegion(currentRegion) === 'Europe') ? 'Gas_Europe_TTF' : '',
                feedstockB: 'Methanol',
                target: 'Dibasic_Ester'
            },
            'PMA': {
                upstreamA: 'Propylene_Oxide',
                feedstockA: 'PM',
                upstreamB: 'Methanol',
                feedstockB: 'Acetic_Acid',
                target: 'PMA'
            },
            'PM': {
                upstreamA: 'Propylene',
                feedstockA: 'Propylene_Oxide',
                upstreamB: (getMainRegionForSubRegion(currentRegion) === 'Europe') ? 'Gas_Europe_TTF' : '',
                feedstockB: 'Methanol',
                target: 'PM'
            },
            'Isophthalic_Acid': {
                upstreamA: 'Reformed_Naphtha',
                feedstockA: 'm_Xylene',
                upstreamB: '',
                feedstockB: '',
                target: 'Isophthalic_Acid'
            },
            'PTA': {
                upstreamA: 'Reformed_Naphtha',
                feedstockA: 'Xylene',
                upstreamB: '',
                feedstockB: '',
                target: 'PTA'
            },
            'Toluene': {
                upstreamA: 'Brent',
                feedstockA: 'Benzene',
                upstreamB: (getMainRegionForSubRegion(currentRegion) === 'Europe') ? 'Gas_Europe_TTF' : '',
                feedstockB: 'Methanol',
                target: 'Toluene'
            },
            'n_Butanol': {
                upstreamA: 'Naphtha',
                feedstockA: 'Propylene',
                upstreamB: (getMainRegionForSubRegion(currentRegion) === 'Europe') ? 'Gas_Europe_TTF' : '',
                feedstockB: '',
                target: 'n-Butanol'
            },
            'Isobutanol': {
                upstreamA: 'Naphtha',
                feedstockA: 'Propylene',
                upstreamB: (getMainRegionForSubRegion(currentRegion) === 'Europe') ? 'Gas_Europe_TTF' : '',
                feedstockB: '',
                target: 'Isobutanol'
            },
            'MEK': {
                upstreamA: 'Naphtha_Butane',
                feedstockA: '2_Butene',
                upstreamB: '',
                feedstockB: '',
                target: 'MEK'
            },
            'MEK_V2': {
                upstreamA: '1_Butene_2_Butene',
                feedstockA: '2_Butanol',
                upstreamB: '',
                feedstockB: '',
                target: 'MEK'
            },
            'Styrene': {
                upstreamA: 'Reformed_Naphtha',
                feedstockA: 'Ethylbenzene',
                upstreamB: 'Naphtha',
                feedstockB: 'Propylene',
                target: 'Styrene'
            },
            'MEG': {
                upstreamA: 'Ethylene',
                feedstockA: 'EO_Domestic',
                upstreamB: '',
                feedstockB: '',
                target: 'MEG'
            },
            'DEG': {
                upstreamA: 'Ethylene',
                feedstockA: 'EO_Domestic',
                upstreamB: '',
                feedstockB: '',
                target: 'DEG'
            },
            'Xylene': {
                upstreamA: 'Brent',
                feedstockA: 'Naphtha',
                upstreamB: (getMainRegionForSubRegion(currentRegion) === 'Europe') ? 'Gas_Europe_TTF' : '',
                feedstockB: '',
                target: 'Xylene'
            },
            'PG': {
                upstreamA: 'Propylene',
                feedstockA: 'Propylene_Oxide',
                upstreamB: '',
                feedstockB: '',
                target: 'PG'
            }
        };

        const flow = productFlows[currentProduct] || {
            upstreamA: '',
            feedstockA: config.precursors.butanol || '',
            upstreamB: config.precursors.methanol || '',
            feedstockB: config.precursors.acetic || '',
            target: config.precursors.butyl || currentProduct
        };

        const cleanName = (key) => {
            if (!key) return '';
            if (key === 'Octanol') return '2-Ethylhexanol';
            if (key === 'Naphtha_Butane') return 'Naphtha / Butane';
            if (key === '1_Butene_2_Butene') return '1-But. / 2-Buteno';
            if (key === 'Reformed_Naphtha') return 'Reformed Naphtha / Ethane';
            if (key === 'Gas_Europe_TTF' || key === 'Gas') return 'Natural Gas (TTF)';
            if (key.includes('EO')) return 'Ethylene Oxide (EO)';
            if (key === 'H2O') return 'Water (H2O)';
            if (key === 'H2O_Purified') return 'Purified Water';
            if (key === 'Vegetable_Oil') return 'Vegetable Oil / Tallow';
            if (key === 'Glycerol') return 'Glycerol';
            if (key === 'Hydrogen') return 'Hydrogen (H2)';
            const cleaned = key.replace(/_Domestic/i, '').replace(/_Proxy/i, '').replace(/_/g, ' ').replace(/-/g, ' ');
            return translateTextRegions(cleaned);
        };

        const isSelected = (baseProd) => {
            if (!baseProd) return false;
            const cleanBase = baseProd.toLowerCase().replace(/_/g, '').replace(/-/g, '');
            return selectedSeries.some(col => {
                const cleanCol = col.toLowerCase().replace(/_/g, '').replace(/-/g, '');
                return cleanCol.includes(cleanBase) || cleanBase.includes(cleanCol);
            });
        };

        const uA = flow.upstreamA;
        const fA = flow.feedstockA;
        const uB = flow.upstreamB;
        const fB = flow.feedstockB;
        const tgt = flow.target;

        let html = "";

        if (!fB) {
            // Render single vertical branch!
            html = `
            <div class="chemical-flow-diagram single-branch">
                ${uA ? `
                <!-- Upstream -->
                <div class="flow-row">
                    <div class="flow-node upstream-node ${isSelected(uA) ? 'active-node' : ''}" data-product="${uA}">
                        <div class="node-icon"><i class="fa-solid fa-flask"></i></div>
                        <div class="node-details">
                            <span class="node-badge upstream">Upstream</span>
                            <span class="node-title">${cleanName(uA)}</span>
                        </div>
                    </div>
                </div>

                <!-- Connector 1 -->
                <div class="flow-connectors-row-1">
                    <div class="connector-wrapper">
                        <svg viewBox="0 0 20 40" class="connector-line">
                            <path d="M 10 0 L 10 40" fill="none" stroke="var(--color-emerald)" stroke-width="2" stroke-dasharray="4,4" class="${isSelected(uA) ? 'animated-path' : ''}" />
                            <polygon points="10,40 7,33 13,33" fill="var(--color-emerald)" />
                        </svg>
                    </div>
                </div>
                ` : ''}

                <!-- Feedstock -->
                <div class="flow-row">
                    <div class="flow-node feedstock-node ${fA ? '' : 'invisible'} ${isSelected(fA) ? 'active-node' : ''}" data-product="${fA || ''}">
                        <div class="node-icon"><i class="fa-solid fa-industry"></i></div>
                        <div class="node-details">
                            <span class="node-badge feedstock">Feedstock</span>
                            <span class="node-title">${cleanName(fA)}</span>
                        </div>
                    </div>
                </div>

                <!-- Connector 2 -->
                <div class="flow-connectors-row-1">
                    <div class="connector-wrapper">
                        <svg viewBox="0 0 20 40" class="connector-line">
                            <path d="M 10 0 L 10 40" fill="none" stroke="var(--color-accent)" stroke-width="2" class="${isSelected(fA) ? 'animated-path' : ''}" />
                            <polygon points="10,40 7,33 13,33" fill="var(--color-accent)" />
                        </svg>
                    </div>
                </div>

                <!-- Target -->
                <div class="flow-row">
                    <div class="flow-node target-node ${isSelected(tgt) ? 'active-node' : ''}" data-product="${tgt || ''}">
                        <div class="node-icon"><i class="fa-solid fa-bullseye"></i></div>
                        <div class="node-details">
                            <span class="node-badge target">Target</span>
                            <span class="node-title">${cleanName(tgt)}</span>
                        </div>
                    </div>
                </div>
            </div>
            `;
        } else {
            // Render dual symmetric branch
            html = `
            <div class="chemical-flow-diagram">
                <!-- Upstreams Row -->
                <div class="flow-row upstreams-row">
                    <div class="flow-node upstream-node left-node ${uA ? '' : 'invisible'} ${isSelected(uA) ? 'active-node' : ''}" data-product="${uA || ''}">
                        <div class="node-icon"><i class="fa-solid fa-flask"></i></div>
                        <div class="node-details">
                            <span class="node-badge upstream">Upstream</span>
                            <span class="node-title">${cleanName(uA)}</span>
                        </div>
                    </div>
                    <div class="flow-node upstream-node right-node ${uB ? '' : 'invisible'} ${isSelected(uB) ? 'active-node' : ''}" data-product="${uB || ''}">
                        <div class="node-icon"><i class="fa-solid fa-flask"></i></div>
                        <div class="node-details">
                            <span class="node-badge upstream">Upstream</span>
                            <span class="node-title">${cleanName(uB)}</span>
                        </div>
                    </div>
                </div>

                <!-- Connector SVGs Row 1 -->
                <div class="flow-connectors-row-1">
                    <div class="connector-wrapper left-connector ${uA ? '' : 'invisible'}">
                        <svg viewBox="0 0 20 40" class="connector-line">
                            <path d="M 10 0 L 10 40" fill="none" stroke="var(--color-emerald)" stroke-width="2" stroke-dasharray="4,4" class="${isSelected(uA) ? 'animated-path' : ''}" />
                            <polygon points="10,40 7,33 13,33" fill="var(--color-emerald)" />
                        </svg>
                    </div>
                    <div class="connector-wrapper right-connector ${uB ? '' : 'invisible'}">
                        <svg viewBox="0 0 20 40" class="connector-line">
                            <path d="M 10 0 L 10 40" fill="none" stroke="var(--color-emerald)" stroke-width="2" stroke-dasharray="4,4" class="${isSelected(uB) ? 'animated-path' : ''}" />
                            <polygon points="10,40 7,33 13,33" fill="var(--color-emerald)" />
                        </svg>
                    </div>
                </div>

                <!-- Feedstocks Row -->
                <div class="flow-row feedstocks-row">
                    <div class="flow-node feedstock-node left-node ${fA ? '' : 'invisible'} ${isSelected(fA) ? 'active-node' : ''}" data-product="${fA || ''}">
                        <div class="node-icon"><i class="fa-solid fa-industry"></i></div>
                        <div class="node-details">
                            <span class="node-badge feedstock">Feedstock</span>
                            <span class="node-title">${cleanName(fA)}</span>
                        </div>
                    </div>
                    <div class="flow-node feedstock-node right-node ${fB ? '' : 'invisible'} ${isSelected(fB) ? 'active-node' : ''}" data-product="${fB || ''}">
                        <div class="node-icon"><i class="fa-solid fa-industry"></i></div>
                        <div class="node-details">
                            <span class="node-badge feedstock">Feedstock</span>
                            <span class="node-title">${cleanName(fB)}</span>
                        </div>
                    </div>
                </div>

                <!-- Connector SVGs Row 2 -->
                <div class="flow-connectors-row-2">
                    <svg viewBox="0 0 100 40" class="merge-line" preserveAspectRatio="none">
                        <!-- Left path -->
                        <path d="M 25 0 L 25 20 L 50 20 L 50 40" fill="none" stroke="var(--color-accent)" stroke-width="2" class="${isSelected(fA) ? 'animated-path' : ''}" />
                        <!-- Right path -->
                        <path d="M 75 0 L 75 20 L 50 20 L 50 40" fill="none" stroke="var(--color-accent)" stroke-width="2" class="${isSelected(fB) ? 'animated-path' : ''}" />
                        <polygon points="50,40 47,33 53,33" fill="var(--color-accent)" />
                    </svg>
                </div>

                <!-- Target Row -->
                <div class="flow-row target-row">
                    <div class="flow-node target-node ${isSelected(tgt) ? 'active-node' : ''}" data-product="${tgt || ''}">
                        <div class="node-icon"><i class="fa-solid fa-bullseye"></i></div>
                        <div class="node-details">
                            <span class="node-badge target">Target</span>
                            <span class="node-title">${cleanName(tgt)}</span>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }

        if (currentProduct === 'PMA') {
            html += `
            <div class="flow-note-card" style="margin-top: 15px; padding: 10px 14px; background: rgba(99, 102, 241, 0.08); border-left: 3px solid var(--color-indigo); border-radius: 4px; font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">
                <i class="fa-solid fa-circle-info" style="color: var(--color-indigo); margin-right: 6px;"></i>
                <strong>Methodology Note:</strong> Methoxypropanol (PM) is replaced by its precursors (Propylene Oxide & Methanol) to avoid colinearity, and combined with Acetic Acid to calculate the full spread.
            </div>
            `;
        }

        container.innerHTML = html;

        // Add programatic click listener to toggle compare series on click
        const nodes = container.querySelectorAll('.flow-node');
        nodes.forEach(node => {
            const prod = node.getAttribute('data-product');
            if (!prod) return;
            node.addEventListener('click', () => {
                const cleanProd = prod.toLowerCase().replace(/_/g, '').replace(/-/g, '');
                const checkboxes = document.querySelectorAll('.series-checkbox');
                let clicked = false;
                checkboxes.forEach(cb => {
                    const cbVal = cb.value.toLowerCase().replace(/_/g, '').replace(/-/g, '');
                    if (cbVal.includes(cleanProd) || cleanProd.includes(cbVal)) {
                        cb.click();
                        clicked = true;
                    }
                });
                if (clicked) {
                    node.classList.add('clicked-anim');
                    setTimeout(() => node.classList.remove('clicked-anim'), 300);
                }
            });
        });
    }

    // ==========================================
    // DATA TABLE & PAGINATION
    // ==========================================
    function renderTable() {
        const tableHeaders = document.getElementById('table-headers');
        const tableBody = document.getElementById('table-body');
        
        if (!tableHeaders || !tableBody) return;

        tableHeaders.innerHTML = "";
        tableBody.innerHTML = "";

        let displayHeaders = ['Date'];
        if (currentTarget && !selectedSeries.includes(currentTarget)) {
            displayHeaders.push(currentTarget);
        }
        displayHeaders = displayHeaders.concat(selectedSeries.slice(0, 5));
        // Add USD_CNY_Rate and EUR_USD_Rate to the columns displayed in the table
        displayHeaders.push('USD_CNY_Rate');
        displayHeaders.push('EUR_USD_Rate');
        displayHeaders = [...new Set(displayHeaders)];
        
        if (filteredData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${displayHeaders.length}" style="text-align: center; color: var(--text-secondary)">No results found</td></tr>`;
            document.getElementById('pagination-info-el').textContent = "Page 0 of 0";
            return;
        }
        
        displayHeaders.forEach(col => {
            const th = document.createElement('th');
            let headerText = translateTextRegions(col).replace('_Domestic', '').replace('_Europe', '').replace('_Global', '').replace(/_/g, ' ');
            if (currentProduct === 'Isopropyl_Acetate_Proxy' && col.includes('n_Propyl_Acetate')) {
                headerText = headerText.replace('n Propyl Acetate', 'Isopropyl Acetate (Proxy)');
            }
            if (col === 'USD_CNY_Rate') {
                headerText = 'USD/CNY Rate';
            } else if (col === 'EUR_USD_Rate') {
                headerText = 'EUR/USD Rate';
            } else if (col !== 'Date') {
                const unit = 't';
                headerText += ` (${getCurrencySymbol()}/${unit})`;
            }
            th.textContent = headerText;
            tableHeaders.appendChild(th);
        });

        const startIdx = (currentPage - 1) * rowsPerPage;
        const pageData = filteredData.slice().reverse().slice(startIdx, startIdx + rowsPerPage);

        pageData.forEach(row => {
            const tr = document.createElement('tr');
            
            displayHeaders.forEach(col => {
                const td = document.createElement('td');
                if (col === 'Date') {
                    td.className = 'date-col';
                    td.textContent = row[col];
                } else if (col === 'USD_CNY_Rate' || col === 'EUR_USD_Rate') {
                    const val = row[col];
                    td.textContent = (val !== null && val !== undefined) 
                        ? Number(val).toFixed(4) 
                        : '-';
                } else {
                    const val = row[col];
                    td.textContent = (val !== null && val !== undefined) 
                        ? Number(convertValue(val, row.Date)).toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1}) 
                        : '-';
                }
                tr.appendChild(td);
            });
            
            tableBody.appendChild(tr);
        });

        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        document.getElementById('pagination-info-el').textContent = `Page ${currentPage} of ${totalPages} (${filteredData.length} days)`;
        
        document.getElementById('btn-prev').disabled = (currentPage === 1);
        document.getElementById('btn-next').disabled = (currentPage >= totalPages || totalPages === 0);
    }

    // ==========================================
    // INTERACTION HANDLERS
    // ==========================================
    
    // Time range buttons
    document.querySelectorAll('.btn-range').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-range').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            timeRangeDays = e.target.getAttribute('data-days');
            updateChartData();
        });
    });

    // View toggle buttons (Trend / Seasonal)
    document.querySelectorAll('.btn-view-toggle').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            document.querySelectorAll('.btn-view-toggle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentChartView = btn.getAttribute('data-view');
            
            const timeRangeEl = document.getElementById('time-range-controls');
            const selectorContainerEl = document.querySelector('.series-selector-container');
            const metricToggleEl = document.getElementById('seasonal-metric-toggle');
            
            if (currentChartView === 'seasonal') {
                if (timeRangeEl) timeRangeEl.style.display = 'none';
                if (selectorContainerEl) selectorContainerEl.style.display = 'none';
                if (metricToggleEl) metricToggleEl.style.display = 'flex';
            } else {
                if (timeRangeEl) timeRangeEl.style.display = 'flex';
                if (selectorContainerEl) selectorContainerEl.style.display = 'block';
                if (metricToggleEl) metricToggleEl.style.display = 'none';
            }
            
            initializeChart();
        });
    });

    // Metric toggle buttons (Price / Margin)
    document.querySelectorAll('.btn-metric-toggle').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            document.querySelectorAll('.btn-metric-toggle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            seasonalMetricMode = btn.getAttribute('data-metric');
            initializeChart();
        });
    });

    // Search bar filter
    const searchInput = document.getElementById('table-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            filteredData = rawPricesData.filter(row => row.Date.toLowerCase().includes(query));
            currentPage = 1;
            renderTable();
        });
    }

    // Pagination Click
    document.getElementById('btn-prev').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    document.getElementById('btn-next').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });

    // CSV Export
    document.getElementById('btn-export-csv').addEventListener('click', () => {
        if (rawPricesData.length === 0) return;
        const csvString = Papa.unparse(rawPricesData);
        const blob = new Blob(["\ufeff" + csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "daxx_pricing_intel_prices_aligned.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Sidebar Tab click handler
    document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeSidebarTab = e.currentTarget.getAttribute('data-tab');
            updateSidebarTabs();
        });
    });

    // Target Select Change Event Listener
    const targetSelect = document.getElementById('target-product-select');
    if (targetSelect) {
        targetSelect.addEventListener('change', (e) => {
            currentProduct = e.target.value;
            populateRegionSelector(currentProduct);
            currentTarget = resolveTargetColumn(currentProduct, currentRegion);
            handleTargetProductChange();
        });
    }

    // Main Region Select Change Event Listener
    const mainRegionSelect = document.getElementById('market-main-region-select');
    if (mainRegionSelect) {
        mainRegionSelect.addEventListener('change', (e) => {
            const selectedMainRegion = e.target.value;
            populateSubRegionSelector(currentProduct, selectedMainRegion);
            currentTarget = resolveTargetColumn(currentProduct, currentRegion);
            handleTargetProductChange();
        });
    }

    // Region Select Change Event Listener
    const regionSelect = document.getElementById('market-region-select');
    if (regionSelect) {
        regionSelect.addEventListener('change', (e) => {
            currentRegion = e.target.value;
            currentTarget = resolveTargetColumn(currentProduct, currentRegion);
            handleTargetProductChange();
        });
    }



    function handleTargetProductChange() {
        const config = TARGET_CONFIGS[currentProduct];
        if (!config) return;

        updateKPIColumns();

        // Update titles of KPIs
        document.querySelector('#kpi-butyl h3').textContent = config.labels.butyl;
        document.querySelector('#kpi-butanol h3').textContent = config.labels.butanol;
        document.querySelector('#kpi-acetic h3').textContent = config.labels.acetic;
        document.querySelector('#kpi-methanol h3').textContent = config.labels.methanol;

        // Update Lead-Lag card header subtitle
        const leadLagDesc = document.querySelector('#lead-lag-card .card-header p');
        if (leadLagDesc) {
            leadLagDesc.textContent = `Correlations vs. ${config.title} (Target)`;
        }

        // Reset selections based on newly selected target & region
        const defaultMatches = config.defaultChecked
            .map(col => resolveColumnForRegion(col, currentRegion, col !== config.precursors.butyl))
            .filter(col => col && priceHeaders.includes(col));
        selectedSeries = [...defaultMatches];

        // Recompute KPIs, rebuild selectors, redraw chart & table, redraw Lead-Lag
        updateKPIs();
        createSeriesSelectors();
        updateChartData();
        renderTable();
        displayLeadLag(rawLeadLagData);
        updateFinancialSignals();
        updateChemicalTree();
    }

    function clearFinancialSignals() {
        const signalVal = document.getElementById('financial-signal-val');
        const signalReason = document.getElementById('financial-signal-reason');
        const metricSpread = document.getElementById('fin-metric-spread');
        const metricRsi = document.getElementById('fin-metric-rsi');
        const metricDirection = document.getElementById('fin-metric-direction');
        const pointerDot = document.getElementById('bb-pointer-dot');
        const limitLower = document.getElementById('bb-limit-lower');
        const limitUpper = document.getElementById('bb-limit-upper');
        const riskLevelBadge = document.getElementById('risk-level-badge');
        const riskMetricVolatility = document.getElementById('risk-metric-volatility');
        const riskMetricVar = document.getElementById('risk-metric-var');
        const backtestMetricPrecision = document.getElementById('backtest-metric-precision');
        const backtestMetricMae = document.getElementById('backtest-metric-mae');
        const backtestMetricSavings = document.getElementById('backtest-metric-savings');
        const modeBadge = document.getElementById('analysis-mode-badge');

        if (signalVal) signalVal.textContent = "N/A";
        if (signalReason) signalReason.textContent = "No forecast data available for this target benchmark.";
        if (metricSpread) metricSpread.textContent = "-";
        if (metricRsi) metricRsi.textContent = "-";
        if (metricDirection) metricDirection.textContent = "-";
        if (pointerDot) pointerDot.style.display = 'none';
        if (limitLower) limitLower.textContent = "-";
        if (limitUpper) limitUpper.textContent = "-";
        if (modeBadge) modeBadge.style.display = 'none';

        if (riskLevelBadge) {
            riskLevelBadge.textContent = "N/A";
            riskLevelBadge.style.color = 'var(--text-secondary)';
            riskLevelBadge.style.background = 'rgba(255, 255, 255, 0.05)';
            riskLevelBadge.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }
        if (riskMetricVolatility) riskMetricVolatility.textContent = "-";
        if (riskMetricVar) riskMetricVar.textContent = "-";

        if (backtestMetricPrecision) backtestMetricPrecision.textContent = "-";
        if (backtestMetricMae) backtestMetricMae.textContent = "-";
        if (backtestMetricSavings) backtestMetricSavings.textContent = "-";

        const whatifCard = document.getElementById('whatif-simulator-card');
        if (whatifCard) {
            whatifCard.style.display = 'none';
        }
    }

    function updateFinancialSignals() {
        const signalVal = document.getElementById('financial-signal-val');
        const signalReason = document.getElementById('financial-signal-reason');
        const metricSpread = document.getElementById('fin-metric-spread');
        const metricRsi = document.getElementById('fin-metric-rsi');
        const metricDirection = document.getElementById('fin-metric-direction');
        const pointerDot = document.getElementById('bb-pointer-dot');
        const limitLower = document.getElementById('bb-limit-lower');
        const limitUpper = document.getElementById('bb-limit-upper');

        if (!financialForecastsData || !financialForecastsData.products) {
            clearFinancialSignals();
            if (signalVal) signalVal.textContent = "Indisponible";
            return;
        }

        const productData = financialForecastsData.products[currentProduct];
        if (!productData) {
            clearFinancialSignals();
            return;
        }

        const forecasts = productData[currentRegion] || null;
        if (!forecasts) {
            clearFinancialSignals();
            return;
        }

        if (pointerDot) pointerDot.style.display = 'block';

        // Update analysis mode and labels dynamically
        const modeBadge = document.getElementById('analysis-mode-badge');
        const spreadLabel = document.getElementById('fin-metric-spread-label');
        const bbLabel = document.getElementById('bb-label');
        
        const mode = forecasts.analysis_mode || 'margin';
        if (modeBadge) {
            modeBadge.style.display = 'inline-block';
            if (mode === 'margin') {
                modeBadge.textContent = 'Margin Spread Mode';
                modeBadge.style.background = 'rgba(16, 185, 129, 0.15)';
                modeBadge.style.color = '#10b981';
                modeBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                if (spreadLabel) spreadLabel.textContent = 'Spread';
                if (bbLabel) bbLabel.textContent = 'Bollinger Margin Position (60d)';
            } else if (mode === 'price') {
                modeBadge.textContent = 'Absolute Price Mode';
                modeBadge.style.background = 'rgba(99, 102, 241, 0.15)';
                modeBadge.style.color = '#6366f1';
                modeBadge.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                if (spreadLabel) spreadLabel.textContent = 'Price';
                if (bbLabel) bbLabel.textContent = 'Bollinger Price Position (60d)';
            } else if (mode === 'feedstock_index') {
                modeBadge.textContent = 'Raw Material Index';
                modeBadge.style.background = 'rgba(245, 158, 11, 0.15)';
                modeBadge.style.color = '#f59e0b';
                modeBadge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                if (spreadLabel) spreadLabel.textContent = 'Feedstock Cost';
                if (bbLabel) bbLabel.textContent = 'Bollinger Cost Position (60d)';
            } else {
                modeBadge.textContent = 'Low-Data Mode';
                modeBadge.style.background = 'rgba(239, 68, 68, 0.15)';
                modeBadge.style.color = '#ef4444';
                modeBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                if (spreadLabel) spreadLabel.textContent = 'Price';
                if (bbLabel) bbLabel.textContent = 'Bollinger Position (60d)';
            }
        }

        // Update badge
        if (signalVal) {
            signalVal.textContent = forecasts.signal.toUpperCase();
            signalVal.className = 'signal-badge'; // Reset classes
            
            const sig = forecasts.signal;
            if (sig === 'Favorable') {
                signalVal.classList.add('badge-acheter');
            } else if (sig === 'Unfavorable') {
                signalVal.classList.add('badge-reporter');
            } else {
                signalVal.classList.add('badge-neutral');
            }
        }

        // Update description
        if (signalReason) {
            signalReason.textContent = forecasts.signal_reason || "";
        }

        // Update metrics
        if (metricSpread) {
            metricSpread.textContent = formatVal(forecasts.spread, 1);
        }
        if (metricRsi) {
            metricRsi.textContent = forecasts.rsi;
            if (forecasts.rsi < 35) metricRsi.style.color = '#10b981';
            else if (forecasts.rsi > 65) metricRsi.style.color = '#ef4444';
            else metricRsi.style.color = 'var(--text-primary)';
        }
        if (metricDirection) {
            metricDirection.textContent = `${forecasts.forecast_direction} (${forecasts.forecast_pct_change > 0 ? '+' : ''}${forecasts.forecast_pct_change}%)`;
            if (forecasts.forecast_direction === 'Bullish') {
                metricDirection.style.color = '#10b981';
            } else if (forecasts.forecast_direction === 'Bearish') {
                metricDirection.style.color = '#ef4444';
            } else {
                metricDirection.style.color = 'var(--text-primary)';
            }
        }

        // Update Bollinger Band pointer
        if (limitLower) limitLower.textContent = Math.round(convertValue(forecasts.bollinger.lower)).toLocaleString();
        if (limitUpper) limitUpper.textContent = Math.round(convertValue(forecasts.bollinger.upper)).toLocaleString();
        
        if (pointerDot) {
            const spreadVal = forecasts.spread;
            const lowerVal = forecasts.bollinger.lower;
            const upperVal = forecasts.bollinger.upper;
            let percent = 50;
            if (upperVal > lowerVal) {
                percent = ((spreadVal - lowerVal) / (upperVal - lowerVal)) * 100;
            }
            percent = Math.max(0, Math.min(100, percent));
            pointerDot.style.left = `${percent}%`;
            
            let color = '#6366f1';
            if (percent < 15) color = '#10b981';
            else if (percent > 85) color = '#ef4444';
            pointerDot.style.background = color;
            pointerDot.style.boxShadow = `0 0 8px ${color}`;
        }

        // Update Risk Profile elements
        const riskLevelBadge = document.getElementById('risk-level-badge');
        const riskMetricVolatility = document.getElementById('risk-metric-volatility');
        const riskMetricVar = document.getElementById('risk-metric-var');

        if (forecasts.risk_level && riskLevelBadge) {
            riskLevelBadge.textContent = forecasts.risk_level;
            if (forecasts.risk_level === 'High') {
                riskLevelBadge.style.color = '#ef4444';
                riskLevelBadge.style.background = 'rgba(239, 68, 68, 0.15)';
                riskLevelBadge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            } else if (forecasts.risk_level === 'Medium') {
                riskLevelBadge.style.color = '#f59e0b';
                riskLevelBadge.style.background = 'rgba(245, 158, 11, 0.15)';
                riskLevelBadge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
            } else {
                riskLevelBadge.style.color = '#10b981';
                riskLevelBadge.style.background = 'rgba(16, 185, 129, 0.15)';
                riskLevelBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            }
        }

        if (forecasts.volatility_annualized !== undefined && riskMetricVolatility) {
            riskMetricVolatility.textContent = `${forecasts.volatility_annualized}%`;
        }

        if (forecasts.var_10d_95 !== undefined && riskMetricVar) {
            riskMetricVar.textContent = `+${formatVal(forecasts.var_10d_95, 0)}`;
        }

        // Update Backtest elements
        const backtestMetricPrecision = document.getElementById('backtest-metric-precision');
        const backtestMetricMae = document.getElementById('backtest-metric-mae');
        const backtestMetricSavings = document.getElementById('backtest-metric-savings');

        console.log("Backtest debug:", {
            backtestResultsData: backtestResultsData,
            currentProduct: currentProduct,
            currentRegion: currentRegion
        });
        if (backtestResultsData && backtestResultsData[currentProduct]) {
            const productBacktest = backtestResultsData[currentProduct];
            const backtest = productBacktest[currentRegion] || null;
            if (backtest) {
                if (backtestMetricPrecision) {
                    backtestMetricPrecision.textContent = `${backtest.precision_pct}%`;
                    if (backtest.precision_pct > 95) backtestMetricPrecision.style.color = '#10b981';
                    else if (backtest.precision_pct < 90) backtestMetricPrecision.style.color = '#ef4444';
                    else backtestMetricPrecision.style.color = 'var(--text-primary)';
                }
                if (backtestMetricMae) {
                    const maeConverted = Math.round(convertValue(backtest.mae_14d));
                    backtestMetricMae.textContent = `${getCurrencySymbol()}${maeConverted} (${backtest.mape_14d}%)`;
                }
                if (backtestMetricSavings) {
                    backtestMetricSavings.textContent = `${backtest.savings_pct > 0 ? '+' : ''}${backtest.savings_pct}% (${formatVal(backtest.savings_per_ton, 0)})`;
                    if (backtest.savings_pct > 0) backtestMetricSavings.style.color = '#10b981';
                    else backtestMetricSavings.style.color = 'var(--text-primary)';
                }
            }
        }

        // Initialize / Update What-If Simulator with current forecasts
        initWhatIfSimulator(forecasts);
        initSeasonalPlanner(forecasts);
        initBudgetCalculator(forecasts);

        // Apply sidebar tab filter
        updateSidebarTabs();
    }

    function updateSidebarTabs() {
        const tabButtons = document.querySelectorAll('.sidebar-tab-btn');
        const emptyMsgEl = document.getElementById('sidebar-tab-empty-msg');
        if (!tabButtons || tabButtons.length === 0) return;

        // Define which cards belong to which tab
        const tabGroups = {
            'signals': ['financial-signals-card', 'ai-insights-card'],
            'procurement': ['budget-calculator-card', 'seasonal-planner-card'],
            'feedstocks': ['whatif-simulator-card', 'lead-lag-card']
        };

        // Deactivate all tab buttons first, activate the active one
        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === activeSidebarTab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Hide all cards initially
        Object.values(tabGroups).flat().forEach(cardId => {
            const cardEl = document.getElementById(cardId);
            if (cardEl) {
                cardEl.style.display = 'none';
            }
        });

        // Show active tab cards
        const activeCards = tabGroups[activeSidebarTab] || [];
        let visibleCount = 0;

        activeCards.forEach(cardId => {
            const cardEl = document.getElementById(cardId);
            if (!cardEl) return;

            // Check if card has conditional visibility
            let shouldShow = true;
            
            let forecasts = null;
            if (financialForecastsData && financialForecastsData.products && financialForecastsData.products[currentProduct]) {
                const productData = financialForecastsData.products[currentProduct];
                forecasts = productData[currentRegion] || null;
            }

            if (cardId === 'whatif-simulator-card') {
                shouldShow = (forecasts && forecasts.feedstock_coefficients && forecasts.feedstock_prices);
            } else if (cardId === 'seasonal-planner-card') {
                shouldShow = (forecasts && forecasts.seasonality_monthly);
            } else if (cardId === 'budget-calculator-card') {
                shouldShow = (forecasts && forecasts.current_price);
            } else if (cardId === 'financial-signals-card' || cardId === 'ai-insights-card') {
                shouldShow = (forecasts && forecasts.predictions && forecasts.predictions.length > 0);
            }

            if (shouldShow) {
                cardEl.style.display = 'block';
                visibleCount++;
            }
        });

        // Toggle empty message
        if (emptyMsgEl) {
            if (visibleCount === 0) {
                emptyMsgEl.style.display = 'flex';
            } else {
                emptyMsgEl.style.display = 'none';
            }
        }
    }

    function initWhatIfSimulator(forecasts) {
        const card = document.getElementById('whatif-simulator-card');
        const container = document.getElementById('whatif-sliders-container');
        if (!card || !container) return;

        if (!forecasts || !forecasts.feedstock_coefficients || !forecasts.feedstock_prices) {
            card.style.display = 'none';
            return;
        }

        card.style.display = 'block';
        container.innerHTML = '';
        whatIfState = {};

        const precursors = Object.keys(forecasts.feedstock_prices);
        const config = TARGET_CONFIGS[currentProduct];

        precursors.forEach(prec => {
            whatIfState[prec] = 0; // default 0%

            const label = (config && config.labels && config.labels[prec]) 
                ? config.labels[prec].replace(/\s*\(Feedstock\)|\s*\(Upstream\)/g, '') 
                : prec.toUpperCase();
            const currentPrice = forecasts.feedstock_prices[prec];

            const group = document.createElement('div');
            group.className = 'whatif-slider-group';
            group.innerHTML = `
                <div class="whatif-slider-header">
                    <span class="whatif-slider-name">${label}</span>
                    <span class="whatif-slider-value" id="whatif-val-${prec}">0%</span>
                </div>
                <input type="range" class="whatif-slider" id="whatif-slider-${prec}" min="-30" max="30" value="0" step="1">
                <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">
                    <span>-30%</span>
                    <span id="whatif-price-${prec}" style="font-variant-numeric: tabular-nums;">${getCurrencySymbol()}${Math.round(convertValue(currentPrice)).toLocaleString()}</span>
                    <span>+30%</span>
                </div>
            `;
            container.appendChild(group);

            const slider = group.querySelector(`#whatif-slider-${prec}`);
            const valLabel = group.querySelector(`#whatif-val-${prec}`);
            const priceLabel = group.querySelector(`#whatif-price-${prec}`);

            slider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                whatIfState[prec] = val;

                // Update percentage label class and text
                valLabel.textContent = (val > 0 ? '+' : '') + val + '%';
                valLabel.className = 'whatif-slider-value';
                if (val > 0) valLabel.classList.add('positive');
                else if (val < 0) valLabel.classList.add('negative');

                // Update feedstock price text
                const simulatedFeedstockPrice = currentPrice * (1 + val / 100);
                priceLabel.textContent = `${getCurrencySymbol()}${Math.round(convertValue(simulatedFeedstockPrice)).toLocaleString()}`;

                // Recalculate simulation path & redraw
                recalculateWhatIf(forecasts);
            });
        });

        // Reset button
        const resetBtn = document.getElementById('whatif-reset-btn');
        if (resetBtn) {
            resetBtn.onclick = () => {
                precursors.forEach(prec => {
                    const slider = document.getElementById(`whatif-slider-${prec}`);
                    if (slider) {
                        slider.value = 0;
                        slider.dispatchEvent(new Event('input'));
                    }
                });
            };
        }

        recalculateWhatIf(forecasts);
    }

    function recalculateWhatIf(forecasts) {
        if (!forecasts || !forecasts.predictions || !forecasts.feedstock_coefficients) return;

        const baseline = forecasts.predictions;
        const coefs = forecasts.feedstock_coefficients;
        const prices = forecasts.feedstock_prices;

        const simulated = [];
        for (let h = 0; h < 14; h++) {
            let shift = 0;
            Object.keys(whatIfState).forEach(prec => {
                const sliderPct = whatIfState[prec] / 100;
                const beta = (coefs[prec] && coefs[prec][h] !== undefined) ? coefs[prec][h] : 0;
                const xt = prices[prec] || 0;
                shift += beta * xt * sliderPct;
            });
            simulated.push(baseline[h] + shift);
        }

        simulatedForecastPoints = simulated;

        // Update result labels in UI for J+14
        const baselineJ14 = baseline[13];
        const simulatedJ14 = simulated[13];
        const simulatedPriceEl = document.getElementById('whatif-simulated-price');
        const priceChangePctEl = document.getElementById('whatif-price-change-pct');
        const marginImpactEl = document.getElementById('whatif-margin-impact');

        if (simulatedPriceEl) {
            simulatedPriceEl.textContent = formatVal(simulatedJ14, 0);
        }

        // Percentage change vs baseline J+14
        const pctDiff = ((simulatedJ14 - baselineJ14) / baselineJ14) * 100;
        if (priceChangePctEl) {
            priceChangePctEl.textContent = (pctDiff > 0 ? '+' : '') + pctDiff.toFixed(2) + '%';
            priceChangePctEl.style.color = pctDiff > 0 ? 'var(--color-emerald)' : (pctDiff < 0 ? 'var(--color-rose)' : 'var(--text-primary)');
        }

        // Calculate margin impact
        const consumptionCoeffs = {
            'Butyl_Acetate': { 'butanol': 0.65, 'acetic': 0.53 },
            'Ethyl_Acetate': { 'butanol': 0.53, 'acetic': 0.69 },
            'n_Propyl_Acetate': { 'butanol': 0.60, 'acetic': 0.59 },
            'Isopropyl_Acetate_Proxy': { 'butanol': 0.60, 'acetic': 0.59 },
            'Acrylic_Acid': { 'butanol': 0.65 },
            'Phthalic_Anhydride': { 'butanol': 0.75 },
            'Maleic_Anhydride': { 'butanol': 0.85 },
            'MMA': { 'butanol': 0.60, 'acetic': 0.45, 'methanol': 0.35 },
            'Butyl_Acrylate': { 'butanol': 0.57, 'acetic': 0.59 },
            'VAM': { 'butanol': 0.34, 'acetic': 0.71 },
            '2_EHA': { 'butanol': 0.40, 'acetic': 0.72 },
            'Ethyl_Acrylate': { 'butanol': 0.73, 'acetic': 0.47 },
            'Acetone_V1': { 'butanol': 1.05 },
            'Acetone_V2': { 'butanol': 1.40, 'acetic': 0.75 },
            'Dibasic_Ester': { 'butanol': 0.70, 'acetic': 0.35 },
            'Isopropanol': { 'butanol': 0.72 },
            'PMA': { 'butanol': 0.48, 'acetic': 0.46, 'methanol': 0.26 },
            'PM': { 'butanol': 0.69 },
            'Isophthalic_Acid': { 'butanol': 0.70 },
            'PTA': {},
            'n_Butanol': { 'butanol': 0.60 },
            'Isobutanol': { 'butanol': 0.60 },
            'MEK': { 'butanol': 0.80 },
            'MEK_V2': { 'butanol': 1.05 },
            'Styrene': { 'benzene': 0.80, 'ethylene': 0.30 },
            'MEG': { 'butanol': 0.57 },
            'DEG': { 'butanol': 0.30 },
            'PG':  { 'butanol': 0.70 },
            'Xylene': { 'butanol': 1.08 }
        };

        const formula = consumptionCoeffs[currentProduct] || {};
        let costChange = 0;
        Object.keys(whatIfState).forEach(prec => {
            const sliderPct = whatIfState[prec] / 100;
            const xt = prices[prec] || 0;
            const consumptionCoeff = formula[prec] || 0;
            costChange += xt * sliderPct * consumptionCoeff;
        });

        const targetPriceChange = simulatedJ14 - baselineJ14;
        const netMarginImpact = targetPriceChange - costChange;

        if (marginImpactEl) {
            const sign = netMarginImpact > 0 ? '+' : '';
            marginImpactEl.textContent = `${sign}${formatVal(netMarginImpact, 0)}`;
            if (netMarginImpact > 0) {
                marginImpactEl.style.color = 'var(--color-emerald)';
            } else if (netMarginImpact < 0) {
                marginImpactEl.style.color = 'var(--color-rose)';
            } else {
                marginImpactEl.style.color = 'var(--text-primary)';
            }
        }

        // Redraw/update chart series to include the simulated line
        updateChartData();
    }

    function initSeasonalPlanner(forecasts) {
        const card = document.getElementById('seasonal-planner-card');
        const container = document.getElementById('seasonal-calendar-container');
        const summaryEl = document.getElementById('planner-recommendation-summary');
        if (!card || !container) return;

        if (!forecasts || !forecasts.seasonality_monthly || !forecasts.seasonality_monthly.target) {
            card.style.display = 'none';
            return;
        }

        card.style.display = 'block';
        container.innerHTML = '';

        const targetMonthly = forecasts.seasonality_monthly.target;
        const feedstocksMonthly = forecasts.seasonality_monthly.feedstocks || {};
        
        const consumptionCoeffs = {
            'Butyl_Acetate': { 'butanol': 0.65, 'acetic': 0.53 },
            'Ethyl_Acetate': { 'butanol': 0.53, 'acetic': 0.69 },
            'n_Propyl_Acetate': { 'butanol': 0.60, 'acetic': 0.59 },
            'Isopropyl_Acetate_Proxy': { 'butanol': 0.60, 'acetic': 0.59 },
            'Acrylic_Acid': { 'butanol': 0.65 },
            'Phthalic_Anhydride': { 'butanol': 0.75 },
            'Maleic_Anhydride': { 'butanol': 0.85 },
            'MMA': { 'butanol': 0.60, 'acetic': 0.45, 'methanol': 0.35 },
            'Butyl_Acrylate': { 'butanol': 0.57, 'acetic': 0.59 },
            'VAM': { 'butanol': 0.34, 'acetic': 0.71 },
            '2_EHA': { 'butanol': 0.40, 'acetic': 0.72 },
            'Ethyl_Acrylate': { 'butanol': 0.73, 'acetic': 0.47 },
            'Acetone_V1': { 'butanol': 1.05 },
            'Acetone_V2': { 'butanol': 1.40, 'acetic': 0.75 },
            'Dibasic_Ester': { 'butanol': 0.70, 'acetic': 0.35 },
            'Isopropanol': { 'butanol': 0.72 },
            'PMA': { 'butanol': 0.48, 'acetic': 0.46, 'methanol': 0.26 },
            'PM': { 'butanol': 0.69 },
            'Isophthalic_Acid': { 'butanol': 0.70 },
            'PTA': {},
            'n_Butanol': { 'butanol': 0.60 },
            'Isobutanol': { 'butanol': 0.60 },
            'MEK': { 'butanol': 0.80 },
            'MEK_V2': { 'butanol': 1.05 },
            'Styrene': { 'benzene': 0.80, 'ethylene': 0.30 },
            'MEG': { 'butanol': 0.57 },
            'DEG': { 'butanol': 0.30 },
            'PG':  { 'butanol': 0.70 }
        };

        const formula = consumptionCoeffs[currentProduct] || {};

        // Calculate theoretical margin for each month
        const monthlyMargins = [];
        for (let m = 0; m < 12; m++) {
            const targetP = targetMonthly[m] || 0;
            let feedstockCost = 0;
            Object.keys(feedstocksMonthly).forEach(prec => {
                const coef = formula[prec] || 0;
                const precP = feedstocksMonthly[prec][m] || 0;
                feedstockCost += precP * coef;
            });
            monthlyMargins.push(targetP - feedstockCost);
        }

        // Calculate mean and std of margins
        const meanMargin = monthlyMargins.reduce((sum, v) => sum + v, 0) / 12;
        const variance = monthlyMargins.reduce((sum, v) => sum + Math.pow(v - meanMargin, 2), 0) / 12;
        const stdMargin = Math.sqrt(variance) || 1;

        const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonthIdx = new Date().getMonth(); // 0 to 11

        let optimalMonths = [];
        let avoidMonths = [];

        for (let m = 0; m < 12; m++) {
            const z = (monthlyMargins[m] - meanMargin) / stdMargin;
            let statusClass = 'planner-neutral';
            
            if (z > 0.45) {
                statusClass = 'planner-buy';
                optimalMonths.push(monthsShort[m]);
            } else if (z < -0.45) {
                statusClass = 'planner-avoid';
                avoidMonths.push(monthsShort[m]);
            }

            const isCurrent = (m === currentMonthIdx);
            
            const monthCard = document.createElement('div');
            monthCard.className = `planner-month-card ${statusClass} ${isCurrent ? 'current' : ''}`;
            monthCard.innerHTML = `
                <span class="planner-month-name">${monthsShort[m]}</span>
                <span class="planner-month-status-dot"></span>
            `;
            container.appendChild(monthCard);
        }

        // Generate synthetic recommendation text
        const bestMonthsText = optimalMonths.length > 0 ? optimalMonths.join(', ') : 'None';
        const avoidMonthsText = avoidMonths.length > 0 ? avoidMonths.join(', ') : 'None';

        if (summaryEl) {
            summaryEl.innerHTML = `
                Historically, the best margins for <strong>${TARGET_CONFIGS[currentProduct].title}</strong> are observed in <strong>${bestMonthsText}</strong>. 
                It is recommended to schedule major raw material purchases during these optimal periods to maximize returns. 
                Avoid or delay buying in <strong>${avoidMonthsText}</strong> when margins are seasonally compressed.
            `;
        }
    }

    function initBudgetCalculator(forecasts) {
        const card = document.getElementById('budget-calculator-card');
        const volumeInput = document.getElementById('budget-volume-input');
        const estimatedValEl = document.getElementById('budget-estimated-val');
        const varValEl = document.getElementById('budget-var-val');
        const savingsValEl = document.getElementById('budget-savings-val');

        if (!card || !volumeInput || !estimatedValEl || !varValEl || !savingsValEl) return;

        if (!forecasts || !forecasts.current_price) {
            card.style.display = 'none';
            return;
        }

        card.style.display = 'block';

        // Recalculation logic
        function updateBudgetCalculations() {
            const volume = parseFloat(volumeInput.value) || 0;
            const currentPrice = forecasts.current_price;
            const varPerTon = forecasts.var_10d_95 || 0;

            const estBudget = volume * currentPrice;
            const riskExposure = volume * varPerTon;

            // Fetch savings percentage from backtest results if available, else fallback to 5.4%
            let savingsPct = 5.4;
            if (backtestResultsData && backtestResultsData[currentProduct]) {
                const productBacktest = backtestResultsData[currentProduct];
                const backtest = productBacktest[currentRegion] || null;
                if (backtest && backtest.savings_pct) {
                    savingsPct = backtest.savings_pct;
                }
            }

            const estSavings = estBudget * (savingsPct / 100);

            estimatedValEl.textContent = `${getCurrencySymbol()}${Math.round(convertValue(estBudget)).toLocaleString()}`;
            varValEl.textContent = `${getCurrencySymbol()}${Math.round(convertValue(riskExposure)).toLocaleString()}`;
            savingsValEl.textContent = `${getCurrencySymbol()}${Math.round(convertValue(estSavings)).toLocaleString()} (${savingsPct}%)`;
        }

        // Add event listener (input event for real-time recalculation)
        volumeInput.removeEventListener('input', updateBudgetCalculations);
        volumeInput.addEventListener('input', updateBudgetCalculations);

        // Run initial calculations
        updateBudgetCalculations();
    }

    // Error UI view if load fails
    function showErrorState() {
        document.getElementById('chart-loader').innerHTML = `
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 40px; color: var(--color-rose)"></i>
            <p>Error loading local CSV files.</p>
            <p style="font-size:12px; color: var(--text-secondary)">Verify that you are using an HTTP server (e.g., live-server or python -m http.server).</p>
        `;
    }
});
