import { getBurnoutScoreAndLevel, getAiInsights, escapeHTML } from './logic.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Cached DOM Elements (Ensures fast response time by eliminating redundant DOM parsing) ---
    const checkBtn = document.getElementById('checkBtn');
    const outputSection = document.getElementById('outputSection');
    const burnoutLevelSpan = document.getElementById('burnoutLevel');
    const motivationMessage = document.getElementById('motivationMessage');
    const studyPlanText = document.getElementById('studyPlanText');
    const healthText = document.getElementById('healthText');
    const errorAlert = document.getElementById('errorAlert');
    const aiInsightCard = document.getElementById('aiInsightCard');
    const aiInsightText = document.getElementById('aiInsightText');
    const burnoutForm = document.getElementById('burnoutForm');
    
    // Inputs
    const sleepInputEl = document.getElementById('sleepHours');
    const stressInputEl = document.getElementById('stressLevel');
    const studyInputEl = document.getElementById('studyHours');
    const daysInputEl = document.getElementById('daysLeft');
    const apiKeyInputEl = document.getElementById('apiKey');

    // History Elements
    const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
    const historySection = document.getElementById('historySection');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const dashboardTrend = document.getElementById('dashboardTrend');

    // UI logic continues...
    
    // UI Notification Helper
    const errorAlert = document.getElementById('errorAlert');
    function showError(message) {
        errorAlert.innerText = `⚠️ ${message}`;
        errorAlert.style.display = 'block';
    }

    function hideError() {
        if (errorAlert.style.display !== 'none') {
            errorAlert.style.display = 'none';
        }
    }

    burnoutForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent page reload on form submit
        
        hideError();
        
        const sleepInput = sleepInputEl.value.trim();
        const stressInput = stressInputEl.value.trim();
        const studyInput = studyInputEl.value.trim();
        const daysInput = daysInputEl.value.trim();
        const apiKey = apiKeyInputEl.value.trim();

        // 1. Validate Empty Strings
        if(!sleepInput || !studyInput || !daysInput) {
            showError('Please fill out all numerical fields (Sleep, Study, Days).');
            return;
        }

        // 2. Parse Floats
        let sleep = parseFloat(sleepInput);
        let stress = parseInt(stressInput) || 5;
        let study = parseFloat(studyInput);
        let days = parseInt(daysInput);

        // 3. Validate unrealistic/negative bounds
        if (isNaN(sleep) || sleep < 0 || sleep > 24) {
            showError('Sleep hours must be between 0 and 24.');
            return;
        }
        if (isNaN(study) || study < 0 || study > 24) {
            showError('Study hours must be between 0 and 24.');
            return;
        }
        if (isNaN(days) || days < 0 || days > 3650) {
            showError('Days to deadline must be a valid positive number.');
            return;
        }

        // 4. Force clamp stress to 1-10 to prevent manual overrides
        stress = Math.min(Math.max(stress, 1), 10);

        // Calculate numeric raw score for historical trend plotting
        const { score } = getBurnoutScoreAndLevel(sleep, stress, study, days);
        const levelText = calculateBurnout(sleep, stress, study, days);
        
        // Save to History
        saveToHistory({ sleep, stress, study, days, level: levelText, score });
        
        // Fetch AI Insight Pipeline
        if (apiKey) {
            aiInsightCard.style.display = 'block';
            aiInsightText.innerHTML = '<i>Thinking...</i>';
            const cleanLevel = levelText.split(' ')[0]; // E.g., 'Low 😊' -> 'Low'
            
            getAiInsights(sleep, stress, study, cleanLevel, apiKey)
                .then(advice => {
                    aiInsightText.innerHTML = advice;
                })
                .catch(err => {
                    aiInsightText.innerText = err.message;
                });
        } else {
            aiInsightCard.style.display = 'none';
        }
        
        outputSection.classList.remove('hidden');
        
        // Let animation play, scroll if necessary shortly after
        setTimeout(() => {
            outputSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    });

    // --- DOM Update Function ---

    // --- DOM Update Function ---
    function calculateBurnout(sleep, stress, study, days) {
        const { score, baseLevel } = getBurnoutScoreAndLevel(sleep, stress, study, days);

        let level = '';
        let levelClass = '';
        let studyHoursRecommended = '';
        let breaksRecommended = '';

        if (baseLevel === 'Low') {
            level = 'Low \uD83D\uDE0A';
            levelClass = 'badge-low';
            motivationMessage.innerText = `"Your academic stamina is strong right now! Let's optimize this momentum to tackle your hardest assignments."`;
            studyHoursRecommended = (study > 0 && study <= 8) ? study : '6\u20137';
            breaksRecommended = 'Make sure to take 5-10 minute restorative breaks every hour to prevent cognitive fatigue.';
            
            studyPlanText.innerText = `You have high capacity today. I safely recommend maintaining ${studyHoursRecommended} productive hours. Focus on deep-work tasks first. ${breaksRecommended}`;
        } else if (baseLevel === 'Medium') {
            level = 'Medium \uD83D\uDE2C';
            levelClass = 'badge-medium';
            motivationMessage.innerText = `"You're pushing hard, but academic burnout is creeping in. We need to restructure your study plan to protect your grades and sanity."`;
            studyHoursRecommended = '4\u20135';
            breaksRecommended = 'I highly recommend structured 15-minute breaks every 45 minutes to let your brain digest the material.';
            
            studyPlanText.innerText = `Let's dial it back to prevent a complete crash. Try to cap study time to ${studyHoursRecommended} hours today. ${breaksRecommended} Only study high-priority exam topics today.`;
        } else {
            level = 'High \uD83D\uDEA8';
            levelClass = 'badge-high';
            motivationMessage.innerText = `"Danger zone: Your brain is overloaded. Forcing yourself to study right now will severely harm memory retention and invite panic."`;
            studyHoursRecommended = '2\u20133 max';
            breaksRecommended = 'You need frequent 20-minute breaks every 30 minutes to reduce academic anxiety.';
            
            studyPlanText.innerText = `Stop pushing. Please limit study time strictly to ${studyHoursRecommended} hours today. ${breaksRecommended} Triage your assignments; drop everything except immediate deadlines.`;
        }

        // Dynamic Wellness Tips
        let healthPlan = [];
        
        if (sleep < 5) {
            healthPlan.push(`Critically low sleep (${sleep} hrs) destroys your ability to hold focus in lectures. Getting 8 hours tonight is academically non-negotiable for memory consolidation.`);
        } else if (sleep < 7) {
            healthPlan.push(`Your sleep debt (${sleep} hrs) is lowering your test-taking speed. Try stepping away from screens 30 mins earlier tonight.`);
        } else {
            healthPlan.push(`Excellent job getting ${sleep} hours of sleep! That's a massive competitive advantage for your academic performance.`);
        }

        if (stress > 7) {
            healthPlan.push(`Your academic stress is alarming (${stress}/10). I strongly advise a 15-minute walk or meditation right now to lower cortisol so you can actually absorb what you read.`);
        } else if (stress > 4) {
            healthPlan.push(`Since your class stress is moderate (${stress}/10), make sure you carve out time for a relaxing, non-academic hobby later today.`);
        }

        healthPlan.push("Don't forget to keep a water bottle nearby and stay hydrated!");

        healthText.innerText = healthPlan.join(' ');


        burnoutLevelSpan.innerText = level;
        burnoutLevelSpan.className = `badge ${levelClass}`;
        
        return level; // Return the text label for Gemini Prompt
    }

    // --- History Management ---
    function saveToHistory(record) {
        // Add timestamp
        record.date = new Date().toLocaleString();
        
        // Get existing history or initialize
        let history = JSON.parse(localStorage.getItem('burnoutHistory')) || [];
        
        // Add new record at the beginning
        history.unshift(record);
        
        // Keep only last 10 records to prevent storage bloat
        if (history.length > 10) history = history.slice(0, 10);
        
        localStorage.setItem('burnoutHistory', JSON.stringify(history));
        
        // Re-render if section is open
        if (!historySection.classList.contains('hidden')) {
            renderHistory();
        }
    }

    function renderHistory() {
        let history = JSON.parse(localStorage.getItem('burnoutHistory')) || [];
        
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1rem;">No history yet. Calculate your burnout to save a record!</div>';
            dashboardTrend.innerHTML = '<em>Track another session to see your trend!</em>';
            return;
        }

        // Trend calculation
        if (history.length >= 2) {
            const currentScore = history[0].score !== undefined ? history[0].score : 0;
            const previousScore = history[1].score !== undefined ? history[1].score : 0;
            
            if (currentScore < previousScore) {
                dashboardTrend.innerHTML = '📈 <strong style="color: var(--low-risk);">Trend: Improving!</strong> Your burnout risk is decreasing.';
            } else if (currentScore > previousScore) {
                dashboardTrend.innerHTML = '📉 <strong style="color: var(--high-risk);">Trend: Worsening.</strong> Please pace yourself carefully.';
            } else {
                dashboardTrend.innerHTML = '➖ <strong>Trend: Stable.</strong> Keep monitoring your daily habits.';
            }
        } else {
            dashboardTrend.innerHTML = '<em>Track another session to see your trend!</em>';
        }

        // Optimize: Use DocumentFragment to batch DOM inserts and highly reduce paint reflows
        const fragment = document.createDocumentFragment();

        history.forEach(item => {
            const cleanLevel = item.level.split(' ')[0]; 
            let levelColor = 'var(--text-muted)';
            if (cleanLevel === 'Low') levelColor = 'var(--low-risk)';
            else if (cleanLevel === 'Medium') levelColor = 'var(--medium-risk)';
            else if (cleanLevel === 'High') levelColor = 'var(--high-risk)';

            const li = document.createElement('div');
            li.className = 'history-item';
            li.style.borderLeftColor = levelColor;
            
            li.innerHTML = `
                <div class="history-item-header">
                    <span>Result: <span style="color: ${levelColor}">${escapeHTML(item.level)}</span></span>
                    <span class="history-item-date">${escapeHTML(item.date)}</span>
                </div>
                <div class="history-item-details">
                    🛌 ${Number(item.sleep)}h sleep &nbsp;|&nbsp; 🧠 ${Number(item.stress)}/10 stress &nbsp;|&nbsp; 🎯 ${Number(item.study)}h study
                </div>
            `;
            fragment.appendChild(li);
        });

        // Single DOM repaint
        historyList.appendChild(fragment);
    }

    toggleHistoryBtn.addEventListener('click', () => {
        historySection.classList.toggle('hidden');
        if (!historySection.classList.contains('hidden')) {
            renderHistory();
            toggleHistoryBtn.innerText = '🕒 Hide History';
            // Scroll to show history
            setTimeout(() => {
                historySection.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        } else {
            toggleHistoryBtn.innerText = '🕒 View History';
        }
    });

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your daily records?')) {
            localStorage.removeItem('burnoutHistory');
            renderHistory();
        }
    });

    // --- Testing Suite ---
    function runTests() {
        console.log("=== Running Burnout Logic Tests ===");
        let passed = 0;
        let total = 0;

        function assertTest(testName, sleep, stress, study, days, expectedLevel) {
            total++;
            const result = getBurnoutScoreAndLevel(sleep, stress, study, days);
            if (result.baseLevel === expectedLevel) {
                console.log(`✅ TEST PASSED: ${testName} -> Got ${result.baseLevel}`);
                passed++;
            } else {
                console.error(`❌ TEST FAILED: ${testName} -> Expected ${expectedLevel}, but got ${result.baseLevel} (Score: ${result.score})`);
            }
        }

        // Test Case 1: High stress + low sleep -> Expect High burnout
        // Sleep < 5 -> +2, Stress > 7 -> +4. Score = 6. With study > 8 (+2) = 8. Level: High.
        assertTest("High stress + Low sleep + Heavy Study", 4, 9, 10, 5, "High");

        // Test Case 2: Low stress + good sleep -> Expect Low burnout
        // Sleep = 8 -> +0, Stress = 3 -> +0, Study = 4 -> +0, Days = 10 -> +0. Score = 0. Level: Low.
        assertTest("Low stress + Good sleep", 8, 3, 4, 10, "Low");

        // Test Case 3: Medium scenario (Average sleep, high stress)
        // Sleep = 6 -> +0, Stress = 8 -> +4, Study = 5 -> +0, Days = 5 -> +0. Score = 4. Level: Medium.
        assertTest("Average sleep + High stress", 6, 8, 5, 5, "Medium");

        // Test Case 4: Urgent deadline impact
        // Sleep = 8. Stress = 4. Study = 5. Days = 1 -> +2. Score = 2. Level: Low. (Deadline doesn't immediately force High burnout if everything else is fine)
        assertTest("Good habits + Urgent deadline", 8, 4, 5, 1, "Low");

        console.log(`=== Tests Complete: ${passed}/${total} Passed ===`);
        alert(`Tests Complete! Passed ${passed}/${total}. Check browser console for full breakdown.`);
    }

    // Expose testing function globally to a hidden UI button or console
    window.runBurnoutTests = runTests;
});
