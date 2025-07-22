// DEVELOPMENT MODE FLAG
let IS_DEVELOPMENT_MODE = true; // Set to false for production/live
window.IS_DEVELOPMENT_MODE = IS_DEVELOPMENT_MODE;
window.setDevModeFlag = function (val) {
    IS_DEVELOPMENT_MODE = !!val;
    window.IS_DEVELOPMENT_MODE = IS_DEVELOPMENT_MODE;
    window.isAllRequired = !IS_DEVELOPMENT_MODE;
    // Show/hide the reset walkthrough button based on dev mode
    var resetWalkthroughBtn = document.getElementById('reset-walkthrough-btn');
    if (resetWalkthroughBtn) {
        resetWalkthroughBtn.style.display = IS_DEVELOPMENT_MODE ? 'block' : 'none';
    }
};

// On DOMContentLoaded, set the reset walkthrough button visibility
document.addEventListener('DOMContentLoaded', function () {
    var resetWalkthroughBtn = document.getElementById('reset-walkthrough-btn');
    if (resetWalkthroughBtn) {
        resetWalkthroughBtn.style.display = IS_DEVELOPMENT_MODE ? 'block' : 'none';
    }
});

// Track which test cases have been read (by id)
window.testCaseRead = window.testCaseRead || {};

const allTestCases = {};

// Function to create a test case row in the HTML
function createTestCase(tc) {
    allTestCases[tc.id] = tc; // Store full test case data for later use
    // Collapsible details section with up/down icon
    const buttonData = `data-id="${tc.id}"`;
    return `
        <div class="test-case-row grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div class="md:col-span-5">
                <div class="flex items-start">
                    <button type="button" class="test-case-toggle flex-shrink-0 mt-1 mr-3 group" data-toggle-detail="${tc.id}" aria-expanded="false" tabindex="0" style="outline:none;">
                        <svg class="w-5 h-5 text-gray-500 group-hover:text-indigo-600 transition-transform transform rotate-0" data-toggle-icon="${tc.id}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <div class="flex flex-col cursor-pointer" data-toggle-detail-click="${tc.id}">
                        <span class="font-semibold text-gray-800">${tc.id}</span>
                        <span class="text-sm text-gray-600 mt-1">${tc.scenario}</span>
                    </div>
                </div>
            </div>
            <div class="md:col-span-3">
                <select name="${tc.id}_status" class="w-full p-2 border border-gray-300 rounded-md shadow-sm" required data-status-select="${tc.id}">
                    <option value="" selected disabled>Select status</option>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                    <option value="Blocked">Blocked</option>
                </select>
                <div class="text-xs text-red-600 mt-1 hidden" data-detail-error="${tc.id}">Please read the test case detail before selecting a status.</div>
            </div>
            <div class="md:col-span-4">
                <input type="text" name="${tc.id}_comment" placeholder="Comments (Required for Fail/Blocked)" class="w-full p-2 border border-gray-300 rounded-md shadow-sm" data-comment-input="${tc.id}">
            </div>
        </div>
        <div class="test-case-detail collapse-detail bg-gray-50 border border-gray-200 rounded-lg mt-2 p-4 hidden" id="detail-${tc.id}" style="grid-column: 1 / -1;">
            <h3 class="font-semibold text-lg mb-2 text-gray-800">Feature: ${tc.feature}</h3>
            <h4 class="font-semibold text-md mb-1 text-gray-700">Test Scenario</h4>
            <p class="mb-3 text-gray-600">${tc.scenario}</p>
            <h4 class="font-semibold text-md mb-1 text-gray-700">Test Steps</h4>
            <ol class="list-decimal list-inside space-y-2 mb-3 text-gray-600">
                ${tc.steps.split('\n').map(step => {
        const cleanStep = step.replace(/^(\d+\.\s*)/, '');
        // Convert URLs to links
        return `<li>${cleanStep.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-indigo-600 hover:underline">$1</a>')}</li>`;
    }).join('')}
            </ol>
            <h4 class="font-semibold text-md mb-1 text-gray-700">Expected Result</h4>
            <div class="expected-result text-gray-700">${tc.expected_result}</div>
        </div>
    `;
}


// Collapsible details logic
function setupCollapsibleDetails() {
    // Toggle logic for both icon and id/scenario
    function toggleDetailById(id) {
        const btn = document.querySelector(`.test-case-toggle[data-toggle-detail="${id}"]`);
        const detail = document.getElementById('detail-' + id);
        const icon = btn ? btn.querySelector('svg[data-toggle-icon]') : null;
        const expanded = btn && btn.getAttribute('aria-expanded') === 'true';
        if (expanded) {
            detail.classList.add('hidden');
            if (btn) btn.setAttribute('aria-expanded', 'false');
            if (icon) icon.classList.remove('rotate-180');
        } else {
            detail.classList.remove('hidden');
            if (btn) btn.setAttribute('aria-expanded', 'true');
            if (icon) icon.classList.add('rotate-180');
            // Mark as read (for production mode)
            if (!IS_DEVELOPMENT_MODE) {
                window.testCaseRead[id] = true;
            }
        }
    }

    document.querySelectorAll('.test-case-toggle').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const id = btn.getAttribute('data-toggle-detail');
            toggleDetailById(id);
        });
        // Keyboard accessibility
        btn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });
    // Also allow clicking the id/scenario area
    document.querySelectorAll('[data-toggle-detail-click]').forEach(el => {
        el.addEventListener('click', function (e) {
            const id = el.getAttribute('data-toggle-detail-click');
            toggleDetailById(id);
        });
        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.click();
            }
        });
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', 'Show test case details');
    });
}

// Main script execution

document.addEventListener('DOMContentLoaded', () => {
    // Stepper logic
    const TOTAL_STEPS = 8;
    let currentStep = 1;

    // Reset Progress button logic
    const resetBtn = document.getElementById('reset-progress-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // Clear localStorage progress and form data
            localStorage.removeItem('sdtest_formData');
            localStorage.removeItem('sdtest_currentStep');
            localStorage.removeItem('sdtest_maxStepReached');
            // Reset step and form
            currentStep = 1;
            showStep(currentStep);
            // Optionally clear all form fields
            const form = document.getElementById('test-form');
            if (form) form.reset();
            // Restore test_date to today's date after reset
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            const testDateInput = document.getElementById('test_date');
            if (testDateInput) testDateInput.value = formattedDate;
            // Optionally reload page to fully reset state
            // location.reload();
        });
    }

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
            // Only show label on md+ screens, just number on mobile
            stepDiv.innerHTML = `
                ${stepCircle}
                <span class="text-xs ${status === 'active' ? 'font-bold text-indigo-700' : status === 'completed' ? 'text-green-700' : 'text-gray-400'} hidden md:inline">Step ${i}</span>
                <span class="text-xs ${status === 'active' ? 'font-bold text-indigo-700' : status === 'completed' ? 'text-green-700' : 'text-gray-400'} md:hidden">${i}</span>
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
        // Show reset only on step 1
        var resetBtn = document.getElementById('reset-progress-btn');
        if (resetBtn) {
            resetBtn.style.display = step === 1 ? '' : 'none';
        }
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
    window.isAllRequired = !IS_DEVELOPMENT_MODE;
    fetch('assets/data/testcase.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            // Walkthrough: only load WEB-LND-01 if walkthrough is active
            let walkthroughActive = false;
            try { walkthroughActive = !localStorage.getItem('sdtest_walkthrough_done'); } catch (e) { }
            const containers = {
                'web-common-pages': walkthroughActive
                    ? [data.web_application.common_pages.landing_page.find(tc => tc.id === 'WEB-LND-01')].filter(Boolean)
                    : [...data.web_application.common_pages.landing_page, ...data.web_application.common_pages.login_registration],
                'web-customer-portal': walkthroughActive ? [] : [...data.web_application.customer_portal.user_profile, ...data.web_application.customer_portal.store_listing, ...data.web_application.customer_portal.store_detail, ...data.web_application.customer_portal.checkout, ...data.web_application.customer_portal.order_tracking],
                'web-store-portal': walkthroughActive ? [] : [...data.web_application.store_portal.dashboard, ...data.web_application.store_portal.payouts, ...data.web_application.store_portal.menu, ...data.web_application.store_portal.offers, ...data.web_application.store_portal.preparation_time, ...data.web_application.store_portal.orders],
                'web-provider-portal': walkthroughActive ? [] : [...data.web_application.provider_portal.profile, ...data.web_application.provider_portal.orders],
                'mobile-customer-app': walkthroughActive ? [] : [...data.mobile_application.customer_application.login_registration, ...data.mobile_application.customer_application.service_selection, ...data.mobile_application.customer_application.side_navigation, ...data.mobile_application.customer_application.ordering_flow],
                'mobile-store-app': walkthroughActive ? [] : [...data.mobile_application.store_application.order_management, ...data.mobile_application.store_application.side_navigation],
                'mobile-driver-app': walkthroughActive ? [] : [...data.mobile_application.driver_application.order_flow, ...data.mobile_application.driver_application.side_navigation],
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
                const detailError = document.querySelector(`[data-detail-error="${id}"]`);
                if (statusSelect && commentInput) {
                    statusSelect.addEventListener('change', function (e) {
                        // Only enforce in production/live mode
                        if (!IS_DEVELOPMENT_MODE) {
                            if (!window.testCaseRead[id]) {
                                statusSelect.selectedIndex = 0; // Reset to "Select status"
                                if (detailError) {
                                    detailError.classList.remove('hidden');
                                }
                                setTimeout(() => {
                                    if (detailError) detailError.classList.add('hidden');
                                }, 2500);
                                return;
                            }
                        }
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
            // Setup collapsible details after rendering
            setupCollapsibleDetails();
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
    const exportJsonBtn = document.getElementById('export-json-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');

    form.addEventListener('submit', function (e) {
        // Prevent submit during walkthrough except at the final walkthrough step on step 2
        var walkthroughActive = false;
        try { walkthroughActive = !localStorage.getItem('sdtest_walkthrough_done'); } catch (err) { }
        var allowSubmit = true;
        if (walkthroughActive) {
            // Only allow submit if on step 2 and walkthrough is at the last step (step 6 in walkthrough array)
            var step2 = document.querySelector('.step[data-step="2"]');
            var walkthroughBox = document.getElementById('walkthrough-box');
            var walkthroughContent = document.getElementById('walkthrough-content');
            // Try to detect if walkthrough is at the submit step
            var isOnStep2 = step2 && !step2.classList.contains('hidden');
            var isWalkthroughSubmitStep = false;
            if (window.walkthroughStepIndex !== undefined) {
                isWalkthroughSubmitStep = window.walkthroughStepIndex === 6;
            } else if (walkthroughBox && walkthroughContent) {
                // Fallback: check if walkthrough box contains 'Submit Your Results'
                isWalkthroughSubmitStep = walkthroughContent.innerHTML.includes('Submit Your Results');
            }
            if (!(isOnStep2 && isWalkthroughSubmitStep)) {
                e.preventDefault();
                return false;
            }
        }
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
        exportResults();
        // Clear localStorage on submit
        localStorage.removeItem('sdtest_formData');
        localStorage.removeItem('sdtest_currentStep');
        localStorage.removeItem('sdtest_maxStepReached');
    });

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
        if (e.target === resultsModal) {
            resultsModal.classList.add('opacity-0');
            resultsModal.querySelector('.modal-container').classList.add('scale-95');
            setTimeout(() => resultsModal.classList.add('hidden'), 300);
        }
    });

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            resultsModal.classList.add('opacity-0');
            resultsModal.querySelector('.modal-container').classList.add('scale-95');
            setTimeout(() => resultsModal.classList.add('hidden'), 300);
        });
    }
});
