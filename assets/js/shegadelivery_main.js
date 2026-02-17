// Main JS for Test Execution Pages (Generic)

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // 1. Configuration & initialization
    // -------------------------------------------------------------------------

    // Read configuration from the <body> tag data attributes
    // Example: <body data-json-key="web_application" data-json-file="../../assets/data/testcase.json">
    const bodyEl = document.querySelector('body');
    const jsonKeyPath = bodyEl.getAttribute('data-json-key') || '';
    const jsonFile = bodyEl.getAttribute('data-json-file') || '../assets/data/testcase.json';

    const IS_DEVELOPMENT_MODE = false;
    let TOTAL_STEPS = 2; // Default (Tester Info + 1 Section)
    let currentStep = 1;
    let allTestCases = {}; // Store all loaded test cases by ID

    // DOM Elements
    const form = document.getElementById('test-execution-form');
    const submitBtn = document.querySelector('button[type="submit"]'); // Using querySelector for flexibility
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const stepsContainer = document.getElementById('dynamic-steps-container');

    // -------------------------------------------------------------------------
    // 2. Data Loading & Dynamic Rendering
    // -------------------------------------------------------------------------

    window.isAllRequired = !IS_DEVELOPMENT_MODE;

    fetch(jsonFile)
        .then(response => {
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            return response.json();
        })
        .then(fullData => {
            const targetData = resolvePath(fullData, jsonKeyPath);
            if (!targetData) {
                console.error(`Data not found for key: ${jsonKeyPath}`);
                alert(`Error: Configuration key '${jsonKeyPath}' not found in data.`);
                return;
            }

            // Build the UI based on the top-level keys of targetData
            buildDynamicSections(targetData);

            // Restore any saved progress
            loadProgress();

            // Initial UI Update
            updateStepperUI();
        })
        .catch(error => {
            console.error('Error loading test cases:', error);
            alert('Failed to load test case data. Please check console.');
        });

    // Helper to resolve "mobile_application.customer_application" -> object
    function resolvePath(obj, path) {
        if (!path) return obj;
        return path.split('.').reduce((prev, curr) => {
            return prev ? prev[curr] : null;
        }, obj);
    }

    // Function to build sections dynamically
    function buildDynamicSections(data) {
        stepsContainer.innerHTML = ''; // Clear any placeholders

        // Identify keys (sections) e.g., "common_pages", "customer_portal"
        // We only want keys that are objects or arrays, ignoring metadata if any
        const sections = Object.keys(data).filter(key => typeof data[key] === 'object');

        // Update Total Steps: 1 (Tester Info) + N (Sections)
        TOTAL_STEPS = 1 + sections.length;

        // Generate Steps for each section
        sections.forEach((sectionKey, index) => {
            const stepNum = index + 2; // Step 1 is Tester Info
            const sectionTitle = formatTitle(sectionKey);
            const content = data[sectionKey];

            // Create Step Div
            const stepDiv = document.createElement('div');
            stepDiv.id = `step-${stepNum}`;
            stepDiv.className = `step-content ${stepNum === 1 ? '' : 'hidden'} animate-fade-in`;
            // Add identifying class for validation
            stepDiv.setAttribute('data-step', stepNum);

            // Header
            stepDiv.innerHTML = `
                <div class="bg-indigo-50 border-l-4 border-indigo-600 p-4 mb-6 rounded-r-lg shadow-sm">
                    <h2 class="text-xl font-bold text-gray-800">${sectionTitle}</h2>
                    <p class="text-sm text-gray-600">Execute the test cases below.</p>
                </div>
            `;

            // Process sub-categories (e.g., "home", "login") or direct arrays
            const subContainer = document.createElement('div');
            subContainer.className = 'space-y-6';
            stepDiv.appendChild(subContainer);

            renderRecursive(subContainer, content, sectionKey);

            stepsContainer.appendChild(stepDiv);
        });
    }

    // Recursive renderer to handle nested categories or arrays of test cases
    function renderRecursive(container, data, parentKey) {
        if (Array.isArray(data)) {
            // It's a list of test cases
            // Create a wrapper for these cases
            const listWrapper = document.createElement('div');
            listWrapper.className = 'space-y-4';

            data.forEach(tc => {
                const row = createTestCase(tc);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = row;
                listWrapper.appendChild(tempDiv);
                allTestCases[tc.id] = tc; // Global cache
            });
            container.appendChild(listWrapper);
        } else if (typeof data === 'object' && data !== null) {
            // It's a nested category (e.g. "home", "login_registration")
            Object.keys(data).forEach(key => {
                // If the key is just metadata or empty, skip
                if (!data[key]) return;

                const subTitle = formatTitle(key);

                // Create Accordion/Section
                const subSection = document.createElement('div');
                subSection.className = 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4';
                subSection.innerHTML = `
                    <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors collapsible-header">
                         <h3 class="font-semibold text-gray-700 text-lg">${subTitle}</h3>
                         <svg class="w-5 h-5 text-gray-500 transform transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div class="p-6 collapsible-content hidden"></div>
                `;

                // Add click handler for accordion
                const header = subSection.querySelector('.collapsible-header');
                const contentDiv = subSection.querySelector('.collapsible-content');
                const icon = subSection.querySelector('svg');

                header.addEventListener('click', () => {
                    contentDiv.classList.toggle('hidden');
                    icon.classList.toggle('rotate-180');
                });

                container.appendChild(subSection);

                // Recurse into the content div
                renderRecursive(contentDiv, data[key], key);
            });
        }
    }

    function formatTitle(str) {
        return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    // -------------------------------------------------------------------------
    // 3. Form Logic & Navigation (Standard)
    // -------------------------------------------------------------------------

    // HTML Template for a single test case row
    function createTestCase(tc) {
        return `
            <div class="test-case-row grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b border-gray-100 pb-4 last:border-0 relative">
                <div class="md:col-span-5 relative z-10">
                    <div class="flex items-start">
                        <button type="button" class="test-case-toggle flex-shrink-0 mt-1 mr-3 group focus:outline-none" data-toggle-detail="${tc.id}">
                            <svg class="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-transform transform rotate-0" data-toggle-icon="${tc.id}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        <div class="flex flex-col cursor-pointer" data-toggle-detail-click="${tc.id}">
                            <span class="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit mb-1">${tc.id}</span>
                            <span class="text-sm font-medium text-gray-800 leading-snug">${tc.scenario}</span>
                        </div>
                    </div>
                </div>
                <div class="md:col-span-3">
                    <select name="${tc.id}_status" class="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md shadow-sm transition-colors" required data-status-select="${tc.id}" onchange="updateRowStyle(this)">
                        <option value="" selected disabled>Select Status</option>
                        <option value="Pass" class="text-green-600 font-medium">Pass</option>
                        <option value="Fail" class="text-red-600 font-medium">Fail</option>
                        <option value="Blocked" class="text-yellow-600 font-medium">Blocked</option>
                    </select>
                </div>
                <div class="md:col-span-4">
                    <input type="text" name="${tc.id}_comment" placeholder="Add comment..." class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2" data-comment-input="${tc.id}">
                </div>
            </div>
            
            <!-- Detail View -->
            <div class="test-case-detail hidden bg-gray-50 rounded-lg p-5 mt-2 border border-blue-100 ml-8 mb-4 relative z-0" id="detail-${tc.id}">
                <div class="grid grid-cols-1 gap-4">
                    <div>
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Feature</h4>
                        <p class="text-sm text-gray-800 font-medium">${tc.feature || 'N/A'}</p>
                    </div>
                    <div>
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Test Steps</h4>
                        <div class="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200 whitespace-pre-line leading-relaxed">${tc.steps || 'No steps provided.'}</div>
                    </div>
                    <div>
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Expected Result</h4>
                        <div class="text-sm text-gray-700 bg-green-50 p-3 rounded border border-green-100 text-green-800">${tc.expected_result || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Toggle Detail View
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('[data-toggle-detail]') || e.target.closest('[data-toggle-detail-click]');
        if (toggleBtn) {
            const id = toggleBtn.dataset.toggleDetail || toggleBtn.dataset.toggleDetailClick;
            const detailDiv = document.getElementById(`detail-${id}`);
            const icon = document.querySelector(`[data-toggle-icon="${id}"]`);

            if (detailDiv) {
                const isHidden = detailDiv.classList.contains('hidden');
                detailDiv.classList.toggle('hidden');
                if (icon) {
                    icon.classList.toggle('rotate-180', !isHidden);
                }
            }
        }
    });

    // Make updateRowStyle global for inline onchange
    window.updateRowStyle = function (select) {
        select.className = select.className.replace(/\bbg-\w+-50\b/g, '').replace(/\btext-\w+-700\b/g, '').replace(/\bborder-\w+-300\b/g, '');
        select.classList.add('border-gray-300'); // Reset border

        if (select.value === 'Pass') {
            select.classList.add('bg-green-50', 'text-green-700', 'border-green-300');
            select.classList.remove('border-gray-300');
        } else if (select.value === 'Fail') {
            select.classList.add('bg-red-50', 'text-red-700', 'border-red-300');
            select.classList.remove('border-gray-300');
        } else if (select.value === 'Blocked') {
            select.classList.add('bg-yellow-50', 'text-yellow-700', 'border-yellow-300');
            select.classList.remove('border-gray-300');
        }
    };

    // Navigation Logic
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                if (currentStep < TOTAL_STEPS) {
                    saveProgress(); // Auto-save
                    currentStep++;
                    updateStepperUI();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateStepperUI();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    function updateStepperUI() {
        // Show/Hide Steps
        document.querySelectorAll('.step-content').forEach((el) => {
            const stepNum = parseInt(el.id.replace('step-', ''));
            if (stepNum === currentStep) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });

        // Update Progress Bar
        const progress = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.innerText = `Step ${currentStep} of ${TOTAL_STEPS}`;

        // Button States
        if (prevBtn) {
            prevBtn.disabled = currentStep === 1;
            prevBtn.classList.toggle('opacity-50', currentStep === 1);
        }

        if (currentStep === TOTAL_STEPS) {
            if (nextBtn) nextBtn.classList.add('hidden');
            if (submitBtn) submitBtn.classList.remove('hidden');
        } else {
            if (nextBtn) nextBtn.classList.remove('hidden');
            if (submitBtn) submitBtn.classList.add('hidden');
        }
    }

    function validateStep(step) {
        if (IS_DEVELOPMENT_MODE) return true;
        if (step === 1) {
            const testerName = document.getElementById('tester-name').value;
            if (!testerName.trim()) {
                alert('Please enter Tester Name');
                return false;
            }
            return true;
        }

        // Validate test cases in current step
        const stepDiv = document.getElementById(`step-${step}`);
        if (!stepDiv) return true;

        const selects = stepDiv.querySelectorAll('select');
        let isValid = true;
        let firstInvalid = null;

        selects.forEach(select => {
            // Find parent row to ensure we are validating visible/rendered items
            if (select.closest('.hidden')) return; // Skip hidden items if any

            const id = select.name.replace('_status', '');
            const commentInput = document.querySelector(`input[name="${id}_comment"]`);
            if (!commentInput) return;

            const comment = commentInput.value;

            // Reset styles
            select.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
            commentInput.classList.remove('border-red-500', 'ring-2', 'ring-red-200');

            if (window.isAllRequired && !select.value) {
                isValid = false;
                select.classList.add('border-red-500', 'ring-2', 'ring-red-200');
                if (!firstInvalid) firstInvalid = select;
            } else if ((select.value === 'Fail' || select.value === 'Blocked') && !comment.trim()) {
                isValid = false;
                commentInput.classList.add('border-red-500', 'ring-2', 'ring-red-200');
                commentInput.placeholder = "Comment REQUIRED for Fail/Blocked";
                if (!firstInvalid) firstInvalid = commentInput;
            }
        });

        if (!isValid && firstInvalid) {
            alert('Please complete all required fields in this section.');
            // Expand parent accordion if hidden
            const accordionContent = firstInvalid.closest('.collapsible-content');
            if (accordionContent && accordionContent.classList.contains('hidden')) {
                accordionContent.classList.remove('hidden');
            }
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalid.focus();
        }

        return isValid;
    }

    // -------------------------------------------------------------------------
    // 4. Persistence & Export
    // -------------------------------------------------------------------------

    function saveProgress() {
        if (currentStep === 1) return; // Don't save just tester info
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        // Storage key includes the project path to differentiate between apps
        const storageKey = `shega_test_${jsonKeyPath.replace(/\./g, '_')}`;
        localStorage.setItem(storageKey, JSON.stringify(data));

        // Save tester info specifically
        const testerInfo = {
            name: document.getElementById('tester-name').value,
            browser: document.getElementById('browser-info').value,
            device: document.getElementById('device-info').value
        };
        localStorage.setItem('shega_tester_info', JSON.stringify(testerInfo));
    }

    function loadProgress() {
        // Load Tester Info
        const savedTester = localStorage.getItem('shega_tester_info');
        if (savedTester) {
            const info = JSON.parse(savedTester);
            if (document.getElementById('tester-name')) document.getElementById('tester-name').value = info.name || '';
            if (document.getElementById('browser-info')) document.getElementById('browser-info').value = info.browser || '';
            if (document.getElementById('device-info')) document.getElementById('device-info').value = info.device || '';
        }

        // Load Answers
        const storageKey = `shega_test_${jsonKeyPath.replace(/\./g, '_')}`;
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const els = document.getElementsByName(key);
                if (els.length > 0) {
                    els[0].value = data[key];
                    if (els[0].tagName === 'SELECT') updateRowStyle(els[0]);
                }
            });
        }
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateStep(currentStep)) {
                if (confirm('Are you sure you want to finish the test execution and download results?')) {
                    exportResults();
                }
            }
        });
    }

    function exportResults() {
        const formData = new FormData(form);
        const results = {};

        // Tester Info
        results.info = {
            tester_name: formData.get('tester_name'),
            browser: formData.get('browser_info'),
            device: formData.get('device_info'),
            date: new Date().toISOString(),
            app_section: jsonKeyPath
        };

        results.responses = [];

        // Combine allTestCases with User Responses
        Object.keys(allTestCases).forEach(id => {
            const status = formData.get(`${id}_status`);
            if (status) { // Only include answered
                results.responses.push({
                    ...allTestCases[id],
                    status: status,
                    comment: formData.get(`${id}_comment`)
                });
            }
        });

        // Determine filename based on key
        const safeName = jsonKeyPath.replace(/\./g, '_') || 'test_results';
        const filename = `TestReport_${safeName}_${new Date().toISOString().slice(0, 10)}.json`;

        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Optional: clear progress
        // localStorage.removeItem(`shega_test_${jsonKeyPath.replace(/\./g, '_')}`);
    }
});
