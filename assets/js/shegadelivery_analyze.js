// Generic Analyze JS

let fullResponseData = [];
let chartInstances = {};

document.addEventListener('DOMContentLoaded', () => {
    // File Upload Handler
    const fileInput = document.getElementById('response-file');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadSection = document.getElementById('upload-section');
    const analysisSection = document.getElementById('analysis-section');

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const reader = new FileReader();

                reader.onload = function (e) {
                    try {
                        const json = JSON.parse(e.target.result);

                        // Handle different JSON structures
                        if (Array.isArray(json)) {
                            fullResponseData = json;
                        } else if (json.responses && Array.isArray(json.responses)) {
                            fullResponseData = json.responses;
                            // Display Session Info
                            if (json.info) displaySessionInfo(json.info);
                        } else {
                            throw new Error('Invalid JSON format');
                        }

                        if (fullResponseData.length === 0) {
                            alert('No test responses found in the file.');
                            return;
                        }

                        // Transition UI
                        uploadSection.classList.add('hidden');
                        analysisSection.classList.remove('hidden');

                        // Run Analysis
                        displayAnalysis(fullResponseData);

                    } catch (err) {
                        console.error(err);
                        alert('Error parsing JSON file. Please ensure it is a valid test report.');
                    }
                };

                reader.readAsText(file);
            } else {
                alert('Please select a file first.');
            }
        });
    }

    // Tab Filters
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update Active State
            tabs.forEach(t => {
                t.classList.remove('bg-white', 'shadow-sm', 'text-indigo-600');
                t.classList.add('text-gray-600');
            });
            tab.classList.add('bg-white', 'shadow-sm', 'text-indigo-600');
            tab.classList.remove('text-gray-600');

            // Filter Data
            const status = tab.dataset.status;
            filterResponses(status);
        });
    });
});

function displaySessionInfo(info) {
    const infoContainer = document.getElementById('tester-info');
    const infoList = document.getElementById('tester-info-list');

    if (infoContainer && infoList) {
        infoContainer.classList.remove('hidden');
        infoList.innerHTML = `
            <li><strong>Tester:</strong> ${info.tester_name || 'N/A'}</li>
            <li><strong>Date:</strong> ${new Date(info.date).toLocaleString()}</li>
            <li><strong>App Section:</strong> ${info.app_section || 'Unknown'}</li>
        `;
    }
}

function displayAnalysis(data) {
    const validData = data.filter(item => item && item.status);

    // Calculate Stats
    const totalCount = validData.length;
    const passedCount = validData.filter(item => item.status.toLowerCase() === 'pass').length;
    const failedCount = validData.filter(item => item.status.toLowerCase() === 'fail').length;
    const blockedCount = validData.filter(item => item.status.toLowerCase() === 'blocked').length;

    // Update UI Counters
    setText('total-count', totalCount);
    setText('passed-count', passedCount);
    setText('failed-count', failedCount);
    setText('blocked-count', blockedCount);

    // Render Charts
    renderStatusChart(passedCount, failedCount, blockedCount);
    renderCategoryChart(validData);

    // Render Response List (All by default)
    renderResponseList(validData);
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// -------------------------------------------------------------------------
// Chart.js Implementations
// -------------------------------------------------------------------------

function renderStatusChart(passed, failed, blocked) {
    const ctx = document.getElementById('status-chart');
    if (!ctx) return;

    if (chartInstances.status) chartInstances.status.destroy();

    chartInstances.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Failed', 'Blocked'],
            datasets: [{
                data: [passed, failed, blocked],
                backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function renderCategoryChart(data) {
    const ctx = document.getElementById('category-chart');
    if (!ctx) return;

    // Group by Feature
    const groups = {};
    data.forEach(item => {
        const feature = item.feature || 'Other';
        if (!groups[feature]) groups[feature] = { pass: 0, fail: 0, blocked: 0 };

        const status = item.status.toLowerCase();
        if (status === 'pass') groups[feature].pass++;
        else if (status === 'fail') groups[feature].fail++;
        else if (status === 'blocked') groups[feature].blocked++;
    });

    const labels = Object.keys(groups);
    const passData = labels.map(l => groups[l].pass);
    const failData = labels.map(l => groups[l].fail);
    const blockedData = labels.map(l => groups[l].blocked);

    if (chartInstances.category) chartInstances.category.destroy();

    chartInstances.category = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Passed', data: passData, backgroundColor: '#10B981' },
                { label: 'Failed', data: failData, backgroundColor: '#EF4444' },
                { label: 'Blocked', data: blockedData, backgroundColor: '#F59E0B' }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        }
    });
}

// -------------------------------------------------------------------------
// Response List Renderer
// -------------------------------------------------------------------------

function filterResponses(status) {
    const data = fullResponseData.filter(item => item && item.status);
    if (status === 'all') {
        renderResponseList(data);
    } else {
        const filtered = data.filter(item => item.status.toLowerCase() === status);
        renderResponseList(filtered);
    }
}

function renderResponseList(data) {
    const container = document.getElementById('response-list');
    if (!container) return;

    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-gray-500">No results found for this filter.</div>';
        return;
    }

    data.forEach(item => {
        const statusColor = getStatusColor(item.status);
        const div = document.createElement('div');
        div.className = 'p-4 hover:bg-gray-50 transition-colors cursor-pointer group';

        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">${item.id}</span>
                        <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">${item.feature || 'General'}</span>
                    </div>
                    <h3 class="font-medium text-gray-900">${item.scenario}</h3>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColor}">${item.status}</span>
            </div>
            
            <!-- Detail Panel (Hidden Default) -->
            <div class="hidden mt-4 pt-4 border-t border-gray-100 text-sm space-y-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <span class="block text-xs font-bold text-gray-400 uppercase">Comment</span>
                        <p class="text-gray-700 mt-1">${item.comment || '<span class="text-gray-400 italic">No comments</span>'}</p>
                    </div>
                     <div>
                        <span class="block text-xs font-bold text-gray-400 uppercase">Expected Result</span>
                        <p class="text-gray-700 mt-1">${item.expected_result || 'N/A'}</p>
                    </div>
                </div>
            </div>
        `;

        // Toggle Logic
        div.addEventListener('click', () => {
            const detail = div.querySelector('div.hidden');
            if (detail) detail.classList.toggle('hidden');
        });

        container.appendChild(div);
    });
}

function getStatusColor(status) {
    switch (status.toLowerCase()) {
        case 'pass': return 'bg-green-100 text-green-800';
        case 'fail': return 'bg-red-100 text-red-800';
        case 'blocked': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
