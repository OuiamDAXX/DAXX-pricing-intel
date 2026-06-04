/* ==========================================================================
   OILCHEM DASHBOARD APPLICATION LOGIC (VANILLA JS)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // API data paths
    const PRICES_CSV_PATH = "oilchem_aligned_prices.csv";
    const LEAD_LAG_CSV_PATH = "oilchem_lead_lag_results.csv";

    // Application state
    let rawPricesData = [];      // Raw array of objects parsed from CSV
    let priceHeaders = [];       // Array of column names
    let alignedDates = [];       // Sorted array of Date objects
    let chartInstance = null;
    let selectedSeries = [];     // Column names selected for plot
    let timeRangeDays = "all";   // "all", 365, 180, 90
    
    // Pagination state
    let currentPage = 1;
    const rowsPerPage = 10;
    let filteredData = [];       // Data currently in table after search

    // Define target and key benchmark columns for KPIs
    const KPI_COLUMNS = {
        butyl: 'Butyl_Acetate_Domestic_华东',
        butanol: 'n-Butanol_Domestic_华东',
        acetic: 'Acetic_Acid_Domestic_华南',
        methanol: 'Methanol_Domestic_山东中部'
    };

    // Color palette for chart series (matching glassmorphism design)
    const CHART_COLORS = [
        '#06b6d4', // Electric Cyan (Target)
        '#6366f1', // Indigo (n-Butanol)
        '#10b981', // Emerald (Acetic Acid)
        '#f59e0b', // Amber (Methanol)
        '#f43f5e', // Rose (Propylene)
        '#a855f7', // Purple
        '#ec4899', // Pink
        '#84cc16'  // Lime
    ];

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
                        displayLeadLag(results.data);
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
            
            // Check if column exists in the dataset
            const actualCol = priceHeaders.find(h => h.includes(colName)) || colName;
            
            if (latestRow[actualCol] !== undefined && latestRow[actualCol] !== null) {
                const currentVal = latestRow[actualCol];
                const prevVal = previousRow[actualCol] || currentVal;
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
        container.innerHTML = "";

        // Default columns to check
        const defaultMatches = [
            'Butyl_Acetate_Domestic_华东',
            'n-Butanol_Domestic_华东',
            'Acetic_Acid_Domestic_华南',
            'Methanol_Domestic_山东中部'
        ];

        priceHeaders.forEach((header, index) => {
            // Check if this matches any defaults
            const shouldBeChecked = defaultMatches.some(match => header.includes(match));
            if (shouldBeChecked) {
                selectedSeries.push(header);
            }

            const label = document.createElement('label');
            label.className = `check-tag ${shouldBeChecked ? 'active' : ''} ${header.includes('Butyl') ? 'accent' : ''}`;
            
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
            
            // Clean up the name of the column for nice UI display (remove prefixes/suffixes if repetitive)
            let displayName = header
                .replace('_Domestic', '')
                .replace('_', ' ')
                .replace('_', ' ');
            
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
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true
                    }
                },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800,
                    animateGradually: {
                        enabled: true,
                        delay: 150
                    },
                    dynamicAnimation: {
                        enabled: true,
                        speed: 350
                    }
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
                },
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
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
                },
                style: {
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'left',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                markers: {
                    radius: 12
                }
            }
        };

        chartInstance = new ApexCharts(document.querySelector("#main-chart"), options);
        chartInstance.render();
    }

    function getChartSeries() {
        let slicedData = rawPricesData;
        
        // Slice time range if selected
        if (timeRangeDays !== "all") {
            const cutoffDays = parseInt(timeRangeDays);
            slicedData = rawPricesData.slice(-cutoffDays);
        }

        return selectedSeries.map(col => {
            return {
                name: col.replace('_Domestic', '').replace(/_/g, ' '),
                data: slicedData.map(row => {
                    return {
                        x: new Date(row.Date).getTime(),
                        y: row[col]
                    };
                })
            };
        });
    }

    function updateChartData() {
        if (!chartInstance) return;
        
        // Extract sliced dates for categories
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
        container.innerHTML = "";

        // Sort data by absolute Max_Correlation descending
        data.sort((a, b) => Math.abs(b.Max_Correlation) - Math.abs(a.Max_Correlation));

        data.forEach(item => {
            const featureName = item.Feature;
            const optLag = parseInt(item.Optimal_Lag_Days);
            const maxCorr = parseFloat(item.Max_Correlation);
            const corr0 = parseFloat(item.Corr_at_Lag_0);

            // Determine if Direct Feedstock (n-Butanol, Acetic Acid) or Upstream (Methanol, Propylene)
            const isDirect = featureName.includes('n-Butanol') || featureName.includes('Acetic_Acid');
            const tagClass = isDirect ? 'direct' : 'upstream';
            const tagLabel = isDirect ? 'Matière Directe' : 'Amont / Autre';

            const itemDiv = document.createElement('div');
            itemDiv.className = 'lead-lag-item';

            // Correlation percentage absolute value
            const absPercent = Math.min(100, Math.round(Math.abs(maxCorr) * 100));
            // Color of correlation bar
            const barColor = maxCorr >= 0 ? 'var(--color-cyan)' : 'var(--color-rose)';

            // Clean UI name
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

            // Trigger animation of progress bars after a slight delay
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
        
        tableHeaders.innerHTML = "";
        tableBody.innerHTML = "";

        if (filteredData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary)">Aucun résultat trouvé</td></tr>`;
            document.getElementById('pagination-info-el').textContent = "Page 0 sur 0";
            return;
        }

        // 1. Column headers: Date, then the first 4 main columns to avoid horizontal overflow
        const displayHeaders = ['Date', ...selectedSeries.slice(0, 4)];
        
        displayHeaders.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.replace('_Domestic', '').replace(/_/g, ' ');
            tableHeaders.appendChild(th);
        });

        // 2. Paginated rows
        const startIdx = (currentPage - 1) * rowsPerPage;
        const endIdx = Math.min(startIdx + rowsPerPage, filteredData.length);
        
        // Reverse array to show latest dates first in table
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

        // 3. Update pagination indicators
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        document.getElementById('pagination-info-el').textContent = `Page ${currentPage} sur ${totalPages} (${filteredData.length} jours)`;
        
        // Enable/Disable buttons
        document.getElementById('btn-prev').disabled = (currentPage === 1);
        document.getElementById('btn-next').disabled = (currentPage >= totalPages || totalPages === 0);
    }

    // ==========================================
    // INTERACTION HANDLERS (SEARCH, EXPORT, TIME SELECT)
    // ==========================================
    
    // Time range buttons click
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
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        
        filteredData = rawPricesData.filter(row => {
            return row.Date.toLowerCase().includes(query);
        });
        
        currentPage = 1;
        renderTable();
    });

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
        
        // Generate PapaParse CSV string
        const csvString = Papa.unparse(rawPricesData);
        
        // Create downloadable blob
        const blob = new Blob(["\ufeff" + csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "oilchem_china_prices_aligned.csv");
        document.body.appendChild(link);
        
        link.click();
        document.body.removeChild(link);
    });

    // Error UI view if load fails
    function showErrorState() {
        document.getElementById('chart-loader').innerHTML = `
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 40px; color: var(--color-rose)"></i>
            <p>Erreur lors du chargement des fichiers CSV locaux.</p>
            <p style="font-size:12px; color: var(--text-secondary)">Vérifiez que vous utilisez un serveur HTTP (ex: live-server ou python -m http.server).</p>
        `;
    }
});
