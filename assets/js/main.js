
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
                    <select name="${tc.id}_status" class="w-full p-2 border border-gray-300 rounded-md shadow-sm" required data-status-select="${tc.id}">
                        <option value="" selected disabled>Select status</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                        <option value="Blocked">Blocked</option>
                    </select>
                </div>
                <div class="md:col-span-4">
                    <input type="text" name="${tc.id}_comment" placeholder="Comments (Required for Fail/Blocked)" class="w-full p-2 border border-gray-300 rounded-md shadow-sm" data-comment-input="${tc.id}">
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
    // Stepper logic
    const TOTAL_STEPS = 8;
    let currentStep = 1;

    // Restore progress and form data from localStorage if available
    const savedStep = localStorage.getItem('sdtest_currentStep');
    if (savedStep) {
        currentStep = parseInt(savedStep, 10) || 1;
    }

    function saveStepToStorage() {
        localStorage.setItem('sdtest_currentStep', currentStep);
    }

    function saveFormDataToStorage() {
        const form = document.getElementById('test-form');
        const formData = new FormData(form);
        const obj = {};
        for (let [k, v] of formData.entries()) {
            obj[k] = v;
        }
        localStorage.setItem('sdtest_formData', JSON.stringify(obj));
    }

    function restoreFormDataFromStorage() {
        const data = localStorage.getItem('sdtest_formData');
        if (!data) return;
        try {
            const obj = JSON.parse(data);
            for (let k in obj) {
                const el = document.querySelector(`[name="${k}"]`);
                if (el) {
                    el.value = obj[k];
                }
            }
        } catch { }
    }

    // Set today's date automatically
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    document.getElementById('test_date').value = formattedDate;

    // Progress bar rendering
    // Track the highest step the user has reached (for clickable stepper)
    let maxStepReached = currentStep;
    // Try to restore maxStepReached from storage
    const savedMaxStep = localStorage.getItem('sdtest_maxStepReached');
    if (savedMaxStep) {
        maxStepReached = parseInt(savedMaxStep, 10) || currentStep;
    }

    function saveMaxStepToStorage() {
        localStorage.setItem('sdtest_maxStepReached', maxStepReached);
    }

    function renderProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        progressBar.innerHTML = '';
        for (let i = 1; i <= TOTAL_STEPS; i++) {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'flex-1 flex flex-col items-center';
            let status = '';
            if (i < currentStep) status = 'completed';
            else if (i === currentStep) status = 'active';
            else status = 'upcoming';
            // Make step number clickable if allowed
            let clickable = (i <= maxStepReached + 1);
            let stepCircle = '';
            if (status === 'completed') {
                stepCircle = `<div class="w-8 h-8 flex items-center justify-center rounded-full mb-1 bg-green-500 text-white cursor-pointer stepper-step" data-step="${i}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>`;
            } else if (status === 'active') {
                stepCircle = `<div class="w-8 h-8 flex items-center justify-center rounded-full mb-1 bg-indigo-600 text-white cursor-pointer stepper-step" data-step="${i}">${i}</div>`;
            } else {
                stepCircle = `<div class="w-8 h-8 flex items-center justify-center rounded-full mb-1 bg-gray-200 text-gray-400 ${clickable ? 'cursor-pointer stepper-step' : ''}" data-step="${i}">${i}</div>`;
            }
            stepDiv.innerHTML = `
                ${stepCircle}
                <span class="text-xs ${status === 'active' ? 'font-bold text-indigo-700' : status === 'completed' ? 'text-green-700' : 'text-gray-400'}">Step ${i}</span>
            `;
            progressBar.appendChild(stepDiv);
            if (i < TOTAL_STEPS) {
                const bar = document.createElement('div');
                bar.className = `h-1 flex-1 mx-1 ${i < currentStep ? 'bg-green-500' : 'bg-gray-200'}`;
                bar.style.marginTop = '16px';
                progressBar.appendChild(bar);
            }
        }

        // Add click listeners to step circles
        setTimeout(() => {
            document.querySelectorAll('.stepper-step').forEach(el => {
                const stepNum = parseInt(el.getAttribute('data-step'), 10);
                // Only allow click if stepNum <= maxStepReached + 1
                if (stepNum <= maxStepReached + 1) {
                    el.addEventListener('click', () => {
                        // If moving forward, validate all required fields in between
                        if (stepNum > currentStep) {
                            for (let s = currentStep; s < stepNum; s++) {
                                const stepEl = document.querySelector(`.step[data-step="${s}"]`);
                                const requiredInputs = stepEl.querySelectorAll('input[required], select[required]');
                                for (let input of requiredInputs) {
                                    if (!input.value) {
                                        input.focus();
                                        input.classList.add('border-red-500');
                                        input.reportValidity();
                                        setTimeout(() => input.classList.remove('border-red-500'), 1200);
                                        return;
                                    }
                                }
                            }
                        }
                        if (stepNum <= maxStepReached + 1) {
                            currentStep = stepNum;
                            showStep(currentStep);
                        }
                    });
                }
            });
        }, 0);
    }

    // Show/hide steps
    function showStep(step) {
        document.querySelectorAll('.step').forEach(el => {
            el.classList.add('hidden');
            if (parseInt(el.getAttribute('data-step')) === step) {
                el.classList.remove('hidden');
            }
        });
        // Buttons
        document.getElementById('prev-btn').style.display = step === 1 ? 'none' : '';
        document.getElementById('next-btn').style.display = step === TOTAL_STEPS ? 'none' : '';
        document.getElementById('submit-btn').classList.toggle('hidden', step !== TOTAL_STEPS);
        renderProgressBar();
        saveStepToStorage();
        saveMaxStepToStorage();
    }

    // Navigation
    document.getElementById('next-btn').addEventListener('click', () => {
        if (currentStep < TOTAL_STEPS) {
            // Validate required fields for current step
            const currentStepEl = document.querySelector(`.step[data-step="${currentStep}"]`);
            const requiredInputs = currentStepEl.querySelectorAll('input[required], select[required]');
            for (let input of requiredInputs) {
                if (!input.value) {
                    input.focus();
                    input.classList.add('border-red-500');
                    input.reportValidity(); // Show browser's required message
                    setTimeout(() => input.classList.remove('border-red-500'), 1200);
                    return;
                }
            }
            currentStep++;
            if (currentStep > maxStepReached) {
                maxStepReached = currentStep;
            }
            showStep(currentStep);
            saveFormDataToStorage();
        }
    });
    document.getElementById('prev-btn').addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
            saveFormDataToStorage();
        }
    });

    // Restore form data if available after test cases are loaded
    function setupRestoreOnInputs() {
        // Save on any input/select change
        document.getElementById('test-form').addEventListener('input', saveFormDataToStorage);
        document.getElementById('test-form').addEventListener('change', saveFormDataToStorage);
    }

    // Initial render
    showStep(currentStep);

    // Populate test cases as before
    window.isAllRequired = true;
    fetch('assets/data/testcase.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
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
            // Add browser-level required logic for status and comment fields
            Object.keys(allTestCases).forEach(id => {
                const statusSelect = document.querySelector(`[data-status-select="${id}"]`);
                const commentInput = document.querySelector(`[data-comment-input="${id}"]`);
                if (statusSelect && commentInput) {
                    statusSelect.addEventListener('change', function () {
                        if (window.isAllRequired && (statusSelect.value === 'Fail' || statusSelect.value === 'Blocked')) {
                            commentInput.required = true;
                        } else {
                            commentInput.required = false;
                        }
                        saveFormDataToStorage();
                    });
                    // Set initial required state
                    if (window.isAllRequired && (statusSelect.value === 'Fail' || statusSelect.value === 'Blocked')) {
                        commentInput.required = true;
                    } else {
                        commentInput.required = false;
                    }
                    // Remove required attribute from select and comment if isAllRequired is false
                    if (!window.isAllRequired) {
                        statusSelect.required = false;
                        commentInput.required = false;
                    }
                }
            });
            // Restore form data after all fields are present
            restoreFormDataFromStorage();
            setupRestoreOnInputs();
            // Update maxStepReached if user has filled more steps (after restore)
            if (currentStep > maxStepReached) {
                maxStepReached = currentStep;
                saveMaxStepToStorage();
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
        // Let browser validation handle required fields
        if (!form.checkValidity()) {
            // Let the browser show the error
            return;
        }
        e.preventDefault();
        const formData = new FormData(form);
        const results = {
            testerName: formData.get('tester_name'),
            testDate: formData.get('test_date'),
            results: []
        };
        for (const id in allTestCases) {
            const status = formData.get(`${id}_status`);
            const comment = formData.get(`${id}_comment`) || '';
            if (status) {
                results.results.push({
                    id: id,
                    scenario: allTestCases[id].scenario,
                    status: status,
                    comment: comment
                });
            }
        }
        document.getElementById('modal-tester-info').textContent = `Tester: ${results.testerName} | Date: ${results.testDate}`;
        document.getElementById('modal-results-json').value = JSON.stringify(results, null, 2);
        resultsModal.classList.remove('hidden');
        setTimeout(() => resultsModal.classList.remove('opacity-0'), 10);
        setTimeout(() => resultsModal.querySelector('.modal-container').classList.remove('scale-95'), 10);
        // Clear localStorage on submit
        localStorage.removeItem('sdtest_formData');
        localStorage.removeItem('sdtest_currentStep');
        localStorage.removeItem('sdtest_maxStepReached');
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
