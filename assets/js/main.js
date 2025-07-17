
const allTestCases = {};

// Function to create a test case row in the HTML
function createTestCase(tc) {
    allTestCases[tc.id] = tc; // Store full test case data for later use
    const buttonData = `data-id="${tc.id}"`;
    return `
            <div class="test-case-row grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div class="md:col-span-5">
                    <button type="button" class="w-full p-2 rounded-md test-case-button" onclick="showTestCaseDetails(this)" ${buttonData}>
                        <p class="font-semibold text-gray-800">${tc.id}</p>
                        <p class="text-sm text-gray-600">${tc.scenario}</p>
                    </button>
                </div>
                <div class="md:col-span-3">
                    <select name="${tc.id}_status" class="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                        <option value="Not Tested" selected>Not Tested</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                        <option value="Blocked">Blocked</option>
                    </select>
                </div>
                <div class="md:col-span-4">
                    <input type="text" name="${tc.id}_comment" placeholder="Comments (Required for Fail/Blocked)" class="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                </div>
            </div>
            `;
}

// Function to show the test case details modal
window.showTestCaseDetails = function (button) {
    const id = button.getAttribute('data-id');
    const tc = allTestCases[id];

    if (!tc) return;

    document.getElementById('modal-title').textContent = `${tc.id} - ${tc.feature}`;
    document.getElementById('modal-scenario').textContent = tc.scenario;
    document.getElementById('modal-expected-result').textContent = tc.expected_result;

    const stepsList = document.getElementById('modal-steps');
    stepsList.innerHTML = '';
    // FIX: Remove the number from the beginning of the step string
    tc.steps.split('\n').forEach(step => {
        const li = document.createElement('li');
        const cleanStep = step.replace(/^\d+\.\s*/, ''); // Removes "1. ", "2. ", etc.
        li.innerHTML = cleanStep.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-indigo-600 hover:underline">$1</a>');
        stepsList.appendChild(li);
    });

    const testCaseModal = document.getElementById('test-case-modal');
    testCaseModal.classList.remove('hidden');
    setTimeout(() => testCaseModal.classList.remove('opacity-0'), 10);
    setTimeout(() => testCaseModal.querySelector('.modal-container').classList.remove('scale-95'), 10);
}

// Main script execution
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date automatically
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    document.getElementById('test_date').value = formattedDate;

    // Fetch data and populate the form
    fetch('assets/data/testcase.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const containers = {
                'web-common-pages': [...data.web_application.common_pages.landing_page, ...data.web_application.common_pages.login_registration],
                'web-customer-portal': [...data.web_application.customer_portal.user_profile, ...data.web_application.customer_portal.store_listing, ...data.web_application.customer_portal.store_detail, ...data.web_application.customer_portal.checkout, ...data.web_application.customer_portal.order_tracking],
                'web-store-portal': [...data.web_application.store_portal.dashboard, ...data.web_application.store_portal.payouts, ...data.web_application.store_portal.menu, ...data.web_application.store_portal.offers, ...data.web_application.store_portal.preparation_time, ...data.web_application.store_portal.orders],
                'web-provider-portal': [...data.web_application.provider_portal.profile, ...data.web_application.provider_portal.orders],
                'mobile-customer-app': [...data.mobile_application.customer_application.login_registration, ...data.mobile_application.customer_application.service_selection, ...data.mobile_application.customer_application.side_navigation, ...data.mobile_application.customer_application.ordering_flow],
                'mobile-store-app': [...data.mobile_application.store_application.order_management, ...data.mobile_application.store_application.side_navigation],
                'mobile-driver-app': [...data.mobile_application.driver_application.order_flow, ...data.mobile_application.driver_application.side_navigation],
            };

            for (const containerId in containers) {
                const container = document.getElementById(containerId);
                if (container) {
                    containers[containerId].forEach(tc => {
                        container.innerHTML += createTestCase(tc);
                    });
                }
            }
        })
        .catch(error => console.error('Error loading test cases:', error));


    // Modal and Form Submission Logic
    const form = document.getElementById('test-form');
    const resultsModal = document.getElementById('results-modal');
    const testCaseModal = document.getElementById('test-case-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const closeTestCaseModalBtn = document.getElementById('close-test-case-modal-btn');
    const exportJsonBtn = document.getElementById('export-json-btn');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(form);
        const results = {
            testerName: formData.get('tester_name'),
            testDate: formData.get('test_date'),
            results: []
        };

        for (const id in allTestCases) {
            const status = formData.get(`${id}_status`);
            if (status && status !== 'Not Tested') {
                results.results.push({
                    id: id,
                    scenario: allTestCases[id].scenario,
                    status: status,
                    comment: formData.get(`${id}_comment`) || ''
                });
            }
        }

        document.getElementById('modal-tester-info').textContent = `Tester: ${results.testerName} | Date: ${results.testDate}`;
        document.getElementById('modal-results-json').value = JSON.stringify(results, null, 2);

        resultsModal.classList.remove('hidden');
        setTimeout(() => resultsModal.classList.remove('opacity-0'), 10);
        setTimeout(() => resultsModal.querySelector('.modal-container').classList.remove('scale-95'), 10);
    });

    const closeModal = (modal) => {
        modal.classList.add('opacity-0');
        modal.querySelector('.modal-container').classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    closeModalBtn.addEventListener('click', () => closeModal(resultsModal));
    closeTestCaseModalBtn.addEventListener('click', () => closeModal(testCaseModal));

    const exportResults = () => {
        const jsonString = document.getElementById('modal-results-json').value;
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const testerName = document.getElementById('tester_name').value.replace(/ /g, '_') || 'tester';
        const testDate = document.getElementById('test_date').value || 'date';
        a.href = url;
        a.download = `test-results_${testerName}_${testDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    exportJsonBtn.addEventListener('click', exportResults);

    resultsModal.addEventListener('click', (e) => {
        if (e.target === resultsModal) closeModal(resultsModal);
    });
    testCaseModal.addEventListener('click', (e) => {
        if (e.target === testCaseModal) closeModal(testCaseModal);
    });
});
