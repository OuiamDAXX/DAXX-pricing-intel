/* ==========================================================================
   OILCHEM DASHBOARD APPLICATION LOGIC (VANILLA JS) - MULTI-PRODUCT VERSION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // API data paths
    const PRICES_CSV_PATH = "oilchem_aligned_prices.csv";
    const LEAD_LAG_CSV_PATH = "oilchem_lead_lag_results.csv";

    // Product configurations
    const TARGET_CONFIGS = {
        'Butyl_Acetate_Domestic_华东': {
            title: "Acétate de Butyle",
            precursors: {
                butyl: 'Butyl_Acetate_Domestic_华东',
                butanol: 'n-Butanol_Domestic_华东',
                acetic: 'Acetic_Acid_Domestic_华南',
                methanol: 'Methanol_Domestic_山东中部'
            },
            labels: {
                butyl: "Acétate de Butyle (Cible)",
                butanol: "n-Butanol (Feedstock)",
                acetic: "Acide Acétique (Feedstock)",
                methanol: "Méthanol (Amont)"
            },
            defaultChecked: [
                'Butyl_Acetate_Domestic_华东',
                'n-Butanol_Domestic_华东',
                'Acetic_Acid_Domestic_华南',
                'Methanol_Domestic_山东中部'
            ]
        },
        'Ethyl_Acetate_Domestic_华东': {
            title: "Acétate d'Éthyle",
            precursors: {
                butyl: 'Ethyl_Acetate_Domestic_华东',
                butanol: 'Ethanol_Domestic_山东',
                acetic: 'Acetic_Acid_Domestic_华南',
                methanol: 'Methanol_Domestic_山东中部'
            },
            labels: {
                butyl: "Acétate d'Éthyle (Cible)",
                butanol: "Éthanol (Feedstock)",
                acetic: "Acide Acétique (Feedstock)",
                methanol: "Méthanol (Amont)"
            },
            defaultChecked: [
                'Ethyl_Acetate_Domestic_华东',
                'Ethanol_Domestic_山东',
                'Acetic_Acid_Domestic_华南',
                'Methanol_Domestic_山东中部'
            ]
        },
        'n_Propyl_Acetate_Domestic_华东': {
            title: "Acétate de Propyle",
            precursors: {
                butyl: 'n_Propyl_Acetate_Domestic_华东',
                butanol: 'n-Propanol_Domestic_华东',
                acetic: 'Acetic_Acid_Domestic_华南',
                methanol: 'Methanol_Domestic_山东中部'
            },
            labels: {
                butyl: "Acétate de Propyle (Cible)",
                butanol: "n-Propanol (Feedstock)",
                acetic: "Acide Acétique (Feedstock)",
                methanol: "Méthanol (Amont)"
            },
            defaultChecked: [
                'n_Propyl_Acetate_Domestic_华东',
                'n-Propanol_Domestic_华东',
                'Acetic_Acid_Domestic_华南',
                'Methanol_Domestic_山东中部'
            ]
        },
        'Isopropyl_Acetate_Domestic_Proxy_华东': {
            title: "Acétate d'Isopropyle",
            precursors: {
                butyl: 'n_Propyl_Acetate_Domestic_华东', // Proxy
                butanol: 'Isopropanol_Domestic_山东',
                acetic: 'Acetic_Acid_Domestic_华南',
                methanol: 'Methanol_Domestic_山东中部'
            },
            labels: {
                butyl: "Acétate d'Isopropyle (Proxy)",
                butanol: "Isopropanol (Feedstock)",
                acetic: "Acide Acétique (Feedstock)",
                methanol: "Méthanol (Amont)"
            },
            defaultChecked: [
                'n_Propyl_Acetate_Domestic_华东',
                'Isopropanol_Domestic_山东',
                'Acetic_Acid_Domestic_华南',
                'Methanol_Domestic_山东中部'
            ]
        },
        'Acrylic_Acid_Domestic_华东': {
            title: "Acide Acrylique",
            precursors: {
                butyl: 'Acrylic_Acid_Domestic_华东',
                butanol: 'Propylene_Domestic_华东',
                acetic: 'Naphtha_Domestic_华东',
                methanol: 'Methanol_Domestic_山东中部'
            },
            labels: {
                butyl: "Acide Acrylique (Cible)",
                butanol: "Propylène (Feedstock)",
                acetic: "Naphta (Feedstock)",
                methanol: "Méthanol (Amont)"
            },
            defaultChecked: [
                'Acrylic_Acid_Domestic_华东',
                'Propylene_Domestic_华东',
                'Naphtha_Domestic_华东',
                'Methanol_Domestic_山东中部'
            ]
        },
        'Phthalic_Anhydride_Domestic_华东': {
            title: "Anhydride Phtalique",
            precursors: {
                butyl: 'Phthalic_Anhydride_Domestic_华东',
                butanol: 'o_Xylene_Domestic_华东',
                acetic: 'Reformed_Naphtha_Domestic_华东',
                methanol: 'Methanol_Domestic_山东中部'
            },
            labels: {
                butyl: "Anhydride Phtalique (Cible)",
                butanol: "o-Xilène (Feedstock)",
                acetic: "Naphta Reformé (Feedstock)",
                methanol: "Méthanol (Amont)"
            },
            defaultChecked: [
                'Phthalic_Anhydride_Domestic_华东',
                'o_Xylene_Domestic_华东',
                'Reformed_Naphtha_Domestic_华东',
                'Methanol_Domestic_山东中部'
            ]
        },
        'Maleic_Anhydride_Domestic_华东': {
            title: "Anhydride Maléique",
            precursors: {
                butyl: 'Maleic_Anhydride_Domestic_华东',
                butanol: 'n_Butane_Domestic_华东',
                acetic: 'Methanol_Domestic_山东中部', // Fallback for 3rd spot
                methanol: 'Methanol_Domestic_山东中部'
            },
            labels: {
                butyl: "Anhydride Maléique (Cible)",
                butanol: "n-Butane (Feedstock)",
                acetic: "Méthanol (Amont)",
                methanol: "Méthanol (Amont)"
            },
            defaultChecked: [
                'Maleic_Anhydride_Domestic_华东',
                'n_Butane_Domestic_华东',
                'Methanol_Domestic_山东中部'
            ]
        },
        'MMA_Domestic_华东': {
            title: "Méthacrylate de Méthyle",
            precursors: {
                butyl: 'MMA_Domestic_华东',
                butanol: 'Acetone_Domestic_华东',
                acetic: 'Propylene_Domestic_华东',
                methanol: 'Methanol_Domestic_山东中部'
            },
            labels: {
                butyl: "MMA (Cible)",
                butanol: "Acétone (Feedstock)",
                acetic: "Propylène (Feedstock)",
                methanol: "Méthanol (Amont)"
            },
            defaultChecked: [
                'MMA_Domestic_华东',
                'Acetone_Domestic_华东',
                'Propylene_Domestic_华东',
                'Methanol_Domestic_山东中部'
            ]
        },
        'Butyl_Acrylate_Domestic_华东': {
            title: "Acrylate de Butyle",
            precursors: {
                butyl: 'Butyl_Acrylate_Domestic_华东',
                butanol: 'Acrylic_Acid_Domestic_华东',
                acetic: 'n-Butanol_Domestic_华东',
                methanol: 'Propylene_Domestic_华东'
            },
            labels: {
                butyl: "Acrylate de Butyle (Cible)",
                butanol: "Acide Acrylique (Feedstock)",
                acetic: "n-Butanol (Feedstock)",
                methanol: "Propylène (Amont)"
            },
            defaultChecked: [
                'Butyl_Acrylate_Domestic_华东',
                'Acrylic_Acid_Domestic_华东',
                'n-Butanol_Domestic_华东',
                'Propylene_Domestic_华东'
            ]
        },
        'VAM_Domestic_华东': {
            title: "Monomère Acétate de Vinyle",
            precursors: {
                butyl: 'VAM_Domestic_华东',
                butanol: 'Ethylene_Domestic_华东',
                acetic: 'Acetic_Acid_Domestic_华南',
                methanol: 'Methanol_Domestic_山东中部'
            },
            labels: {
                butyl: "VAM (Cible)",
                butanol: "Éthylène (Feedstock)",
                acetic: "Acide Acétique (Feedstock)",
                methanol: "Méthanol (Amont)"
            },
            defaultChecked: [
                'VAM_Domestic_华东',
                'Ethylene_Domestic_华东',
                'Acetic_Acid_Domestic_华南',
                'Methanol_Domestic_山东中部',
                'Naphtha_Domestic_华东'
            ]
        },
        '2_EHA_Domestic_华东': {
            title: "Acrylate de 2-éthylhexyle",
            precursors: {
                butyl: '2_EHA_Domestic_华东',
                butanol: 'Acrylic_Acid_Domestic_华东',
                acetic: 'Octanol_Domestic_华东',
                methanol: 'Propylene_Domestic_华东'
            },
            labels: {
                butyl: "2-EHA (Cible)",
                butanol: "Acide Acrylique (Feedstock)",
                acetic: "2-Éthylhexanol (Feedstock)",
                methanol: "Propylène (Amont)"
            },
            defaultChecked: [
                '2_EHA_Domestic_华东',
                'Acrylic_Acid_Domestic_华东',
                'Octanol_Domestic_华东',
                'Propylene_Domestic_华东'
            ]
        },
        'Ethyl_Acrylate_Domestic_华东': {
            title: "Acrylate d'éthyle",
            precursors: {
                butyl: 'Ethyl_Acrylate_Domestic_华东',
                butanol: 'Acrylic_Acid_Domestic_华东',
                acetic: 'Ethanol_Domestic_山东',
                methanol: 'Propylene_Domestic_华东'
            },
            labels: {
                butyl: "Acrylate d'éthyle (Cible)",
                butanol: "Acide Acrylique (Feedstock)",
                acetic: "Éthanol (Feedstock)",
                methanol: "Propylène (Amont)"
            },
            defaultChecked: [
                'Ethyl_Acrylate_Domestic_华东',
                'Acrylic_Acid_Domestic_华东',
                'Ethanol_Domestic_山东',
                'Propylene_Domestic_华东'
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
    let currentTarget = 'Butyl_Acetate_Domestic_华东';
    let rawPricesData = [];      // Raw array of objects parsed from CSV
    let priceHeaders = [];       // Array of column names
    let alignedDates = [];       // Sorted array of Date objects
    let chartInstance = null;
    let selectedSeries = [];     // Column names selected for plot
    let timeRangeDays = "all";   // "all", 365, 180, 90
    let rawLeadLagData = [];     // Raw array of lead-lag results
    let KPI_COLUMNS = {};        // Dynamic columns mapping for KPIs
    
    // Pagination state
    let currentPage = 1;
    const rowsPerPage = 10;
    let filteredData = [];       // Data currently in table after search

    // ==========================================
    // INITIALIZATION & LOADING
    // ==========================================
    loadData();

    async function loadData() {
        try {
            // Load Prices CSV
            const pricesResponse = await fetch(PRICES_CSV_PATH);
            if (!pricesResponse.ok) throw new Error("Failed to load prices CSV.");
            const pricesText = await pricesResponse.text();
            
            // Parse Prices CSV
            Papa.parse(pricesText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: function(results) {
                    processPrices(results.data);
                }
            });

            // Load Lead-Lag CSV
            const leadLagResponse = await fetch(LEAD_LAG_CSV_PATH);
            if (leadLagResponse.ok) {
                const leadLagText = await leadLagResponse.text();
                Papa.parse(leadLagText, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true,
                    complete: function(results) {
                        rawLeadLagData = results.data;
                        displayLeadLag(rawLeadLagData);
                    }
                });
            } else {
                console.warn("Could not find lead-lag results file.");
                document.getElementById('lead-lag-list-container').innerHTML = 
                    `<div class="lead-lag-info"><p>Aucun résultat de lead-lag disponible.</p></div>`;
            }
            
        } catch (error) {
            console.error("Initialization Error:", error);
            showErrorState();
        }
    }

    // Helper function to resolve exact column or fallback to a similar one
    function resolveColumn(headers, pattern) {
        if (headers.includes(pattern)) return pattern;
        const matched = headers.find(h => h.includes(pattern));
        if (matched) return matched;
        const prod = pattern.split('_Domestic')[0].split('_Proxy')[0];
        const fallback = headers.find(h => h.includes(prod));
        return fallback || pattern;
    }

    // Update active KPI columns based on current target config
    function updateKPIColumns() {
        const config = TARGET_CONFIGS[currentTarget];
        KPI_COLUMNS = {
            butyl: resolveColumn(priceHeaders, config.precursors.butyl),
            butanol: resolveColumn(priceHeaders, config.precursors.butanol),
            acetic: resolveColumn(priceHeaders, config.precursors.acetic),
            methanol: resolveColumn(priceHeaders, config.precursors.methanol)
        };
    }

    // Helper to check if a column header is related to the current target
    function isColumnRelated(header, target) {
        if (target.includes('Butyl_Acetate')) {
            return header.includes('Butyl_Acetate') || 
                   header.includes('n-Butanol') || 
                   header.includes('Acetic_Acid') || 
                   header.includes('Methanol') || 
                   header.includes('Propylene');
        } else if (target.includes('Ethyl_Acetate')) {
            return header.includes('Ethyl_Acetate') || 
                   header.includes('Ethanol') || 
                   header.includes('Acetic_Acid') || 
                   header.includes('Ethylene') || 
                   header.includes('Methanol');
        } else if (target.includes('n_Propyl_Acetate') || target.includes('Isopropyl_Acetate')) {
            return header.includes('n_Propyl_Acetate') || 
                   header.includes('n-Propanol') || 
                   header.includes('Isopropanol') || 
                   header.includes('Acetic_Acid') || 
                   header.includes('Propylene') || 
                   header.includes('Methanol');
        } else if (target.includes('Acrylic_Acid')) {
            return header.includes('Acrylic_Acid') || 
                   header.includes('Propylene') || 
                   header.includes('Naphtha') || 
                   header.includes('Methanol');
        } else if (target.includes('Phthalic_Anhydride')) {
            return header.includes('Phthalic_Anhydride') || 
                   header.includes('o_Xylene') || 
                   header.includes('Reformed_Naphtha') || 
                   header.includes('Methanol');
        } else if (target.includes('Maleic_Anhydride')) {
            return header.includes('Maleic_Anhydride') || 
                   header.includes('n_Butane') || 
                   header.includes('Methanol');
        } else if (target.includes('MMA')) {
            return header.includes('MMA') || 
                   header.includes('Acetone') || 
                   header.includes('Propylene') || 
                   header.includes('Methanol');
        } else if (target.includes('Butyl_Acrylate')) {
            return header.includes('Butyl_Acrylate') || 
                   header.includes('Acrylic_Acid') || 
                   header.includes('n-Butanol') || 
                   header.includes('Propylene') || 
                   header.includes('Methanol');
        } else if (target.includes('VAM')) {
            return header.includes('VAM') || 
                   header.includes('Ethylene') || 
                   header.includes('Acetic_Acid') || 
                   header.includes('Naphtha') || 
                   header.includes('Ethanol') || 
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
        
        // Extract headers (exclude Date if it exists as a column value)
        priceHeaders = Object.keys(data[0]).filter(header => header !== 'Date');
        
        // Order data by Date ascending
        rawPricesData.sort((a, b) => new Date(a.Date) - new Date(b.Date));
        
        // Format dates
        alignedDates = rawPricesData.map(row => row.Date);
        filteredData = [...rawPricesData];

        // Resolve current target from dropdown select value if it exists
        const selectEl = document.getElementById('target-product-select');
        if (selectEl) {
            currentTarget = selectEl.value;
        }

        updateKPIColumns();

        // 1. Update Last Updated Meta info
        if (alignedDates.length > 0) {
            const lastDate = alignedDates[alignedDates.length - 1];
            document.getElementById('last-updated-date').textContent = lastDate;
        }

        // 2. Compute and Display KPIs
        updateKPIs();

        // 3. Create Series Checkbox Selectors
        createSeriesSelectors();

        // 4. Initialize Main Chart
        initializeChart();

        // 5. Populate Data Table
        renderTable();
        
        // Hide chart loader
        document.getElementById('chart-loader').style.display = 'none';
    }

    // ==========================================
    // KPI Badges Update
    // ==========================================
    function updateKPIs() {
        const totalRows = rawPricesData.length;
        if (totalRows === 0) return;

        const latestRow = rawPricesData[totalRows - 1];
        const previousRow = totalRows > 1 ? rawPricesData[totalRows - 2] : latestRow;

        Object.entries(KPI_COLUMNS).forEach(([key, colName]) => {
            const valEl = document.getElementById(`kpi-${key}-val`);
            const changeEl = document.getElementById(`kpi-${key}-change`);
            
            if (!valEl || !changeEl) return;

            if (latestRow[colName] !== undefined && latestRow[colName] !== null) {
                const currentVal = latestRow[colName];
                const prevVal = previousRow[colName] || currentVal;
                const absChange = currentVal - prevVal;
                const pctChange = prevVal !== 0 ? (absChange / prevVal) * 100 : 0;
                
                // Set value text
                valEl.textContent = `${Number(currentVal).toLocaleString('fr-FR', {minimumFractionDigits: 1, maximumFractionDigits: 1})} ¥/t`;
                
                // Format change indicator
                if (absChange > 0.05) {
                    changeEl.className = 'kpi-change up';
                    changeEl.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> +${pctChange.toFixed(2)}%`;
                } else if (absChange < -0.05) {
                    changeEl.className = 'kpi-change down';
                    changeEl.innerHTML = `<i class="fa-solid fa-arrow-trend-down"></i> ${pctChange.toFixed(2)}%`;
                } else {
                    changeEl.className = 'kpi-change neutral';
                    changeEl.innerHTML = `<i class="fa-solid fa-minus"></i> Stable`;
                }
            } else {
                valEl.textContent = "N/A";
                changeEl.className = 'kpi-change neutral';
                changeEl.textContent = "-";
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

        const config = TARGET_CONFIGS[currentTarget];
        const defaultMatches = config.defaultChecked.map(col => resolveColumn(priceHeaders, col));
        
        // Filter headers to only show ones related to the active target
        const relatedHeaders = priceHeaders.filter(h => isColumnRelated(h, currentTarget));

        // Sync selectedSeries
        selectedSeries = [...defaultMatches];

        relatedHeaders.forEach((header) => {
            const shouldBeChecked = defaultMatches.includes(header);

            const label = document.createElement('label');
            label.className = `check-tag ${shouldBeChecked ? 'active' : ''} ${header.includes(config.title.split(' ')[0]) ? 'accent' : ''}`;
            
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
                    text: 'Prix de Marché (¥/Tonne)',
                    style: {
                        color: '#94a3b8',
                        fontSize: '12px',
                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                    }
                },
                labels: {
                    formatter: function (val) {
                        return val ? val.toLocaleString('fr-FR') : '';
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
            
            // Assign specific theme colors for key columns to keep consistency
            if (col.includes('Butyl_Acetate') || col.includes('Ethyl_Acetate') || col.includes('n_Propyl_Acetate') || col.includes('Acrylic_Acid') || col.includes('Phthalic_Anhydride') || col.includes('Maleic_Anhydride') || col.includes('MMA') || col.includes('Butyl_Acrylate') || col.includes('VAM') || col.includes('2_EHA') || col.includes('Ethyl_Acrylate')) color = '#06b6d4';
            else if (col.includes('n-Butanol') || col.includes('Ethanol') || col.includes('Isopropanol') || col.includes('n-Propanol') || col.includes('o_Xylene') || col.includes('n_Butane') || col.includes('Acetone') || col.includes('Octanol')) color = '#6366f1';
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

        // Resolve current target column
        const targetCol = resolveColumn(priceHeaders, currentTarget);

        // Filter lead lag data for active target
        const filtered = data.filter(item => item.Target === targetCol || item.Target === currentTarget);

        if (filtered.length === 0) {
            container.innerHTML = `<div class="lead-lag-info"><p>Aucun résultat de lead-lag disponible pour cette cible.</p></div>`;
            return;
        }

        // Sort data by absolute Max_Correlation descending
        filtered.sort((a, b) => Math.abs(b.Max_Correlation) - Math.abs(a.Max_Correlation));

        filtered.forEach(item => {
            const featureName = item.Feature;
            const optLag = parseInt(item.Optimal_Lag_Days);
            const maxCorr = parseFloat(item.Max_Correlation);

            // Determine if Direct Feedstock or Upstream
            const isDirect = featureName.includes('n-Butanol') || featureName.includes('Ethanol') || featureName.includes('Isopropanol') || featureName.includes('Acetic_Acid');
            const tagClass = isDirect ? 'direct' : 'upstream';
            const tagLabel = isDirect ? 'Matière Directe' : 'Amont / Autre';

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
                        Corrélation max : <strong>${maxCorr >= 0 ? '+' : ''}${maxCorr.toFixed(3)}</strong>
                    </div>
                    <div class="metric-box">
                        Décalage opt. : <span class="lag-badge">${optLag} Jour${optLag > 1 ? 's' : ''}</span>
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
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary)">Aucun résultat trouvé</td></tr>`;
            document.getElementById('pagination-info-el').textContent = "Page 0 sur 0";
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
                        ? Number(val).toLocaleString('fr-FR', {minimumFractionDigits: 1, maximumFractionDigits: 1}) 
                        : '-';
                }
                tr.appendChild(td);
            });
            
            tableBody.appendChild(tr);
        });

        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        document.getElementById('pagination-info-el').textContent = `Page ${currentPage} sur ${totalPages} (${filteredData.length} jours)`;
        
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

    // Target Selector Event Listener
    const targetSelect = document.getElementById('target-product-select');
    if (targetSelect) {
        targetSelect.addEventListener('change', (e) => {
            currentTarget = e.target.value;
            handleTargetProductChange();
        });
    }

    function handleTargetProductChange() {
        const config = TARGET_CONFIGS[currentTarget];
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
            leadLagDesc.textContent = `Corrélations vs. ${config.title} (Cible)`;
        }

        // Reset selections
        selectedSeries = config.defaultChecked.map(col => resolveColumn(priceHeaders, col));

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
            <p>Erreur lors du chargement des fichiers CSV locaux.</p>
            <p style="font-size:12px; color: var(--text-secondary)">Vérifiez que vous utilisez un serveur HTTP (ex: live-server ou python -m http.server).</p>
        `;
    }
});
