/* ==========================================================================
   OILCHEM DASHBOARD APPLICATION LOGIC (VANILLA JS) - MULTI-PRODUCT & REGION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // API data paths
    const PRICES_CSV_PATH = "oilchem_aligned_prices.csv";
    const LEAD_LAG_CSV_PATH = "oilchem_lead_lag_results.csv";

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
                console.log('Fetched live exchange rates:', exchangeRates);
            }
        } catch (e) {
            console.error('Failed to fetch live exchange rates, using defaults:', e);
        }
    }

    function convertValue(valInCNY) {
        if (typeof valInCNY !== 'number') {
            valInCNY = parseFloat(valInCNY);
        }
        if (isNaN(valInCNY)) return 0;
        if (currentCurrency === 'CNY') {
            return valInCNY;
        } else if (currentCurrency === 'USD') {
            return valInCNY / exchangeRates.CNY;
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
        return `${Number(converted).toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        })} ${getCurrencySymbol()}/t`;
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
        'Gulf': 'US Gulf Coast'
    };

    // Product configurations using base product keys
    const TARGET_CONFIGS = {
        'Butyl_Acetate': {
            title: "Butyl Acetate",
            precursors: {
                butyl: 'Butyl_Acetate',
                butanol: 'n-Butanol',
                acetic: 'Acetic_Acid',
                methanol: 'Methanol'
            },
            labels: {
                butyl: "Butyl Acetate (Target)",
                butanol: "n-Butanol (Feedstock)",
                acetic: "Acetic Acid (Feedstock)",
                methanol: "Methanol (Upstream)"
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
                methanol: 'Methanol'
            },
            labels: {
                butyl: "Ethyl Acetate (Target)",
                butanol: "Ethanol (Feedstock)",
                acetic: "Acetic Acid (Feedstock)",
                methanol: "Methanol (Upstream)"
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
                methanol: 'Methanol'
            },
            labels: {
                butyl: "Propyl Acetate (Target)",
                butanol: "n-Propanol (Feedstock)",
                acetic: "Acetic Acid (Feedstock)",
                methanol: "Methanol (Upstream)"
            },
            defaultChecked: [
                'n_Propyl_Acetate',
                'n-Propanol',
                'Acetic_Acid',
                'Methanol'
            ]
        },
        'Isopropyl_Acetate_Proxy': {
            title: "Isopropyl Acetate",
            precursors: {
                butyl: 'n_Propyl_Acetate', // Proxy
                butanol: 'Isopropanol',
                acetic: 'Acetic_Acid',
                methanol: 'Methanol'
            },
            labels: {
                butyl: "Isopropyl Acetate (Proxy)",
                butanol: "Isopropanol (Feedstock)",
                acetic: "Acetic Acid (Feedstock)",
                methanol: "Methanol (Upstream)"
            },
            defaultChecked: [
                'n_Propyl_Acetate',
                'Isopropanol',
                'Acetic_Acid',
                'Methanol'
            ]
        },
        'Acrylic_Acid': {
            title: "Acrylic Acid",
            precursors: {
                butyl: 'Acrylic_Acid',
                butanol: 'Propylene',
                acetic: 'Naphtha',
                methanol: 'Methanol'
            },
            labels: {
                butyl: "Acrylic Acid (Target)",
                butanol: "Propylene (Feedstock)",
                acetic: "Naphtha (Feedstock)",
                methanol: "Methanol (Upstream)"
            },
            defaultChecked: [
                'Acrylic_Acid',
                'Propylene',
                'Naphtha',
                'Methanol'
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
                methanol: 'n-Butanol'
            },
            labels: {
                butyl: "Maleic Anhydride (Target)",
                butanol: "n-Butanol (Feedstock)",
                acetic: "n-Butanol (Feedstock)",
                methanol: "n-Butanol (Feedstock)"
            },
            defaultChecked: [
                'Maleic_Anhydride',
                'n-Butanol'
            ]
        },
        'MMA': {
            title: "Methyl Methacrylate",
            precursors: {
                butyl: 'MMA',
                butanol: 'Acetone',
                acetic: 'Propylene',
                methanol: 'Methanol'
            },
            labels: {
                butyl: "MMA (Target)",
                butanol: "Acetone (Feedstock)",
                acetic: "Propylene (Feedstock)",
                methanol: "Methanol (Upstream)"
            },
            defaultChecked: [
                'MMA',
                'Acetone',
                'Propylene',
                'Methanol'
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
            title: "Vinyl Acetate Monomer",
            precursors: {
                butyl: 'VAM',
                butanol: 'Ethylene',
                acetic: 'Acetic_Acid',
                methanol: 'Methanol'
            },
            labels: {
                butyl: "VAM (Target)",
                butanol: "Ethylene (Feedstock)",
                acetic: "Acetic Acid (Feedstock)",
                methanol: "Methanol (Upstream)"
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
                methanol: 'Cyclohexane'
            },
            labels: {
                butyl: "Dibasic Ester (Target)",
                butanol: "Dicarboxylic Acid (Feedstock)",
                acetic: "Methanol (Feedstock)",
                methanol: "Cyclohexane (Upstream)"
            },
            defaultChecked: [
                'Dibasic_Ester',
                'Dicarboxylic_Acid',
                'Methanol',
                'Cyclohexane'
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
                methanol: 'Methanol'
            },
            labels: {
                butyl: "MPA (Target)",
                butanol: "Propylene Oxide (Feedstock)",
                acetic: "Acetic Acid (Feedstock)",
                methanol: "Methanol (Feedstock)"
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
                methanol: 'Propylene'
            },
            labels: {
                butyl: "PM (Target)",
                butanol: "Propylene Oxide (Feedstock)",
                acetic: "Methanol (Feedstock)",
                methanol: "Propylene (Upstream)"
            },
            defaultChecked: [
                'PM',
                'Propylene_Oxide',
                'Methanol',
                'Propylene'
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
                butyl: 'PTA'
            },
            labels: {
                butyl: "PTA (Target)"
            },
            defaultChecked: [
                'PTA'
            ]
        },
        'n_Butanol': {
            title: "n-Butanol",
            precursors: {
                butyl: 'n-Butanol',
                butanol: 'Propylene',
                acetic: 'Naphtha',
                methanol: 'Naphtha'
            },
            labels: {
                butyl: "n-Butanol (Target)",
                butanol: "Propylene (Feedstock)",
                acetic: "Naphtha (Upstream)",
                methanol: "Naphtha (Upstream)"
            },
            defaultChecked: [
                'n-Butanol',
                'Propylene',
                'Naphtha'
            ]
        },
        'Isobutanol': {
            title: "Isobutanol",
            precursors: {
                butyl: 'Isobutanol',
                butanol: 'Propylene',
                acetic: 'Naphtha',
                methanol: 'Naphtha'
            },
            labels: {
                butyl: "Isobutanol (Target)",
                butanol: "Propylene (Feedstock)",
                acetic: "Naphtha (Upstream)",
                methanol: "Naphtha (Upstream)"
            },
            defaultChecked: [
                'Isobutanol',
                'Propylene',
                'Naphtha'
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
                acetic: 'Methanol'
            },
            labels: {
                butyl: "Toluene (Target)",
                butanol: "Benzene (Feedstock)",
                acetic: "Methanol (Feedstock)"
            },
            defaultChecked: [
                'Toluene',
                'Benzene',
                'Methanol'
            ]
        },
        'PX': {
            title: "p-Xylene",
            precursors: {
                butyl: 'PX',
                butanol: 'Toluene',
                acetic: 'Methanol'
            },
            labels: {
                butyl: "p-Xylene (Target)",
                butanol: "Toluene (Feedstock)",
                acetic: "Methanol (Feedstock)"
            },
            defaultChecked: [
                'PX',
                'Toluene',
                'Methanol'
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
        'PX': 'PX_Domestic_扬子石化',
        'Ethylbenzene': 'Ethylbenzene_Domestic_吉林石化',
        'Acrylic_Acid': 'Acrylic_Acid_Domestic_华东',
        'Toluene': 'Toluene_Domestic_山东'
    };

    // Helper to resolve the correct column name with region fallback
    function resolveColumnForRegion(baseProd, region, isFeedstock = false) {
        // If it is a feedstock, check canonical benchmarks first to align with LaTeX documentation
        if (isFeedstock && FEEDSTOCK_BENCHMARKS[baseProd]) {
            const col = FEEDSTOCK_BENCHMARKS[baseProd];
            if (priceHeaders.includes(col)) return col;
        }

        // 1. Find exact match for baseProd and region
        const exact = priceHeaders.find(h => h.startsWith(baseProd + '_') && h.includes(region));
        if (exact) return exact;
        const partial = priceHeaders.find(h => h.includes(baseProd) && h.includes(region));
        if (partial) return partial;

        // 2. Dynamic Fallback: Try to find a region for baseProd that has computed Lead-Lag data for currentTarget
        if (rawLeadLagData && rawLeadLagData.length > 0) {
            const targetRows = rawLeadLagData.filter(item => 
                item.Target === currentTarget && 
                item.Feature && 
                item.Feature.includes(baseProd)
            );
            if (targetRows.length > 0) {
                // Sort by absolute correlation to pick the strongest reference market
                targetRows.sort((a, b) => Math.abs(b.Max_Correlation) - Math.abs(a.Max_Correlation));
                const bestFeature = targetRows[0].Feature;
                // Verify it exists in priceHeaders
                if (priceHeaders.includes(bestFeature)) return bestFeature;
            }
        }

        // 3. Fallback: exact baseProd but any region
        const fallbackExact = priceHeaders.find(h => h.startsWith(baseProd + '_'));
        if (fallbackExact) return fallbackExact;
        
        // 4. Fallback: any partial match
        const fallbackPartial = priceHeaders.find(h => h.includes(baseProd));
        return fallbackPartial || baseProd;
    }

    // Resolve exact target column based on select product and region
    function resolveTargetColumn(product, region) {
        if (product === 'Isopropyl_Acetate_Proxy') {
            return priceHeaders.find(h => h.includes('n_Propyl_Acetate') && h.includes(region)) || 'n_Propyl_Acetate_Domestic_华东';
        }
        if (product === 'Acetone_V1' || product === 'Acetone_V2') {
            return priceHeaders.find(h => h.includes('Acetone_Domestic') && h.includes(region)) || 'Acetone_Domestic_华东';
        }
        return priceHeaders.find(h => h.includes(product) && h.includes(region)) || `${product}_Domestic_${region}`;
    }

    // Extract regions available in CSV for a given product
    function getAvailableRegionsForProduct(product) {
        let searchPattern = product;
        if (product === 'Isopropyl_Acetate_Proxy') {
            searchPattern = 'n_Propyl_Acetate_Domestic';
        } else if (product === 'Acetone_V1' || product === 'Acetone_V2') {
            searchPattern = 'Acetone_Domestic';
        } else {
            searchPattern = product + '_Domestic';
        }

        const matchedCols = priceHeaders.filter(h => h.includes(searchPattern));
        const regions = [];
        matchedCols.forEach(col => {
            const parts = col.split('_');
            const region = parts[parts.length - 1];
            if (region && !regions.includes(region)) {
                regions.push(region);
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
            'PM': '华东'
        };
        return defaultMap[product] || '华东';
    }

    // Populate region select dynamically
    function populateRegionSelector(product) {
        const regionSelect = document.getElementById('market-region-select');
        if (!regionSelect) return;
        regionSelect.innerHTML = "";

        const regions = getAvailableRegionsForProduct(product);
        regions.forEach(region => {
            const opt = document.createElement('option');
            opt.value = region;
            opt.textContent = REGION_MAP[region] || region;
            regionSelect.appendChild(opt);
        });

        // Resolve product-specific benchmark default, with general fallbacks
        const preferredDefault = getDefaultRegionForProduct(product);
        let defaultRegion = regions[0];
        if (regions.includes(preferredDefault)) {
            defaultRegion = preferredDefault;
        } else {
            const preferredRegionsOrder = ['华东', '山东', '华南', '华北', '江苏'];
            for (const pref of preferredRegionsOrder) {
                if (regions.includes(pref)) {
                    defaultRegion = pref;
                    break;
                }
            }
        }

        const defaultIndex = regions.indexOf(defaultRegion);
        regionSelect.selectedIndex = defaultIndex >= 0 ? defaultIndex : 0;
        currentRegion = regionSelect.value;
    }

    // Update active KPI columns based on current target config and region
    function updateKPIColumns() {
        const config = TARGET_CONFIGS[currentProduct];
        KPI_COLUMNS = {
            butyl: resolveColumnForRegion(config.precursors.butyl, currentRegion, false),
            butanol: resolveColumnForRegion(config.precursors.butanol, currentRegion, true),
            acetic: resolveColumnForRegion(config.precursors.acetic, currentRegion, true),
            methanol: resolveColumnForRegion(config.precursors.methanol, currentRegion, true)
        };
    }

    // Check if a header is related to the active product
    function isColumnRelated(header, product) {
        if (product === 'Butyl_Acetate') {
            return header.includes('Butyl_Acetate') || 
                   header.includes('n-Butanol') || 
                   header.includes('Acetic_Acid') || 
                   header.includes('Methanol') || 
                   header.includes('Propylene');
        } else if (product === 'Ethyl_Acetate') {
            return header.includes('Ethyl_Acetate') || 
                   header.includes('Ethanol') || 
                   header.includes('Acetic_Acid') || 
                   header.includes('Ethylene') || 
                   header.includes('Methanol');
        } else if (product === 'n_Propyl_Acetate' || product === 'Isopropyl_Acetate_Proxy') {
            return header.includes('n_Propyl_Acetate') || 
                   header.includes('n-Propanol') || 
                   header.includes('Isopropanol') || 
                   header.includes('Acetic_Acid') || 
                   header.includes('Propylene') || 
                   header.includes('Methanol');
        } else if (product === 'Acrylic_Acid') {
            return header.includes('Acrylic_Acid') || 
                   header.includes('Propylene') || 
                   header.includes('Naphtha') || 
                   header.includes('Methanol');
        } else if (product === 'Phthalic_Anhydride') {
            return header.includes('Phthalic_Anhydride') || 
                   header.includes('o_Xylene') || 
                   header.includes('Reformed_Naphtha') || 
                   header.includes('Methanol');
        } else if (product === 'Maleic_Anhydride') {
            return header.includes('Maleic_Anhydride') || 
                   header.includes('n-Butanol');
        } else if (product === 'MMA') {
            return header.includes('MMA') || 
                   header.includes('Acetone') || 
                   header.includes('Propylene') || 
                   header.includes('Methanol');
        } else if (product === 'Butyl_Acrylate') {
            return header.includes('Butyl_Acrylate') || 
                   header.includes('Acrylic_Acid') || 
                   header.includes('n-Butanol') || 
                   header.includes('Propylene') || 
                   header.includes('Methanol');
        } else if (product === 'VAM') {
            return header.includes('VAM') || 
                   header.includes('Ethylene') || 
                   header.includes('Acetic_Acid') || 
                   header.includes('Naphtha') || 
                   header.includes('Ethanol') || 
                   header.includes('Methanol');
        } else if (product === '2_EHA') {
            return header.includes('2_EHA') || 
                   header.includes('Acrylic_Acid') || 
                   header.includes('Octanol') || 
                   header.includes('Propylene') || 
                   header.includes('Methanol');
        } else if (product === 'Ethyl_Acrylate') {
            return header.includes('Ethyl_Acrylate') || 
                   header.includes('Acrylic_Acid') || 
                   header.includes('Ethanol') || 
                   header.includes('Propylene') || 
                   header.includes('Ethylene');
        } else if (product === 'Acetone_V1') {
            return header.includes('Acetone') || 
                   header.includes('Isopropanol') || 
                   header.includes('Propylene');
        } else if (product === 'Acetone_V2') {
            return header.includes('Acetone') || 
                   header.includes('Benzene') || 
                   header.includes('Propylene') || 
                   header.includes('Reformed_Naphtha') || 
                   header.includes('Naphtha');
        } else if (product === 'Dibasic_Ester') {
            return header.includes('Dibasic_Ester') || 
                   header.includes('Dicarboxylic_Acid') || 
                   header.includes('Methanol') || 
                   header.includes('Cyclohexane');
        } else if (product === 'Isopropanol') {
            return header.includes('Isopropanol') || 
                   header.includes('Propylene') || 
                   header.includes('Naphtha');
        } else if (product === 'PMA') {
            return header.includes('PMA') || 
                   header.includes('Propylene_Oxide') || 
                   header.includes('Acetic_Acid') || 
                   header.includes('Methanol');
        } else if (product === 'PM') {
            return header.includes('PM') || 
                   header.includes('Propylene_Oxide') || 
                   header.includes('Methanol') || 
                   header.includes('Propylene');
        } else if (product === 'Isophthalic_Acid') {
            return header.includes('Isophthalic_Acid') || 
                   header.includes('m_Xylene') || 
                   header.includes('Reformed_Naphtha');
        } else if (product === 'PTA') {
            return header.includes('PTA') || 
                   header.includes('PX') || 
                   header.includes('Reformed_Naphtha');
        } else if (product === 'n_Butanol') {
            return header.includes('n-Butanol') || 
                   header.includes('Propylene') || 
                   header.includes('Naphtha');
        } else if (product === 'Isobutanol') {
            return header.includes('Isobutanol') || 
                   header.includes('Propylene') || 
                   header.includes('Naphtha');
        } else if (product === 'MEK') {
            return header.includes('MEK') || 
                   header.includes('2_Butene') || 
                   header.includes('Naphtha') || 
                   header.includes('n_Butane');
        } else if (product === 'MEK_V2') {
            return header.includes('MEK') || 
                   header.includes('2_Butanol') || 
                   header.includes('1_Butene_2_Butene');
        } else if (product === 'Styrene') {
            return header.includes('Styrene') || 
                   header.includes('Ethylbenzene') || 
                   header.includes('Propylene') || 
                   header.includes('Reformed_Naphtha') || 
                   header.includes('Naphtha');
        } else if (product === 'Toluene') {
            return header.includes('Toluene') || 
                   header.includes('Benzene') || 
                   header.includes('Methanol');
        } else if (product === 'PX') {
            return header.includes('PX') || 
                   header.includes('Toluene') || 
                   header.includes('Methanol');
        }
        return false;
    }

    // ==========================================
    // DATA PROCESSING
    // ==========================================
    function processPrices(data) {
        if (!data || data.length === 0) return;
        
        rawPricesData = data;
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
        
        document.getElementById('chart-loader').style.display = 'none';
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
        const defaultMatches = config.defaultChecked.map(col => resolveColumnForRegion(col, currentRegion, col !== config.precursors.butyl));
        const relatedHeaders = priceHeaders.filter(h => isColumnRelated(h, currentProduct));

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
            
            let displayName = header
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
            
            series.push({
                name: col.replace('_Domestic', '').replace('Octanol', '2-Ethylhexanol').replace(/_/g, ' '),
                color: color,
                data: slicedData.map(row => ({
                    x: new Date(row.Date).getTime(),
                    y: convertValue(row[col])
                }))
            });
        });

        // 5. Add forecast line if available
        if (financialForecastsData && financialForecastsData.products && financialForecastsData.products[currentProduct]) {
            const productData = financialForecastsData.products[currentProduct];
            const forecasts = productData[currentRegion] || Object.values(productData)[0];
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
    }

    // ==========================================
    // LEAD-LAG SIDEBAR LIST
    // ==========================================
    function displayLeadLag(data) {
        const container = document.getElementById('lead-lag-list-container');
        if (!container) return;
        container.innerHTML = "";

        const config = TARGET_CONFIGS[currentProduct];
        const allowedBaseProds = config ? config.defaultChecked.filter(base => 
            selectedSeries.some(sel => sel.includes(base))
        ) : [];

        const filtered = [];
        allowedBaseProds.forEach(base => {
            // Exclude the target product itself
            const targetPrefix = config.defaultChecked[0];
            if (base === targetPrefix || currentTarget.includes(base)) return;

            const targetRows = data.filter(item => 
                item.Target === currentTarget && 
                item.Feature && 
                item.Feature.includes(base)
            );
            if (targetRows.length === 0) return;

            const exactCheckedCol = selectedSeries.find(sel => sel.includes(base));
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

            const isDirect = featureName.includes('n-Butanol') || featureName.includes('Ethanol') || featureName.includes('Isopropanol') || featureName.includes('Acetic_Acid') || featureName.includes('Octanol');
            const tagClass = isDirect ? 'direct' : 'upstream';
            const tagLabel = isDirect ? 'Direct Feedstock' : 'Upstream / Other';

            const itemDiv = document.createElement('div');
            itemDiv.className = 'lead-lag-item';

            const absPercent = Math.min(100, Math.round(Math.abs(maxCorr) * 100));
            const barColor = maxCorr >= 0 ? 'var(--color-cyan)' : 'var(--color-rose)';
            const cleanFeature = featureName.replace('_Domestic', '').replace('Octanol', '2-Ethylhexanol').replace(/_/g, ' ');

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
        const allowedBaseProds = config ? config.defaultChecked.filter(base => 
            selectedSeries.some(sel => sel.includes(base))
        ) : [];

        const filtered = [];
        allowedBaseProds.forEach(base => {
            const targetPrefix = config.defaultChecked[0];
            if (base === targetPrefix || currentTarget.includes(base)) return;

            const targetRows = data.filter(item => 
                item.Target === currentTarget && 
                item.Feature && 
                item.Feature.includes(base)
            );
            if (targetRows.length === 0) return;

            const exactCheckedCol = selectedSeries.find(sel => sel.includes(base));
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
            const feature = item.Feature.replace('_Domestic', '').replace(/_/g, ' ');
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
                upstreamA: '',
                feedstockA: 'n-Butanol',
                upstreamB: '',
                feedstockB: '',
                target: 'Maleic_Anhydride'
            },
            'MMA': {
                upstreamA: 'Propylene',
                feedstockA: 'Acetone',
                upstreamB: '',
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
                upstreamB: '',
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
                upstreamB: '',
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
                feedstockA: 'PX',
                upstreamB: '',
                feedstockB: '',
                target: 'PTA'
            },
            'n_Butanol': {
                upstreamA: 'Naphtha',
                feedstockA: 'Propylene',
                upstreamB: '',
                feedstockB: '',
                target: 'n-Butanol'
            },
            'Isobutanol': {
                upstreamA: 'Naphtha',
                feedstockA: 'Propylene',
                upstreamB: '',
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
            return key.replace(/_Domestic/i, '').replace(/_Proxy/i, '').replace(/_/g, ' ').replace(/-/g, ' ');
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

        if (filteredData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary)">No results found</td></tr>`;
            document.getElementById('pagination-info-el').textContent = "Page 0 of 0";
            return;
        }

        const displayHeaders = ['Date', ...selectedSeries.slice(0, 4)];
        
        displayHeaders.forEach(col => {
            const th = document.createElement('th');
            let headerText = col.replace('_Domestic', '').replace(/_/g, ' ');
            if (col !== 'Date') {
                headerText += ` (${getCurrencySymbol()}/t)`;
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
                } else {
                    const val = row[col];
                    td.textContent = (val !== null && val !== undefined) 
                        ? Number(convertValue(val)).toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1}) 
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

    // Region Select Change Event Listener
    const regionSelect = document.getElementById('market-region-select');
    if (regionSelect) {
        regionSelect.addEventListener('change', (e) => {
            currentRegion = e.target.value;
            currentTarget = resolveTargetColumn(currentProduct, currentRegion);
            handleTargetProductChange();
        });
    }

    // Custom Searchable Dropdown Logic
    function initializeCustomSearchableSelect() {
        const container = document.getElementById('custom-target-select-container');
        const input = document.getElementById('target-product-search-input');
        const list = document.getElementById('target-product-options-list');
        const select = document.getElementById('target-product-select');
        
        if (!container || !input || !list || !select) return;

        // Read options
        const options = Array.from(select.options).map(opt => ({
            value: opt.value,
            text: opt.textContent
        }));

        // Set initial value
        const selectedOpt = select.options[select.selectedIndex];
        if (selectedOpt) {
            input.value = selectedOpt.textContent;
        }

        // Toggle open/closed
        input.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = container.classList.contains('open');
            document.querySelectorAll('.custom-searchable-select').forEach(el => el.classList.remove('open'));
            if (!isOpen) {
                container.classList.add('open');
                input.readOnly = false;
                input.value = "";
                renderOptions("");
            }
        });

        // Search input
        input.addEventListener('input', (e) => {
            renderOptions(e.target.value);
        });

        // Close when clicking outside
        document.addEventListener('click', () => {
            closeDropdown();
        });

        function closeDropdown() {
            container.classList.remove('open');
            input.readOnly = true;
            const currentSelectedOpt = select.options[select.selectedIndex];
            if (currentSelectedOpt) {
                input.value = currentSelectedOpt.textContent;
            }
        }

        // Render options list
        function renderOptions(query) {
            list.innerHTML = "";
            const filtered = options.filter(opt => 
                opt.text.toLowerCase().includes(query.toLowerCase())
            );

            if (filtered.length === 0) {
                const li = document.createElement('li');
                li.className = 'no-results';
                li.textContent = "No products found";
                list.appendChild(li);
                return;
            }

            filtered.forEach(opt => {
                const li = document.createElement('li');
                li.textContent = opt.text;
                li.setAttribute('data-value', opt.value);
                
                if (select.value === opt.value) {
                    li.className = 'selected';
                }

                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    select.value = opt.value;
                    input.value = opt.text;
                    select.dispatchEvent(new Event('change'));
                    closeDropdown();
                });

                list.appendChild(li);
            });
        }

        // Synchronize when the native select changes from other code (e.g. tree clicks)
        select.addEventListener('change', () => {
            const externalSelectedOpt = select.options[select.selectedIndex];
            if (externalSelectedOpt) {
                input.value = externalSelectedOpt.textContent;
            }
        });
    }

    // Initialize custom select
    initializeCustomSearchableSelect();

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
        const defaultMatches = config.defaultChecked.map(col => resolveColumnForRegion(col, currentRegion, col !== config.precursors.butyl));
        selectedSeries = [...defaultMatches];

        // Recompute KPIs, rebuild selectors, redraw chart & table, redraw Lead-Lag
        updateKPIs();
        createSeriesSelectors();
        updateChartData();
        renderTable();
        displayLeadLag(rawLeadLagData);
        updateFinancialSignals();
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
            if (signalVal) signalVal.textContent = "Indisponible";
            return;
        }

        const productData = financialForecastsData.products[currentProduct];
        if (!productData) {
            if (signalVal) signalVal.textContent = "N/A";
            return;
        }

        const forecasts = productData[currentRegion] || Object.values(productData)[0];
        if (!forecasts) {
            if (signalVal) signalVal.textContent = "N/A";
            return;
        }

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
            const backtest = productBacktest[currentRegion] || Object.values(productBacktest)[0];
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
                forecasts = productData[currentRegion] || Object.values(productData)[0];
            }

            if (cardId === 'whatif-simulator-card') {
                shouldShow = (forecasts && forecasts.feedstock_coefficients && forecasts.feedstock_prices);
            } else if (cardId === 'seasonal-planner-card') {
                shouldShow = (forecasts && forecasts.seasonality_monthly);
            } else if (cardId === 'budget-calculator-card') {
                shouldShow = (forecasts && forecasts.current_price);
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
            'Styrene': { 'benzene': 0.80, 'ethylene': 0.30 }
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
            'Styrene': { 'benzene': 0.80, 'ethylene': 0.30 }
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
                const backtest = productBacktest[currentRegion] || Object.values(productBacktest)[0];
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
