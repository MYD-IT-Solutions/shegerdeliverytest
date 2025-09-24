document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('upload-btn');
    const responseFileInput = document.getElementById('response-file');
    const analysisSection = document.getElementById('analysis-section');
    const uploadSection = document.getElementById('upload-section');
    const responseTabs = document.getElementById('response-tabs');

    let statusChartInstance = null;
    let categoryChartInstance = null;
    let fullResponseData = [];
    let allTestCases = {};

    // Load all school testcases for detail lookup
    fetch('assets/data/schooltest.json')
        .then(response => response.json())
        .then(data => {
            function walk(node) {
                if (!node) return;
                if (Array.isArray(node)) {
                    node.forEach(tc => { if (tc && tc.id) allTestCases[tc.id] = tc; });
                    return;
                }
                if (typeof node === 'object') {
                    Object.values(node).forEach(walk);
                }
            }
            walk(data);
        }).catch(err => console.error('Error loading manual_testcase.json:', err));

    uploadBtn.addEventListener('click', () => {
        const files = responseFileInput.files;
        if (files.length === 0) {
            alert('Please select one or more JSON files to upload.');
            return;
        }

        const allResults = [];
        const testerInfos = new Set();
        let filesProcessed = 0;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const jsonData = JSON.parse(event.target.result);
                    if (jsonData && jsonData.results && Array.isArray(jsonData.results)) {
                        const resultsWithTester = jsonData.results.map(r => ({
                            ...r,
                            testerName: jsonData.testerName || 'N/A',
                            testDate: jsonData.testDate || 'N/A'
                        }));
                        allResults.push(...resultsWithTester);
                        testerInfos.add(`Tester: ${jsonData.testerName || 'N/A'} on ${jsonData.testDate || 'N/A'}`);
                    }
                } catch (error) {
                    console.error(`Error parsing ${file.name}:`, error);
                    alert(`Could not parse ${file.name}. It may be an invalid JSON file.`);
                }

                filesProcessed++;
                if (filesProcessed === files.length) {
                    if (allResults.length > 0) {
                        document.getElementById('tester-info-list').innerHTML = [...testerInfos].map(info => `<li>${info}</li>`).join('');
                        document.getElementById('tester-info').classList.remove('hidden');

                        displayAnalysis(allResults);
                        uploadSection.classList.add('hidden');
                        analysisSection.classList.remove('hidden');
                    } else {
                        alert('No valid test results found in the selected files.');
                    }
                }
            };
            reader.onerror = (error) => {
                console.error(`Error reading file ${file.name}:`, error);
                alert(`An error occurred while reading ${file.name}.`);
                filesProcessed++;
                if (filesProcessed === files.length && allResults.length > 0) {
                    displayAnalysis(allResults);
                }
            };
            reader.readAsText(file);
        });
    });

    responseTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            const status = e.target.getAttribute('data-status');
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('border-indigo-500', 'text-indigo-600');
                btn.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            });
            e.target.classList.add('border-indigo-500', 'text-indigo-600');
            e.target.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');

            let filteredData = fullResponseData;
            if (status === 'pass') filteredData = fullResponseData.filter(item => (item.status || '').toLowerCase() === 'pass');
            else if (status === 'fail') filteredData = fullResponseData.filter(item => (item.status || '').toLowerCase() === 'fail');
            else if (status === 'blocked') filteredData = fullResponseData.filter(item => (item.status || '').toLowerCase() === 'blocked');
            renderResponseList(filteredData);
        }
    });

    function displayAnalysis(data) {
        const validData = data.filter(item => item && item.status);
        fullResponseData = validData;

        const totalCount = validData.length;
        const passedCount = validData.filter(item => item.status.toLowerCase() === 'pass').length;
        const failedCount = validData.filter(item => item.status.toLowerCase() === 'fail').length;
        const blockedCount = validData.filter(item => item.status.toLowerCase() === 'blocked').length;

        document.getElementById('total-count').textContent = totalCount;
        document.getElementById('passed-count').textContent = passedCount;
        document.getElementById('failed-count').textContent = failedCount;
        document.getElementById('blocked-count').textContent = blockedCount;

        renderStatusChart(passedCount, failedCount, blockedCount);
        renderCategoryChart(validData);
        renderResponseList(validData);
    }

    function renderStatusChart(passed, failed, blocked) {
        const ctx = document.getElementById('status-chart').getContext('2d');
        if (statusChartInstance) statusChartInstance.destroy();
        statusChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Blocked'],
                datasets: [{
                    label: 'Response Status',
                    data: [passed, failed, blocked],
                    backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(255, 206, 86, 0.8)'],
                    borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)', 'rgba(255, 206, 86, 1)'],
                    borderWidth: 1
                }]
            },
            options: { responsive: true, aspectRatio: 2, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Response Status Summary' } } }
        });
    }

    function renderCategoryChart(data) {
        const ctx = document.getElementById('category-chart').getContext('2d');
        const categories = {};
        data.forEach(item => {
            if (!item.id) return;
            const category = item.id.substring(0, item.id.lastIndexOf('-'));
            if (!categories[category]) categories[category] = { passed: 0, failed: 0, blocked: 0 };
            const status = item.status.toLowerCase();
            if (status === 'pass') categories[category].passed++;
            else if (status === 'fail') categories[category].failed++;
            else if (status === 'blocked') categories[category].blocked++;
        });
        const labels = Object.keys(categories);
        const passedData = labels.map(label => categories[label].passed);
        const failedData = labels.map(label => categories[label].failed);
        const blockedData = labels.map(label => categories[label].blocked);
        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels, datasets: [
                    { label: 'Passed', data: passedData, backgroundColor: 'rgba(75, 192, 192, 0.8)' },
                    { label: 'Failed', data: failedData, backgroundColor: 'rgba(255, 99, 132, 0.8)' },
                    { label: 'Blocked', data: blockedData, backgroundColor: 'rgba(255, 206, 86, 0.8)' }
                ]
            },
            options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Test Results by Category' } } }
        });
    }

    function renderResponseList(data) {
        const responseList = document.getElementById('response-list');
        responseList.innerHTML = '';
        const grouped = {};
        data.forEach(item => {
            if (!item.id) return;
            if (!grouped[item.id]) grouped[item.id] = [];
            grouped[item.id].push(item);
        });
        Object.keys(grouped).forEach(testId => {
            const group = grouped[testId];
            const testCaseDetails = allTestCases[testId] || {};
            let summaryStatus = 'pass';
            if (group.some(r => (r.status || '').toLowerCase() === 'fail')) summaryStatus = 'fail';
            else if (group.some(r => (r.status || '').toLowerCase() === 'blocked')) summaryStatus = 'blocked';

            const div = document.createElement('div');
            div.className = 'p-4 hover:bg-gray-50 cursor-pointer border-b';
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <p class="font-semibold">${testId} - <span class="font-bold ${getStatusColor(summaryStatus)}">${summaryStatus.toUpperCase()}</span></p>
                    <p class="text-sm text-gray-500">${group[0].scenario || ''}</p>
                </div>
                <div class="hidden mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                    <h3 class="font-semibold text-lg text-gray-800">Feature: ${testCaseDetails.feature || 'N/A'}</h3>
                    <div>
                        <h4 class="font-semibold text-md text-gray-700">Test Scenario</h4>
                        <p class="text-gray-600">${testCaseDetails.scenario || group[0].scenario || 'N/A'}</p>
                    </div>
                    <div>
                        <h4 class="font-semibold text-md text-gray-700">Test Steps</h4>
                        <ol class="list-decimal list-inside space-y-1 text-gray-600">
                            ${(testCaseDetails.steps || 'N/A').split('\n').map(step => `<li>${step.replace(/^(\d+\.\s*)/, '')}</li>`).join('')}
                        </ol>
                    </div>
                    <div>
                        <h4 class="font-semibold text-md text-gray-700">Expected Result</h4>
                        <div class="text-gray-600">${testCaseDetails.expected_result || 'N/A'}</div>
                    </div>
                    <div>
                        <h4 class="font-semibold text-md text-gray-700">All Tester Results</h4>
                        <ul class="space-y-2">
                            ${group.map(r => {
                let color = getStatusColor(r.status);
                let statusLabel = r.status ? r.status.toUpperCase() : 'N/A';
                let comment = r.comment ? `<div class='text-xs text-gray-500'><strong>Comment:</strong> ${r.comment}</div>` : '';
                let tester = r.testerName ? `<span class='text-xs text-gray-400'>by ${r.testerName}${r.testDate ? ' on ' + r.testDate : ''}</span>` : '';
                return `<li class="border rounded p-2 ${color.replace('text-', 'bg-')} bg-opacity-10"><span class="font-bold ${color}">${statusLabel}</span> ${tester} ${comment}</li>`;
            }).join('')}
                        </ul>
                    </div>
                </div>
            `;
            div.addEventListener('click', () => {
                const details = div.querySelector('div:nth-child(2)');
                if (details) details.classList.toggle('hidden');
            });
            responseList.appendChild(div);
        });
    }

    function getStatusColor(status) {
        if (!status) return 'text-gray-600';
        switch ((status || '').toLowerCase()) {
            case 'pass': return 'text-green-600';
            case 'fail': return 'text-red-600';
            case 'blocked': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    }
});


