// Interactive walkthrough logic: show only once, persistent, and top-right
// This file was refactored from shegerdeliverytest.html

document.addEventListener('DOMContentLoaded', function () {
    // Walkthrough reset button for testing
    var resetBtn = document.getElementById('reset-walkthrough-btn');
    if (resetBtn) {
        resetBtn.onclick = function () {
            localStorage.removeItem('sdtest_walkthrough_done');
            location.reload();
        };
    }

    // Always allow walkthrough for testing (remove in prod)
    var showWalkthrough = !localStorage.getItem('sdtest_walkthrough_done');
    // Helper to set dev mode globally
    function setDevMode(val) {
        if (typeof window.setDevModeFlag === 'function') window.setDevModeFlag(val);
    }
    // Enable dev mode for walkthrough and only show step 1 and 2 in UI
    if (showWalkthrough) {
        setDevMode(true);
        // Hide all steps except 1 and 2
        var allSteps = document.querySelectorAll('.step');
        allSteps.forEach(function (stepDiv) {
            var stepNum = stepDiv.getAttribute('data-step');
            if (stepNum !== '1' && stepNum !== '2') stepDiv.style.display = 'none';
            else stepDiv.style.display = '';
        });
        // Hide all progress bar steps except 1 and 2 (after progress bar is rendered)
        setTimeout(function () {
            var progressBar = document.getElementById('progress-bar');
            if (progressBar) {
                var stepEls = progressBar.querySelectorAll('.progress-step');
                stepEls.forEach(function (el) {
                    var stepNum = el.getAttribute('data-step');
                    if (stepNum !== '1' && stepNum !== '2') el.style.display = 'none';
                    else el.style.display = '';
                });
            }
        }, 0);
    }

    // Add walkthrough arrow style
    var arrowStyle = document.createElement('style');
    arrowStyle.innerHTML = `.walkthrough-arrow { position: absolute; z-index: 200; pointer-events: none; width: 60px; height: 60px; }
.walkthrough-arrow svg { width: 60px; height: 60px; }
@media (max-width: 600px) { .walkthrough-arrow { width: 36px; height: 36px; } .walkthrough-arrow svg { width: 36px; height: 36px; } }`;
    document.head.appendChild(arrowStyle);
    var arrowDiv = document.createElement('div');
    arrowDiv.className = 'walkthrough-arrow';
    arrowDiv.style.display = 'none';
    arrowDiv.innerHTML = '<svg viewBox="0 0 60 60"><polygon points="0,0 60,30 0,60" fill="#6366f1"/></svg>';
    document.body.appendChild(arrowDiv);

    var steps = [
        {
            html: `<h3 class="font-semibold text-indigo-800 mb-2 text-lg">Welcome to the Test Execution Walkthrough</h3>
<p class="text-gray-700 mb-2">This quick guide will show you how to fill out and submit a test case. Click <b>Next</b> to begin.</p>`
        },
        {
            html: `<b>Step 1: Enter Your Name</b><br><span class="text-gray-700">Type your name in the <b>Tester Name</b> field. (We'll do it for you in this example.)</span>`,
            highlight: '#tester_name',
            action: function () {
                var input = document.getElementById('tester_name');
                if (input) input.value = 'Example Tester';
            }
        },
        {
            html: `<b>Step 2: Scan the QR or Use the App/Web Links</b><br><span class="text-gray-700">You can scan the QR code or use the buttons below to access the app or website.</span>`,
            highlight: '.h-40.w-40.mb-2',
        },
        {
            html: `<b>Step 3: Click Next to Start Testing</b><br><span class="text-gray-700">Let's proceed to the first test case section.</span>`,
            highlight: '#next-btn',
            action: null,
            autoAdvance: null
        },
        {
            html: `<b>Step 4: Read the Test Case Details</b><br><span class="text-gray-700">The first test case details are now opened for you. <br><span style='color:#16a34a;font-weight:bold;'>Watch as the details expand and the indicator turns green.</span></span>`,
            highlight: '.testcase-header',
            action: function () {
                // Find the toggle button for WEB-LND-01
                var toggleBtn = document.querySelector('.test-case-toggle[data-toggle-detail="WEB-LND-01"]');
                var indicator = toggleBtn ? toggleBtn.querySelector('svg') : null;
                var detailPanel = document.getElementById('detail-WEB-LND-01');
                // First, ensure details are closed
                if (toggleBtn && detailPanel && !detailPanel.classList.contains('hidden')) {
                    toggleBtn.click(); // close if open
                }
                if (indicator) indicator.style.color = '';
                // After a short delay, open and highlight
                setTimeout(function () {
                    if (toggleBtn && detailPanel && detailPanel.classList.contains('hidden')) {
                        toggleBtn.click();
                        if (indicator) {
                            indicator.style.color = '#16a34a';
                            indicator.style.transition = 'color 0.3s';
                            setTimeout(function () {
                                indicator.style.color = '';
                            }, 1200);
                        }
                    }
                }, 700);
            }
        },
        {
            html: `<b>Step 5: Select a Status</b><br><span class="text-gray-700">Choose <b>Pass</b>, <b>Fail</b>, or <b>Blocked</b> for the test case.<br><span style='color:#6366f1;font-weight:bold;'>Watch as the status is selected for you.</span></span>`,
            highlight: 'select[data-status-select="WEB-LND-01"]',
            action: function () {
                var select = document.querySelector('select[data-status-select="WEB-LND-01"]');
                if (select) {
                    select.classList.add('walkthrough-pulse');
                    // Show arrow pointing to select
                    var rect = select.getBoundingClientRect();
                    var arrow = document.querySelector('.walkthrough-arrow');
                    if (arrow) {
                        arrow.style.display = '';
                        arrow.style.left = (window.scrollX + rect.left + rect.width / 2 - 30) + 'px';
                        arrow.style.top = (window.scrollY + rect.bottom + 8) + 'px';
                        arrow.style.transform = 'rotate(90deg)';
                    }
                    setTimeout(function () {
                        select.value = 'Pass';
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        select.classList.add('walkthrough-pulse');
                        setTimeout(function () {
                            select.classList.remove('walkthrough-pulse');
                            if (arrow) arrow.style.display = 'none';
                        }, 1000);
                    }, 900);
                }
            }
        },
        {
            html: `<b>Step 6: Enter a Comment</b><br><span class="text-gray-700">Add a comment for the test case.<br><span style='color:#6366f1;font-weight:bold;'>Comments are <b>required</b> for <b>Fail</b> and <b>Blocked</b>, but <b>optional</b> for Pass.<br>Watch as the comment is filled in for you.</span></span>`,
            highlight: 'input[data-comment-input="WEB-LND-01"]',
            action: function () {
                var commentBox = document.querySelector('input[data-comment-input="WEB-LND-01"]');
                if (commentBox) {
                    commentBox.classList.add('walkthrough-pulse');
                    // Show arrow pointing to comment input
                    var rect = commentBox.getBoundingClientRect();
                    var arrow = document.querySelector('.walkthrough-arrow');
                    if (arrow) {
                        arrow.style.display = '';
                        arrow.style.left = (window.scrollX + rect.left + rect.width / 2 - 30) + 'px';
                        arrow.style.top = (window.scrollY + rect.bottom + 8) + 'px';
                        arrow.style.transform = 'rotate(90deg)';
                    }
                    setTimeout(function () {
                        commentBox.value = 'All checks passed.';
                        commentBox.classList.add('walkthrough-pulse');
                        setTimeout(function () {
                            commentBox.classList.remove('walkthrough-pulse');
                            if (arrow) arrow.style.display = 'none';
                        }, 1000);
                    }, 900);
                }
            }
        },
        {
            html: `<b>Step 7: Submit Your Results</b><br><span class="text-gray-700">Click <b>Submit</b> to finish. (We'll do it for you in this example.)</span>`,
            highlight: '#submit-btn',
            action: function () {
                // Only auto-submit if currently on step 2 (test case step)
                var step2 = document.querySelector('.step[data-step="2"]');
                if (step2 && !step2.classList.contains('hidden')) {
                    setTimeout(function () {
                        document.getElementById('submit-btn').click();
                    }, 800);
                }
            },
            autoAdvance: 1500
        },
        {
            html: `<b>That's it!</b><br><span class="text-gray-700">You've completed the walkthrough. Now you can start your own test session. Good luck!</span>`
        }
    ];
    var step = 0;
    var backdrop = document.getElementById('walkthrough-backdrop');
    var box = document.getElementById('walkthrough-box');
    var content = document.getElementById('walkthrough-content');
    var btnNext = document.getElementById('walkthrough-next');
    var btnPrev = document.getElementById('walkthrough-prev');
    var btnFinish = document.getElementById('walkthrough-finish');
    var highlightEl = null;

    function showArrow(target) {
        if (!target) { arrowDiv.style.display = 'none'; return; }
        var rect = target.getBoundingClientRect();
        arrowDiv.style.display = '';
        // Place arrow to the left or above the element
        arrowDiv.style.left = (window.scrollX + rect.left - 70) + 'px';
        arrowDiv.style.top = (window.scrollY + rect.top + rect.height / 2 - 30) + 'px';
    }

    function showStep(idx) {
        // Remove previous highlight
        if (highlightEl) {
            highlightEl.classList.remove('walkthrough-highlight');
            highlightEl = null;
        }
        var s = steps[idx];
        content.innerHTML = s.html;
        // Highlight element if needed
        if (s.highlight) {
            highlightEl = document.querySelector(s.highlight);
            if (highlightEl) highlightEl.classList.add('walkthrough-highlight');
            showArrow(highlightEl);
        } else {
            showArrow(null);
        }
        // Run action if any
        if (typeof s.action === 'function') s.action();
        // Button visibility
        btnPrev.style.display = idx > 0 ? '' : 'none';
        btnNext.style.display = (idx < steps.length - 1) ? '' : 'none';
        btnFinish.style.display = (idx === steps.length - 1) ? '' : 'none';
        // Auto-advance if needed
        if (s.autoAdvance) {
            setTimeout(function () {
                if (step === idx) nextStep();
            }, s.autoAdvance);
        }
        // Special: only at walkthrough step 3, clicking Next should advance the form stepper
        if (idx === 3) {
            btnNext.onclick = function () {
                // Advance walkthrough
                step++;
                showStep(step);
                // Advance form stepper
                document.getElementById('next-btn').click();
            };
        } else {
            btnNext.onclick = nextStep;
        }
    }
    function nextStep() {
        if (step < steps.length - 1) {
            step++;
            showStep(step);
        }
    }
    function prevStep() {
        if (step > 0) {
            step--;
            showStep(step);
        }
    }
    function finishWalkthrough() {
        if (highlightEl) highlightEl.classList.remove('walkthrough-highlight');
        showArrow(null);
        backdrop.style.display = 'none';
        localStorage.setItem('sdtest_walkthrough_done', '1');
        // Clear saved progress and walkthrough state
        localStorage.removeItem('sdtest_progress');
        localStorage.removeItem('sdtest_results');
        // Disable dev mode after walkthrough
        setDevMode(false);
        // Show all steps again
        var allSteps = document.querySelectorAll('.step');
        allSteps.forEach(function (stepDiv) { stepDiv.style.display = ''; });
        // Reset to step 1 and reload full data (simulate page reload)
        setTimeout(function () {
            // If you have a function to reload all data, call it here. Otherwise, reload the page.
            location.reload();
        }, 400);
    }
    // Add highlight and pulse styles
    var style = document.createElement('style');
    style.innerHTML = `.walkthrough-highlight { box-shadow: 0 0 0 4px #6366f1aa, 0 2px 8px #0002 !important; z-index: 101 !important; position: relative !important; border-radius: 8px !important; }
    .walkthrough-pulse { animation: walkthrough-pulse 1.2s; }
    @keyframes walkthrough-pulse { 0% { box-shadow: 0 0 0 0 #6366f1aa; } 70% { box-shadow: 0 0 0 8px #6366f122; } 100% { box-shadow: 0 0 0 0 #6366f100; } }`;
    document.head.appendChild(style);
    // Show overlay if needed
    if (showWalkthrough) {
        backdrop.style.display = '';
        showStep(step);
    }
    btnNext.onclick = nextStep;
    btnPrev.onclick = prevStep;
    btnFinish.onclick = finishWalkthrough;
    // Dismiss on clicking backdrop (except box)
    backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) finishWalkthrough();
    });

    // Make walkthrough persistent across steps
    window.showWalkthroughBox = function () {
        backdrop.style.display = '';
        showStep(step);
    };
    window.hideWalkthroughBox = function () {
        backdrop.style.display = 'none';
        // Disable dev mode if walkthrough is skipped
        setDevMode(false);
        // Show all steps again
        var allSteps = document.querySelectorAll('.step');
        allSteps.forEach(function (stepDiv) { stepDiv.style.display = ''; });
    };
});
