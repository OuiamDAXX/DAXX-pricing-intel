/* ==========================================================================
   OILCHEM DASHBOARD APPLICATION LOGIC (VANILLA JS) - MULTI-PRODUCT & REGION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // API data paths
    const PRICES_CSV_PATH = "oilchem_aligned_prices.csv";
    const LEAD_LAG_CSV_PATH = "oilchem_lead_lag_results.csv";

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
                'Methanol'
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
                butanol: 'n_Butane',
                acetic: 'Methanol',
                methanol: 'Methanol'
            },
            labels: {
                butyl: "Maleic Anhydride (Target)",
                butanol: "n-Butane (Feedstock)",
                acetic: "Methanol (Upstream)",
                methanol: "Methanol (Upstream)"
            },
            defaultChecked: [
                'Maleic_Anhydride',
                'n_Butane',
                'Methanol'
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
                'Naphtha'
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
    
    // Pagination state
    async function loadData() {
        try {
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

    // Helper to resolve the correct column name with region fallback
    function resolveColumnForRegion(baseProd, region) {
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

        regionSelect.selectedIndex = 0;
        currentRegion = regionSelect.value;
    }

    // Update active KPI columns based on current target config and region
    function updateKPIColumns() {
        const config = TARGET_CONFIGS[currentProduct];
        KPI_COLUMNS = {
            butyl: resolveColumnForRegion(config.precursors.butyl, currentRegion),
            butanol: resolveColumnForRegion(config.precursors.butanol, currentRegion),
            acetic: resolveColumnForRegion(config.precursors.acetic, currentRegion),
            methanol: resolveColumnForRegion(config.precursors.methanol, currentRegion)
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
                   header.includes('n_Butane') || 
                   header.includes('Methanol');
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

        Object.entries(KPI_COLUMNS).forEach(([key, colName]) => {
            const valEl = document.getElementById(`kpi-${key}-val`);
            const changeEl = document.getElementById(`kpi-${key}-change`);
            
            if (!valEl || !changeEl) return;

            if (latestRow[colName] !== undefined && latestRow[colName] !== null) {
                const currentVal = latestRow[colName];
                const prevVal = previousRow[colName] || currentVal;
                const absChange = currentVal - prevVal;
                const pctChange = prevVal !== 0 ? (absChange / prevVal) * 100 : 0;
                
                valEl.textContent = `${Number(currentVal).toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1})} ¥/t`;
                
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
        const defaultMatches = config.defaultChecked.map(col => resolveColumnForRegion(col, currentRegion));
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
                .replace(/_/g, ' ');
            
            label.appendChild(document.createTextNode(displayName));
            container.appendChild(label);
        });
    }

    // ==========================================
    // CHART DRAWING (APEXCHARTS)
    // ==========================================
    function initializeChart() {
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
                width: 3.5
            },
            grid: {
                borderColor: 'rgba(255, 255, 255, 0.05)',
                strokeDashArray: 4
            },
            series: getChartSeries(),
            xaxis: {
                type: 'datetime',
                categories: alignedDates,
                labels: {
                    style: {
                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Market Price (¥/Ton)',
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
                    format: 'dd MMM yyyy'
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
        chartInstance = new ApexCharts(document.querySelector("#main-chart"), options);
        chartInstance.render();
    }

    function getChartSeries() {
        let slicedData = rawPricesData;
        if (timeRangeDays !== "all") {
            slicedData = rawPricesData.slice(-parseInt(timeRangeDays));
        }

        const series = [];
        selectedSeries.forEach((col, idx) => {
            let color = CHART_COLORS[idx % CHART_COLORS.length];
            
            if (col.includes('Butyl_Acetate') || col.includes('Ethyl_Acetate') || col.includes('n_Propyl_Acetate') || col.includes('Acrylic_Acid') || col.includes('Phthalic_Anhydride') || col.includes('Maleic_Anhydride') || col.includes('MMA') || col.includes('Butyl_Acrylate') || col.includes('VAM') || col.includes('2_EHA') || col.includes('Ethyl_Acrylate')) color = '#06b6d4';
            else if (col.includes('n-Butanol') || col.includes('Ethanol') || col.includes('Isopropanol') || col.includes('n-Propanol') || col.includes('o_Xylene') || col.includes('n_Butane') || col.includes('Acetone') || col.includes('Octanol') || col.includes('Benzene')) color = '#6366f1';
            else if (col.includes('Acetic_Acid') || col.includes('Naphtha') || col.includes('Reformed_Naphtha')) color = '#10b981';
            else if (col.includes('Methanol') || col.includes('Propylene')) color = '#f59e0b';
            
            series.push({
                name: col.replace('_Domestic', '').replace(/_/g, ' '),
                color: color,
                data: slicedData.map(row => ({
                    x: new Date(row.Date).getTime(),
                    y: row[col]
                }))
            });
        });

        return series;
    }

    function updateChartData() {
        if (!chartInstance) return;
        
        let slicedData = rawPricesData;
        if (timeRangeDays !== "all") {
            slicedData = rawPricesData.slice(-parseInt(timeRangeDays));
        }
        
        const newDates = slicedData.map(row => row.Date);
        
        chartInstance.updateOptions({
            xaxis: {
                categories: newDates
            }
        });
        chartInstance.updateSeries(getChartSeries());
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

            const isDirect = featureName.includes('n-Butanol') || featureName.includes('Ethanol') || featureName.includes('Isopropanol') || featureName.includes('Acetic_Acid');
            const tagClass = isDirect ? 'direct' : 'upstream';
            const tagLabel = isDirect ? 'Direct Feedstock' : 'Upstream / Other';

            const itemDiv = document.createElement('div');
            itemDiv.className = 'lead-lag-item';

            const absPercent = Math.min(100, Math.round(Math.abs(maxCorr) * 100));
            const barColor = maxCorr >= 0 ? 'var(--color-cyan)' : 'var(--color-rose)';
            const cleanFeature = featureName.replace('_Domestic', '').replace(/_/g, ' ');

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

        let html = '<div class="chemical-chain-tree">';

        // 1. Upstream stage
        if (config.precursors.methanol) {
            const label = config.labels.methanol ? config.labels.methanol.replace(' (Upstream)', '') : 'Methanol';
            html += `
                <div class="chain-step">
                    <span class="chain-role upstream">Upstream</span>
                    <span class="chain-name">${label}</span>
                </div>
                <div class="chain-connector"><i class="fa-solid fa-arrow-down"></i></div>
            `;
        }

        // 2. Feedstocks stage
        let feedstocks = [];
        if (config.precursors.butanol) {
            feedstocks.push(config.labels.butanol ? config.labels.butanol.replace(' (Feedstock)', '') : 'Feedstock 1');
        }
        if (config.precursors.acetic) {
            feedstocks.push(config.labels.acetic ? config.labels.acetic.replace(' (Feedstock)', '') : 'Feedstock 2');
        }

        if (feedstocks.length > 0) {
            feedstocks.forEach((fs, idx) => {
                html += `
                    <div class="chain-step">
                        <span class="chain-role feedstock">Feedstock</span>
                        <span class="chain-name">${fs}</span>
                    </div>
                `;
                if (idx < feedstocks.length - 1) {
                    html += `<div class="chain-connector" style="margin: 2px 0;"><i class="fa-solid fa-plus"></i></div>`;
                }
            });
            html += `<div class="chain-connector"><i class="fa-solid fa-arrow-down"></i></div>`;
        }

        // 3. Target stage
        const targetLabel = config.title;
        html += `
            <div class="chain-step">
                <span class="chain-role target">Target</span>
                <span class="chain-name">${targetLabel}</span>
            </div>
        `;

        html += '</div>';
        container.innerHTML = html;
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
            th.textContent = col.replace('_Domestic', '').replace(/_/g, ' ');
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
                        ? Number(val).toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1}) 
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
        link.setAttribute("download", "oilchem_china_prices_aligned.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        const defaultMatches = config.defaultChecked.map(col => resolveColumnForRegion(col, currentRegion));
        selectedSeries = [...defaultMatches];

        // Recompute KPIs, rebuild selectors, redraw chart & table, redraw Lead-Lag
        updateKPIs();
        createSeriesSelectors();
        updateChartData();
        renderTable();
        displayLeadLag(rawLeadLagData);
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
