// Global state
const state = {
    dataDirection: 'clickhouse-to-flatfile',
    clickhouseConnected: false,
    flatFileLoaded: false,
    selectedTable: '',
    selectedColumns: [],
    availableColumns: [],
    joinEnabled: false,
    additionalTables: [],
    previewData: null,
    clickhouseConfig: null
};

// Backend API URL - adjust this to match your backend location
const API_URL = 'http://localhost:3000/api';

// DOM ready event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize event listeners
    initEventListeners();
    updateUIBasedOnDirection();
});

// Initialize all event listeners
function initEventListeners() {
    // Data direction change handler
    document.getElementById('dataDirection').addEventListener('change', function() {
        state.dataDirection = this.value;
        updateUIBasedOnDirection();
    });

    // ClickHouse connection button
    document.getElementById('connectClickHouse').addEventListener('click', connectToClickHouse);

    // Load flat file button
    document.getElementById('loadFlatFile').addEventListener('click', loadFlatFileSchema);

    // Load table schema button
    document.getElementById('loadTableSchema').addEventListener('click', loadTableSchema);

    // Join checkbox handler
    document.getElementById('enable-join').addEventListener('change', function() {
        state.joinEnabled = this.checked;
        document.getElementById('join-container').classList.toggle('hidden', !this.checked);
    });

    // Add table button
    document.getElementById('add-table').addEventListener('click', addAdditionalTableRow);

    // Select/deselect all columns
    document.getElementById('select-all-columns').addEventListener('click', selectAllColumns);
    document.getElementById('deselect-all-columns').addEventListener('click', deselectAllColumns);

    // Preview data button
    document.getElementById('preview-data').addEventListener('click', previewData);

    // Start ingestion button
    document.getElementById('start-ingestion').addEventListener('click', startIngestion);
}

// Update UI based on selected data direction
function updateUIBasedOnDirection() {
    const direction = state.dataDirection;
    const isClickHouseSource = direction === 'clickhouse-to-flatfile';

    // Reset state
    resetUI();

    // Update source/target cards visibility
    document.getElementById('clickhouseSourceCard').classList.toggle('hidden', !isClickHouseSource);
    document.getElementById('flatFileCard').classList.toggle('hidden', isClickHouseSource);

    // Update target config sections visibility
    document.getElementById('clickhouseTargetConfig').classList.toggle('hidden', isClickHouseSource);
    document.getElementById('flatFileTargetConfig').classList.toggle('hidden', !isClickHouseSource);

    // Update target config title
    document.getElementById('targetConfigTitle').textContent =
        isClickHouseSource ? 'Flat File Target Configuration' : 'ClickHouse Target Configuration';

    // Hide tables selection for flat file source
    document.getElementById('tableSelectionCard').classList.add('hidden');
}

// Reset UI state
function resetUI() {
    state.clickhouseConnected = false;
    state.flatFileLoaded = false;
    state.selectedTable = '';
    state.selectedColumns = [];
    state.availableColumns = [];
    state.previewData = null;

    // Hide cards that depend on connection/selection
    document.getElementById('tableSelectionCard').classList.add('hidden');
    document.getElementById('columnSelectionCard').classList.add('hidden');
    document.getElementById('targetConfigCard').classList.add('hidden');
    document.getElementById('previewCard').classList.add('hidden');
    document.getElementById('ingestionCard').classList.add('hidden');

    // Clear status and result areas
    document.getElementById('status-area').classList.add('hidden');
    document.getElementById('result-area').classList.add('hidden');

    // Reset progress bar
    document.getElementById('progress-container').classList.add('hidden');
    document.getElementById('progress-bar').style.width = '0%';
    document.getElementById('progress-bar').textContent = '0%';
}

// Show status message
function showStatus(message, type = 'info') {
    const statusArea = document.getElementById('status-area');
    statusArea.textContent = message;
    statusArea.className = `alert alert-${type}`;
    statusArea.classList.remove('hidden');
}

// Connect to ClickHouse function
async function connectToClickHouse() {
    const host = document.getElementById('ch-host').value;
    const port = document.getElementById('ch-port').value;
    const database = document.getElementById('ch-database').value;
    const user = document.getElementById('ch-user').value;
    const jwt = document.getElementById('ch-jwt').value;

    if (!host || !port || !database) {
        showStatus('Please fill in the required connection details.', 'danger');
        return;
    }

    // Show status
    showStatus('Connecting to ClickHouse...', 'info');

    try {
        // Store connection details for future calls
        state.clickhouseConfig = { host, port, database, user, jwt };

        // For frontend demo (if backend isn't ready yet)
        // You would replace this with actual API call when backend is ready
        await simulateBackendCall(1000);

        state.clickhouseConnected = true;
        showStatus('Connected to ClickHouse successfully!', 'success');

        // Show table selection card
        document.getElementById('tableSelectionCard').classList.remove('hidden');

        // Populate table dropdown (simulated for now)
        const tableSelect = document.getElementById('table-select');
        tableSelect.innerHTML = '<option value="">-- Select a table --</option>';

        // Sample tables - would be replaced with real API response
        const sampleTables = ['uk_price_paid', 'ontime', 'system.numbers', 'system.tables'];
        sampleTables.forEach(table => {
            const option = document.createElement('option');
            option.value = table;
            option.textContent = table;
            tableSelect.appendChild(option);
        });

        /* Uncomment when backend API is ready
        const response = await fetch(`${API_URL}/connect-clickhouse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host, port, database, user, jwt })
        });

        const data = await response.json();
        if (data.success) {
            state.clickhouseConnected = true;
            showStatus('Connected to ClickHouse successfully!', 'success');

            // Show table selection card
            document.getElementById('tableSelectionCard').classList.remove('hidden');

            // Populate table dropdown
            const tableSelect = document.getElementById('table-select');
            tableSelect.innerHTML = '<option value="">-- Select a table --</option>';

            data.tables.forEach(table => {
                const option = document.createElement('option');
                option.value = table.name;
                option.textContent = table.name;
                tableSelect.appendChild(option);
            });
        } else {
            showStatus(`Failed to connect: ${data.error}`, 'danger');
        }
        */
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'danger');
    }
}

// Load flat file schema
function loadFlatFileSchema() {
    const fileInput = document.getElementById('file-input');
    const delimiter = document.getElementById('delimiter').value;
    const hasHeader = document.getElementById('has-header').checked;

    if (!fileInput.files || fileInput.files.length === 0) {
        showStatus('Please select a file first.', 'danger');
        return;
    }

    const file = fileInput.files[0];
    showStatus(`Loading schema from file: ${file.name}...`, 'info');

    // Use FileReader to actually read the file
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;

        // Parse CSV content
        const lines = content.split('\n');
        if (lines.length === 0) {
            showStatus('File appears to be empty.', 'danger');
            return;
        }

        // Extract header row or generate column names
        let headers;
        if (hasHeader) {
            // Use first line as headers
            headers = lines[0].split(delimiter).map(header => header.trim());
        } else {
            // Generate column names (Col1, Col2, etc.)
            const firstRow = lines[0].split(delimiter);
            headers = Array.from({length: firstRow.length}, (_, i) => `Column${i+1}`);
        }

        // Store in state
        state.availableColumns = headers;
        state.flatFileLoaded = true;

        // Generate sample data for preview
        state.previewData = [];
        const previewRowCount = Math.min(5, lines.length - (hasHeader ? 1 : 0));
        const startRow = hasHeader ? 1 : 0;

        for (let i = 0; i < previewRowCount; i++) {
            if (startRow + i < lines.length) {
                const row = {};
                const values = lines[startRow + i].split(delimiter);
                headers.forEach((header, index) => {
                    row[header] = index < values.length ? values[index] : '';
                });
                state.previewData.push(row);
            }
        }

        showStatus('File schema loaded successfully!', 'success');

        // Update UI
        populateColumnSelection(headers);
        document.getElementById('columnSelectionCard').classList.remove('hidden');
        document.getElementById('targetConfigCard').classList.remove('hidden');
        document.getElementById('previewCard').classList.remove('hidden');
        document.getElementById('ingestionCard').classList.remove('hidden');
    };

    reader.onerror = function() {
        showStatus('Error reading file.', 'danger');
    };

    // Start reading the file
    reader.readAsText(file);
}

// Load table schema
async function loadTableSchema() {
    const selectedTable = document.getElementById('table-select').value;

    if (!selectedTable) {
        showStatus('Please select a table first.', 'danger');
        return;
    }

    state.selectedTable = selectedTable;
    showStatus(`Loading schema from table: ${selectedTable}...`, 'info');

    try {
        // For frontend demo (if backend isn't ready yet)
        await simulateBackendCall(1000);

        // Sample columns based on selected table - replace with actual API data
        let columns = [];
        if (selectedTable === 'uk_price_paid') {
            columns = ['price', 'date_of_transfer', 'postcode', 'property_type', 'old_new', 'duration', 'town_city', 'district', 'county'];
        } else if (selectedTable === 'ontime') {
            columns = ['Year', 'Month', 'DayofMonth', 'FlightDate', 'Reporting_Airline', 'DOT_ID_Reporting_Airline', 'IATA_CODE_Reporting_Airline', 'Tail_Number', 'Flight_Number_Reporting_Airline'];
        } else {
            columns = ['id', 'name', 'created_at', 'updated_at', 'value', 'status'];
        }

        state.availableColumns = columns;
        showStatus('Table schema loaded successfully!', 'success');

        /* Uncomment when backend API is ready
        const config = state.clickhouseConfig;
        const response = await fetch(`${API_URL}/table-schema?host=${config.host}&port=${config.port}&database=${config.database}&user=${config.user}&jwt=${config.jwt}&table=${selectedTable}`);

        const data = await response.json();
        if (data.success) {
            // Extract column names from schema
            const columns = data.columns.map(col => col.name);
            state.availableColumns = columns;
            showStatus('Table schema loaded successfully!', 'success');
        } else {
            showStatus(`Failed to load schema: ${data.error}`, 'danger');
            return;
        }
        */

        // Show column selection
        populateColumnSelection(state.availableColumns);
        document.getElementById('columnSelectionCard').classList.remove('hidden');

        // Show target config
        document.getElementById('targetConfigCard').classList.remove('hidden');

        // Show preview card
        document.getElementById('previewCard').classList.remove('hidden');

        // Show ingestion card
        document.getElementById('ingestionCard').classList.remove('hidden');
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'danger');
    }
}

// Populate column selection checkboxes
function populateColumnSelection(columns) {
    const container = document.getElementById('column-checkboxes');
    container.innerHTML = '';

    columns.forEach(column => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `col-${column}`;
        checkbox.value = column;
        checkbox.checked = true; // Default all to checked
        checkbox.addEventListener('change', updateSelectedColumns);

        const label = document.createElement('label');
        label.htmlFor = `col-${column}`;
        label.textContent = column;

        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    });

    // Initialize selected columns
    updateSelectedColumns();
}

// Update selected columns based on checkboxes
function updateSelectedColumns() {
    const checkboxes = document.querySelectorAll('#column-checkboxes input[type="checkbox"]');
    state.selectedColumns = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
}

// Select all columns
function selectAllColumns() {
    const checkboxes = document.querySelectorAll('#column-checkboxes input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
    updateSelectedColumns();
}

// Deselect all columns
function deselectAllColumns() {
    const checkboxes = document.querySelectorAll('#column-checkboxes input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    updateSelectedColumns();
}

// Add additional table row for JOIN feature
function addAdditionalTableRow() {
    const container = document.getElementById('additional-tables');
    const tableIndex = state.additionalTables.length + 1;

    const tableRow = document.createElement('div');
    tableRow.className = 'form-group';
    tableRow.innerHTML = `
        <label for="join-table-${tableIndex}">Table ${tableIndex + 1}:</label>
        <select id="join-table-${tableIndex}" class="join-input">
            <option value="">-- Select a table --</option>
        </select>
        <label for="join-type-${tableIndex}">Join Type:</label>
        <select id="join-type-${tableIndex}" class="join-input">
            <option value="INNER">INNER JOIN</option>
            <option value="LEFT">LEFT JOIN</option>
            <option value="RIGHT">RIGHT JOIN</option>
            <option value="FULL">FULL JOIN</option>
        </select>
        <button class="btn btn-danger remove-table" data-index="${tableIndex}">Remove</button>
    `;

    container.appendChild(tableRow);

    // Add event listener for remove button
    const removeButton = tableRow.querySelector('.remove-table');
    removeButton.addEventListener('click', function() {
        container.removeChild(tableRow);
        state.additionalTables = state.additionalTables.filter(t => t.index !== tableIndex);
    });

    // Populate table dropdown
    const tableSelect = tableRow.querySelector(`#join-table-${tableIndex}`);
    const sampleTables = ['uk_price_paid', 'ontime', 'system.numbers', 'system.tables'];
    sampleTables.forEach(table => {
        const option = document.createElement('option');
        option.value = table;
        option.textContent = table;
        tableSelect.appendChild(option);
    });

    // Add to state
    state.additionalTables.push({ index: tableIndex, table: '', joinType: 'INNER', condition: '' });

    // Add event listener for table selection
    tableSelect.addEventListener('change', function() {
        const tableObj = state.additionalTables.find(t => t.index === tableIndex);
        if (tableObj) {
            tableObj.table = this.value;
        }
    });

    // Add event listener for join type selection
    const joinTypeSelect = tableRow.querySelector(`#join-type-${tableIndex}`);
    joinTypeSelect.addEventListener('change', function() {
        const tableObj = state.additionalTables.find(t => t.index === tableIndex);
        if (tableObj) {
            tableObj.joinType = this.value;
        }
    });

    // Add event listener for join condition
    const joinConditionInput = document.getElementById('join-condition');
    joinConditionInput.addEventListener('change', function() {
        if (state.additionalTables.length > 0) {
            state.additionalTables.forEach(table => {
                table.condition = this.value;
            });
        }
    });
}

// Preview data
async function previewData() {
    const columns = state.selectedColumns;
    if (columns.length === 0) {
        showStatus('Please select at least one column to preview.', 'danger');
        return;
    }

    showStatus('Loading data preview...', 'info');

    try {
        if (state.dataDirection === 'clickhouse-to-flatfile') {
            // For frontend demo (if backend isn't ready yet)
            await simulateBackendCall(1000);

            // Generate sample preview data
            generateSamplePreviewData(columns);

            /* Uncomment when backend API is ready
            const config = state.clickhouseConfig;
            const joinConfig = {
                enabled: state.joinEnabled,
                tables: state.additionalTables
            };

            const response = await fetch(`${API_URL}/preview-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'clickhouse',
                    host: config.host,
                    port: config.port,
                    database: config.database,
                    user: config.user,
                    jwt: config.jwt,
                    table: state.selectedTable,
                    columns: columns,
                    joinConfig: joinConfig
                })
            });

            const data = await response.json();
            if (data.success) {
                state.previewData = data.data;
            } else {
                showStatus(`Failed to load preview: ${data.error}`, 'danger');
                return;
            }
            */
        } else {
            // Flat file preview (already loaded in state.previewData)
            // We just need to filter to the selected columns
            if (!state.previewData || state.previewData.length === 0) {
                generateSamplePreviewData(columns);
            }
        }

        // Render the preview table
        renderPreviewTable(columns, state.previewData);
        showStatus('Preview data loaded successfully!', 'success');
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'danger');
    }
}

// Helper function to generate sample preview data
function generateSamplePreviewData(columns) {
    const previewData = [];
    for (let i = 0; i < 5; i++) {
        const row = {};
        columns.forEach(col => {
            if (col.toLowerCase().includes('date') || col.toLowerCase().includes('time')) {
                row[col] = '2023-09-15';
            } else if (col.toLowerCase().includes('price') || col.toLowerCase().includes('amount')) {
                row[col] = (Math.random() * 1000).toFixed(2);
            } else if (col.toLowerCase().includes('id') || /^\d+$/.test(col)) {
                row[col] = Math.floor(Math.random() * 10000);
            } else {
                row[col] = `Sample ${col} ${i+1}`;
            }
        });
        previewData.push(row);
    }
    state.previewData = previewData;
}

// Helper function to render preview table
function renderPreviewTable(columns, data) {
    const headerRow = document.getElementById('preview-headers');
    const tableBody = document.getElementById('preview-body');

    // Clear previous content
    headerRow.innerHTML = '';
    tableBody.innerHTML = '';

    // Add headers
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    });

    // Add data rows
    data.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col] !== undefined ? row[col] : '';
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

// Start ingestion process
async function startIngestion() {
    // Validate selections
    if (state.selectedColumns.length === 0) {
        showStatus('Please select at least one column to ingest.', 'danger');
        return;
    }

    // Show progress container
    document.getElementById('progress-container').classList.remove('hidden');
    showStatus('Starting data ingestion process...', 'info');

    try {
        // For frontend demo (if backend isn't ready yet)
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            updateProgress(progress);

            if (progress >= 100) {
                clearInterval(interval);
                const recordCount = Math.floor(Math.random() * 10000) + 1000;
                completeIngestion(recordCount);
            }
        }, 200);

        /* Uncomment when backend API is ready
        if (state.dataDirection === 'flatfile-to-clickhouse') {
            // File to ClickHouse
            const formData = new FormData();
            formData.append('file', document.getElementById('file-input').files[0]);
            formData.append('direction', state.dataDirection);
            formData.append('columns', JSON.stringify(state.selectedColumns));

            // Add ClickHouse config
            const clickhouseConfig = {
                host: document.getElementById('ch-host').value,
                port: document.getElementById('ch-port').value,
                database: document.getElementById('ch-database').value,
                user: document.getElementById('ch-user').value,
                jwt: document.getElementById('ch-jwt').value,
                targetTable: document.getElementById('target-table-name').value,
                createTable: document.getElementById('create-table').checked
            };
            formData.append('clickhouseConfig', JSON.stringify(clickhouseConfig));

            // Add flat file config
            const flatFileConfig = {
                delimiter: document.getElementById('delimiter').value,
                hasHeader: document.getElementById('has-header').checked
            };
            formData.append('flatFileConfig', JSON.stringify(flatFileConfig));

            // Monitor progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 5;
                if (progress > 95) clearInterval(progressInterval);
                updateProgress(progress);
            }, 200);

            const response = await fetch(`${API_URL}/ingest`, {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);
            updateProgress(100);

            const data = await response.json();
            if (data.success) {
                completeIngestion(data.recordCount);
            } else {
                showStatus(`Ingestion failed: ${data.error}`, 'danger');
            }
        } else {
            // ClickHouse to file
            const clickhouseConfig = {
                host: document.getElementById('ch-host').value,
                port: document.getElementById('ch-port').value,
                database: document.getElementById('ch-database').value,
                user: document.getElementById('ch-user').value,
                jwt: document.getElementById('ch-jwt').value,
                sourceTable: state.selectedTable,
                joinConfig: {
                    enabled: state.joinEnabled,
                    tables: state.additionalTables,
                    condition: document.getElementById('join-condition').value
                }
            };

            const flatFileConfig = {
                outputFilename: document.getElementById('output-filename').value,
                delimiter: document.getElementById('output-delimiter').value,
                includeHeader: document.getElementById('include-header').checked
            };

            // Monitor progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 5;
                if (progress > 95) clearInterval(progressInterval);
                updateProgress(progress);
            }, 200);

            const response = await fetch(`${API_URL}/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    direction: state.dataDirection,
                    clickhouseConfig: clickhouseConfig,
                    flatFileConfig: flatFileConfig,
                    columns: state.selectedColumns
                })
            });

            clearInterval(progressInterval);
            updateProgress(100);

            const data = await response.json();
            if (data.success) {
                completeIngestion(data.recordCount);
            } else {
                showStatus(`Ingestion failed: ${data.error}`, 'danger');
            }
        }
        */
    } catch (error) {
        updateProgress(0);
        showStatus(`Error: ${error.message}`, 'danger');
    }
}

// Update progress bar
function updateProgress(percent) {
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = `${percent}%`;
    progressBar.textContent = `${percent}%`;
}

// Complete ingestion process
function completeIngestion(recordCount) {
    showStatus('Data ingestion completed successfully!', 'success');

    // Show result with record count
    const resultArea = document.getElementById('result-area');
    resultArea.textContent = `Total records processed: ${recordCount || 0}`;
    resultArea.classList.remove('hidden');
    resultArea.classList.add('visible');
}

// Helper function to simulate backend calls (for frontend demo)
function simulateBackendCall(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
}