document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('upload-btn');
    const responseFileInput = document.getElementById('response-file');
    const analysisSection = document.getElementById('analysis-section');
    const uploadSection = document.getElementById('upload-section');

    let statusChartInstance = null;
    let categoryChartInstance = null;

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

    function displayAnalysis(data) {
        console.log("Displaying analysis for data:", data);
        const validData = data.filter(item => item && item.status);
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
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <p class="font-semibold">${item.id || `Response ${index + 1}`} - <span class="font-bold ${getStatusColor(item.status)}">${item.status.toUpperCase()}</span></p>
                    <p class="text-sm text-gray-500">${item.scenario || ''}</p>
                </div>
                <div class="hidden mt-4 p-4 bg-gray-100 rounded">
                    <pre class="text-sm">${JSON.stringify(item, null, 2)}</pre>
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
