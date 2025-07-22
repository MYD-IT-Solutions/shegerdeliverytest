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

    // Fetch all test cases to have details available for display
    fetch('assets/data/testcase.json')
        .then(response => response.json())
        .then(data => {
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    for (const section in data[key]) {
                        if (data[key].hasOwnProperty(section)) {
                            for (const page in data[key][section]) {
                                if (data[key][section].hasOwnProperty(page) && Array.isArray(data[key][section][page])) {
                                    data[key][section][page].forEach(tc => {
                                        allTestCases[tc.id] = tc;
                                    });
                                }
                            }
                        }
                    }
                }
            }
            console.log("All test cases loaded and mapped.");
        }).catch(error => console.error('Error loading testcase.json:', error));


    uploadBtn.addEventListener('click', () => {
        const file = responseFileInput.files[0];
        if (!file) {
            alert('Please select a JSON file to upload.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            console.log("Attempting to read file...");
            if (!event.target.result) {
                console.error("File content is empty.");
                alert("The selected file is empty.");
                return;
            }
            console.log("File content read successfully. Length:", event.target.result.length);
            console.log("File content snippet:", event.target.result.substring(0, 500));

            try {
                const jsonData = JSON.parse(event.target.result);
                console.log("JSON parsed successfully:", jsonData);

                if (jsonData && jsonData.results && Array.isArray(jsonData.results)) {
                    console.log("'results' array found. Proceeding with analysis.");

                    // Display tester info
                    document.getElementById('tester-name').textContent = jsonData.testerName || 'N/A';
                    document.getElementById('test-date').textContent = jsonData.testDate || 'N/A';
                    document.getElementById('tester-info').classList.remove('hidden');

                    displayAnalysis(jsonData.results);
                    uploadSection.classList.add('hidden');
                    analysisSection.classList.remove('hidden');
                } else {
                    console.error("Invalid JSON format: 'results' array not found in the parsed data.", jsonData);
                    alert('Invalid JSON format: "results" array not found.');
                }
            } catch (error) {
                console.error("Error parsing JSON:", error);
                alert('Invalid JSON file. Check console for details.');
            }
        };

        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            alert("An error occurred while reading the file.");
        };

        reader.readAsText(file);
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
            if (status === 'pass') {
                filteredData = fullResponseData.filter(item => item.status.toLowerCase() === 'pass');
            } else if (status === 'fail') {
                filteredData = fullResponseData.filter(item => item.status.toLowerCase() === 'fail');
            } else if (status === 'blocked') {
                filteredData = fullResponseData.filter(item => item.status.toLowerCase() === 'blocked');
            }
            renderResponseList(filteredData);
        }
    });

    function displayAnalysis(data) {
        console.log("Displaying analysis for data:", data);
        const validData = data.filter(item => item && item.status);
        fullResponseData = validData;
        console.log("Filtered data with status:", validData);

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
        if (statusChartInstance) {
            statusChartInstance.destroy();
        }
        statusChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Blocked'],
                datasets: [{
                    label: 'Response Status',
                    data: [passed, failed, blocked],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 206, 86, 0.8)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Response Status Summary'
                    }
                }
            }
        });
    }

    function renderCategoryChart(data) {
        const ctx = document.getElementById('category-chart').getContext('2d');

        const categories = {};
        data.forEach(item => {
            if (!item.id) return;
            const category = item.id.substring(0, item.id.lastIndexOf('-'));
            if (!categories[category]) {
                categories[category] = { passed: 0, failed: 0, blocked: 0 };
            }
            const status = item.status.toLowerCase();
            if (status === 'pass') categories[category].passed++;
            else if (status === 'fail') categories[category].failed++;
            else if (status === 'blocked') categories[category].blocked++;
        });

        const labels = Object.keys(categories);
        const passedData = labels.map(label => categories[label].passed);
        const failedData = labels.map(label => categories[label].failed);
        const blockedData = labels.map(label => categories[label].blocked);

        if (categoryChartInstance) {
            categoryChartInstance.destroy();
        }

        categoryChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Passed',
                        data: passedData,
                        backgroundColor: 'rgba(75, 192, 192, 0.8)',
                    },
                    {
                        label: 'Failed',
                        data: failedData,
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    },
                    {
                        label: 'Blocked',
                        data: blockedData,
                        backgroundColor: 'rgba(255, 206, 86, 0.8)',
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Test Results by Category'
                    }
                }
            }
        });
    }

    function renderResponseList(data) {
        const responseList = document.getElementById('response-list');
        responseList.innerHTML = '';

        data.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'p-4 hover:bg-gray-50 cursor-pointer border-b';
            const testCaseDetails = allTestCases[item.id] || {};

            let resultHtml = '';
            const status = item.status.toLowerCase();
            if (status === 'pass') {
                resultHtml = `<div class="p-3 rounded-lg bg-green-100 text-green-800"><strong>Status:</strong> Passed</div>`;
            } else if (status === 'fail') {
                resultHtml = `<div class="p-3 rounded-lg bg-red-100 text-red-800">
                    <p class="font-bold">Status: Failed</p>
                    <p><strong>Comment:</strong> ${item.comment || 'No comment provided.'}</p>
                </div>`;
            } else if (status === 'blocked') {
                resultHtml = `<div class="p-3 rounded-lg bg-yellow-100 text-yellow-800">
                    <p class="font-bold">Status: Blocked</p>
                    <p><strong>Comment:</strong> ${item.comment || 'No comment provided.'}</p>
                </div>`;
            }

            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <p class="font-semibold">${item.id || `Response ${index + 1}`} - <span class="font-bold ${getStatusColor(item.status)}">${item.status.toUpperCase()}</span></p>
                    <p class="text-sm text-gray-500">${item.scenario || ''}</p>
                </div>
                <div class="hidden mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                    <h3 class="font-semibold text-lg text-gray-800">Feature: ${testCaseDetails.feature || 'N/A'}</h3>
                    <div>
                        <h4 class="font-semibold text-md text-gray-700">Test Scenario</h4>
                        <p class="text-gray-600">${testCaseDetails.scenario || 'N/A'}</p>
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
                        <h4 class="font-semibold text-md text-gray-700">User Test Result</h4>
                        ${resultHtml}
                    </div>
                </div>
            `;
            div.addEventListener('click', () => {
                const details = div.querySelector('div:nth-child(2)');
                if (details) {
                    details.classList.toggle('hidden');
                }
            });
            responseList.appendChild(div);
        });
    }

    function getStatusColor(status) {
        if (!status) return 'text-gray-600';
        switch (status.toLowerCase()) {
            case 'pass':
                return 'text-green-600';
            case 'fail':
                return 'text-red-600';
            case 'blocked':
                return 'text-yellow-600';
            default:
                return 'text-gray-600';
        }
    }
});
