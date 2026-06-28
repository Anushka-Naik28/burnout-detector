import { getBurnoutScoreAndLevel, getAiInsights, getChatResponse, escapeHTML } from './logic.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Cached DOM Elements ---
    const burnoutForm = document.getElementById('burnoutForm');
    const checkBtn = document.getElementById('check-btn');
    const outputSection = document.getElementById('outputSection');
    const errorAlert = document.getElementById('errorAlert');
    
    // Inputs
    const sleepInput = document.getElementById('sleep');
    const sleepVal = document.getElementById('sleep-val');
    const sleepFill = document.getElementById('sleep-fill');
    
    const stressInput = document.getElementById('stress');
    const stressVal = document.getElementById('stress-val');
    const stressFill = document.getElementById('stress-fill');
    
    const studyInput = document.getElementById('study');
    const deadlineInput = document.getElementById('deadline');
    const apiKeyInput = document.getElementById('api-key');
    const keyToggleBtn = document.getElementById('key-toggle');

    // Outputs
    const resultsHeader = document.getElementById('results-header');
    const scoreArc = document.getElementById('score-arc');
    const scoreNum = document.getElementById('score-num');
    const riskBadge = document.getElementById('risk-badge');
    const riskSubtitle = document.getElementById('risk-subtitle');
    
    const statSleep = document.getElementById('stat-sleep');
    const statStress = document.getElementById('stat-stress');
    const statStudy = document.getElementById('stat-study');
    const statPom = document.getElementById('stat-pom');
    
    const studyPlanItems = document.getElementById('study-plan-items');
    const pomRow = document.getElementById('pom-row');
    const healthItems = document.getElementById('health-items');
    
    // AI Section
    const aiInsightText = document.getElementById('ai-insight-text');
    
    // AI Chat Elements
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');

    // History Elements
    const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
    const historyPanel = document.getElementById('historyPanel');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const dashboardTrend = document.getElementById('dashboardTrend');
    const miniChartWrap = document.getElementById('mini-chart-wrap');
    const historyList = document.getElementById('history-list');

    // Toast Element
    const toast = document.getElementById('toast');

    // State Variables
    let historyOpen = false;
    let chatHistory = [];
    let currentMetrics = null; // Store current run info for chat context

    // ==========================================================================
    // RANGE INPUTS HANDLERS
    // ==========================================================================
    
    function updateSleepSlider() {
        const v = parseFloat(sleepInput.value);
        sleepVal.innerHTML = `${v}<span style="font-size:12px;font-weight:400;color:var(--text-dim)">h</span>`;
        const pct = ((v - 2) / 10) * 100;
        sleepFill.style.width = pct + '%';
        const color = v >= 7 ? 'var(--low-risk)' : v >= 5 ? 'var(--med-risk)' : 'var(--high-risk)';
        sleepFill.style.background = color;
    }

    function updateStressSlider() {
        const v = parseInt(stressInput.value);
        stressVal.innerHTML = `${v}<span style="font-size:12px;font-weight:400;color:var(--text-dim)">/10</span>`;
        const pct = ((v - 1) / 9) * 100;
        stressFill.style.width = pct + '%';
        const color = v <= 3 ? 'var(--low-risk)' : v <= 6 ? 'var(--med-risk)' : 'var(--high-risk)';
        stressFill.style.background = color;
    }

    sleepInput.addEventListener('input', updateSleepSlider);
    stressInput.addEventListener('input', updateStressSlider);
    
    // Initial slider display updates
    updateSleepSlider();
    updateStressSlider();

    // Password Toggle
    keyToggleBtn.addEventListener('click', () => {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            keyToggleBtn.textContent = 'Hide';
        } else {
            apiKeyInput.type = 'password';
            keyToggleBtn.textContent = 'Show';
        }
    });

    // ==========================================================================
    // NOTIFICATION HELPERS
    // ==========================================================================
    
    function showError(message) {
        errorAlert.innerText = `⚠️ ${message}`;
        errorAlert.style.display = 'block';
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function hideError() {
        errorAlert.style.display = 'none';
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2800);
    }

    // ==========================================================================
    // BURNOUT CALCULATION ROUTINE
    // ==========================================================================

    function calculateDynamicScore(sleep, stress, study, deadline) {
        // Run core algorithm
        const { score: rawScore, baseLevel } = getBurnoutScoreAndLevel(sleep, stress, study, deadline);
        
        // Let's create a detailed score out of 100 for visual richness
        let visualScore = 0;
        
        // Sleep (max 35 points)
        if (sleep < 4) visualScore += 35;
        else if (sleep < 5) visualScore += 28;
        else if (sleep < 6) visualScore += 20;
        else if (sleep < 7) visualScore += 12;
        else if (sleep < 8) visualScore += 4;
        
        // Stress (max 30 points)
        visualScore += Math.round((stress / 10) * 30);

        // Study Hours (max 20 points)
        if (study > 14) visualScore += 20;
        else if (study > 10) visualScore += 15;
        else if (study > 8) visualScore += 10;
        else if (study > 6) visualScore += 5;
        else visualScore += 2;

        // Deadline urgency (max 15 points)
        if (deadline <= 1) visualScore += 15;
        else if (deadline <= 2) visualScore += 12;
        else if (deadline <= 3) visualScore += 8;
        else if (deadline <= 5) visualScore += 5;
        else if (deadline <= 7) visualScore += 2;

        const scoreVal = Math.min(100, visualScore);
        
        // Risk Tier mapping (Low < 35, Medium < 65, High >= 65)
        let tier = 'low';
        if (scoreVal >= 65) tier = 'high';
        else if (scoreVal >= 35) tier = 'med';

        return { score: scoreVal, tier };
    }

    // ==========================================================================
    // RECOMMENDATION RENDERING
    // ==========================================================================

    function getStudyPlan(tier, safeHours, pomPlan) {
        return [
            `Max study time limit: ${safeHours}h today`,
            `${pomPlan.work}-min work blocks, ${pomPlan.breakShort}-min short breaks`,
            `${pomPlan.breakLong}-min long break after every ${pomPlan.cycle} sessions`,
            tier === 'high' ? 'Avoid learning new material — focus on review and summaries only' : 'Prioritize high-impact assignments first'
        ];
    }

    function getHealthRecs(tier, sleep) {
        const base = [
            'Drink at least 2.5L of water throughout the day to support brain function',
            'Take a 10-min active physical stretch between study sessions',
            'Avoid digital screens 45 minutes before sleep'
        ];
        if (tier === 'low') {
            return [...base, "Maintain your current sleep schedule — it's working well"];
        }
        if (tier === 'med') {
            return [
                `Aim for at least ${Math.max(7, sleep + 1)}h of sleep tonight`,
                'Eat a regular, nutrient-dense meal — do not skip food to study',
                ...base.slice(0, 2),
                'Try 5 minutes of mindful deep breathing before commencing sessions'
            ];
        }
        return [
            `CRITICAL PRIORITY: Sleep at least ${Math.max(8, sleep + 2)}h tonight — non-negotiable`,
            'Do not study past 10:00 PM under any circumstance tonight',
            'Eat a nourishing snack/meal every 3 hours to stabilize glucose levels',
            'Communicate how you feel to a classmate or mentor — do not isolate yourself',
            'Triage assignments and consider requesting deadline extensions'
        ];
    }

    function renderRecs(items, container, dotClass) {
        container.innerHTML = items.map(item => `
            <div class="rec-item">
                <div class="rec-dot ${dotClass || ''}"></div>
                <span>${item}</span>
            </div>
        `).join('');
    }

    function renderPomodoroTimeline(pomPlan, numSessions) {
        pomRow.innerHTML = '';
        if (numSessions <= 0) {
            pomRow.innerHTML = '<em style="font-size:11px;color:var(--text-dim)">No study sessions recommended today.</em>';
            return;
        }

        for (let i = 0; i < numSessions; i++) {
            // Work block
            const w = document.createElement('div');
            w.className = 'pom-block work';
            pomRow.appendChild(w);
            
            // Break block
            if ((i + 1) % pomPlan.cycle === 0) {
                const b = document.createElement('div');
                b.className = 'pom-block break-long';
                b.style.flex = '0.6';
                pomRow.appendChild(b);
            } else if (i < numSessions - 1) {
                const b = document.createElement('div');
                b.className = 'pom-block break-short';
                b.style.flex = '0.3';
                pomRow.appendChild(b);
            }
        }
    }

    function animateRadialScore(score, tier) {
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (score / 100) * circumference;
        const color = tier === 'low' ? 'var(--low-risk)' : tier === 'med' ? 'var(--med-risk)' : 'var(--high-risk)';
        
        scoreArc.style.stroke = color;
        // Small delay to trigger CSS transition
        setTimeout(() => {
            scoreArc.style.strokeDashoffset = offset;
        }, 80);

        // Count-up numbers
        let current = 0;
        const duration = 1200;
        const startTime = performance.now();

        function step(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            scoreNum.textContent = Math.round(ease * score);
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }
        requestAnimationFrame(step);
    }

    // ==========================================================================
    // CORE CHECK HANDLER
    // ==========================================================================

    burnoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideError();

        // Get Input Values
        const sleep = parseFloat(sleepInput.value);
        const stress = parseInt(stressInput.value);
        const study = parseFloat(studyInput.value);
        const deadline = parseInt(deadlineInput.value);
        const apiKey = apiKeyInput.value.trim();

        // Validation
        if (isNaN(study) || study < 0 || study > 24) {
            showError('Please enter study hours between 0 and 24.');
            return;
        }

        // Calculate score
        const { score, tier } = calculateDynamicScore(sleep, stress, study, deadline);

        // Save current metrics to state for chat context
        currentMetrics = { sleep, stress, study, deadline, score, tier };

        // 1. Render Results Header
        resultsHeader.className = 'results-header ' + tier;
        animateRadialScore(score, tier);
        
        const tierLabel = tier === 'low' ? 'Low Risk' : tier === 'med' ? 'Medium Risk' : 'High Risk';
        riskBadge.className = 'risk-badge ' + tier;
        riskBadge.innerHTML = `<span></span>${tierLabel}`;

        const tierSub = tier === 'low' ? `You're managing your workload well. Keep protecting your recovery.` 
                      : tier === 'med' ? `Warning indicators present. Restructure your schedule to prevent a crash.` 
                      : `Critical burnout risk. Rest and immediate decompression is highly advised.`;
        riskSubtitle.textContent = tierSub;

        // 2. Render Statistics Grid
        statSleep.textContent = sleep + 'h';
        statStress.textContent = stress + '/10';
        
        const safeHours = tier === 'low' ? Math.min(study, 8) : tier === 'med' ? Math.min(study, 5) : Math.min(study, 3);
        statStudy.textContent = safeHours + 'h';

        const numPoms = Math.round((safeHours * 60) / 30);
        statPom.textContent = numPoms;

        // 3. Render Study Plan & Health Recs
        const pomPlan = tier === 'low' ? { work: 25, breakShort: 5, breakLong: 20, cycle: 4 }
                       : tier === 'med' ? { work: 20, breakShort: 7, breakLong: 25, cycle: 3 }
                       : { work: 15, breakShort: 10, breakLong: 30, cycle: 2 };

        renderRecs(getStudyPlan(tier, safeHours, pomPlan), studyPlanItems, 'amber');
        renderPomodoroTimeline(pomPlan, Math.min(numPoms, 8));
        renderRecs(getHealthRecs(tier, sleep), healthItems, 'green');

        // 4. Reset Chat Box Context
        chatBox.innerHTML = `<div class="chat-message ai">Hello! I'm your <strong>AI Study Coach</strong>. I've analyzed your burnout score of <strong>${score}/100 (${tierLabel})</strong>. Ask me anything about managing your schedule or stress!</div>`;
        chatHistory = []; // Reset chat history for this run

        // 5. Trigger AI Wellness Intervention Recommendation
        aiInsightText.innerHTML = `<div class="chat-typing"><span></span><span></span><span></span></div>`;
        
        if (apiKey) {
            getAiInsights(sleep, stress, study, tierLabel, apiKey)
                .then(advice => {
                    aiInsightText.innerHTML = advice;
                })
                .catch(err => {
                    aiInsightText.innerHTML = `<span style="color:var(--high-risk)">⚠ API Error:</span> ${err.message}`;
                });
        } else {
            // Display fallback offline advice
            setTimeout(() => {
                aiInsightText.textContent = getFallbackAdvice(tier, sleep, stress, study, safeHours);
            }, 600);
        }

        // Display results block
        outputSection.classList.add('show');
        
        // Scroll into results section
        setTimeout(() => {
            outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);

        // Save history logs
        saveToHistory({ sleep, stress, study, deadline, score, tier });
        showToast('Analysis completed!');
    });

    function getFallbackAdvice(tier, sleep, stress, study, safeHours) {
        if (tier === 'low') {
            return `You're maintaining a healthy balance. Your sleep duration of ${sleep}h offers a solid cognitive base. Try to study smart today by time-blocking your ${safeHours}h task list and protecting your screen-free wind-down time tonight.`;
        }
        if (tier === 'med') {
            return `Your stress levels (${stress}/10) are creeping up. Restricting study to a maximum of ${safeHours}h today is a strategic choice to conserve mental clarity. Prioritize key exams and try to extend your sleep tonight.`;
        }
        return `Your scores indicate severe burnout indicators. Continuing to push under sleep-deprived conditions will damage retention. Please cap your study at ${safeHours}h maximum, notify supportive peers/mentors, and prioritize deep recovery sleep.`;
    }

    // ==========================================================================
    // AI CHATBOT INTERACTION
    // ==========================================================================

    async function handleChatSubmission() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Render user message
        const userMsgEl = document.createElement('div');
        userMsgEl.className = 'chat-message user';
        userMsgEl.textContent = text;
        chatBox.appendChild(userMsgEl);
        chatInput.value = '';
        chatBox.scrollTop = chatBox.scrollHeight;

        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            const aiWarningEl = document.createElement('div');
            aiWarningEl.className = 'chat-message ai';
            aiWarningEl.innerHTML = `<span style="color:var(--med-risk)">💡 Offline Mode:</span> To chat dynamically with me, please enter a Google Gemini API Key in the optional configuration card above.`;
            chatBox.appendChild(aiWarningEl);
            chatBox.scrollTop = chatBox.scrollHeight;
            return;
        }

        // Render typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chat-typing chat-message ai';
        typingIndicator.innerHTML = `<span></span><span></span><span></span>`;
        chatBox.appendChild(typingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        // Background metrics details
        const sleep = currentMetrics ? currentMetrics.sleep : sleepInput.value;
        const stress = currentMetrics ? currentMetrics.stress : stressInput.value;
        const study = currentMetrics ? currentMetrics.study : studyInput.value;
        const tier = currentMetrics ? currentMetrics.tier : 'Unknown';
        const levelLabel = tier === 'low' ? 'Low Risk' : tier === 'med' ? 'Medium' : 'High';

        try {
            const aiResponse = await getChatResponse(chatHistory, text, sleep, stress, study, levelLabel, apiKey);
            
            // Remove typing indicator
            typingIndicator.remove();

            // Render AI reply
            const aiMsgEl = document.createElement('div');
            aiMsgEl.className = 'chat-message ai';
            aiMsgEl.innerHTML = aiResponse;
            chatBox.appendChild(aiMsgEl);

            // Record to conversation history
            chatHistory.push({ role: 'user', text: text });
            chatHistory.push({ role: 'model', text: aiResponse });

        } catch (err) {
            typingIndicator.remove();
            const aiErrorEl = document.createElement('div');
            aiErrorEl.className = 'chat-message ai';
            aiErrorEl.innerHTML = `<span style="color:var(--high-risk)">⚠ Error:</span> ${err.message}`;
            chatBox.appendChild(aiErrorEl);
        }

        chatBox.scrollTop = chatBox.scrollHeight;
    }

    chatSendBtn.addEventListener('click', handleChatSubmission);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleChatSubmission();
        }
    });

    // ==========================================================================
    // HISTORY LOGS MANAGEMENT
    // ==========================================================================

    function saveToHistory(record) {
        record.date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        record.timestamp = Date.now();

        let history = JSON.parse(localStorage.getItem('burnoutHistory')) || [];
        history.unshift(record);

        // Keep last 10 entries max
        if (history.length > 10) {
            history = history.slice(0, 10);
        }

        localStorage.setItem('burnoutHistory', JSON.stringify(history));

        if (historyOpen) {
            renderHistory();
        }
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('burnoutHistory')) || [];
        historyList.innerHTML = '';
        miniChartWrap.innerHTML = '';

        if (history.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 24px; font-size:13px;">No history records found. Perform an analysis above to log stats!</div>';
            dashboardTrend.style.display = 'none';
            return;
        }

        dashboardTrend.style.display = 'block';

        // Trend calculation
        if (history.length >= 2) {
            const currentScore = history[0].score;
            const previousScore = history[1].score;
            if (currentScore < previousScore) {
                dashboardTrend.innerHTML = `📈 <strong style="color:var(--low-risk)">Trend: Improving!</strong> Your burnout risk is decreasing. Keep maintaining these healthy habits.`;
            } else if (currentScore > previousScore) {
                dashboardTrend.innerHTML = `📉 <strong style="color:var(--high-risk)">Trend: Worsening.</strong> Your risk score increased. Please consider scheduling rest.`;
            } else {
                dashboardTrend.innerHTML = `➖ <strong>Trend: Stable.</strong> Your stress and sleep habits remain steady.`;
            }
        } else {
            dashboardTrend.innerHTML = `💡 <strong>Welcome!</strong> Perform one more session check to log details and view score trend lines.`;
        }

        // Render Mini-bar chart
        const chartHeader = document.createElement('div');
        chartHeader.style = 'margin-bottom:8px; font-size: 11px; text-transform: uppercase; color: var(--text-dim); letter-spacing:0.04em;';
        chartHeader.textContent = 'Score Trends (last 10 checks)';
        miniChartWrap.appendChild(chartHeader);

        const miniChart = document.createElement('div');
        miniChart.className = 'mini-chart';

        // Display logs chronologically in the chart (reverse history)
        const chronologicalHistory = [...history].reverse();
        
        chronologicalHistory.forEach(item => {
            const bar = document.createElement('div');
            bar.className = 'mini-bar';
            
            // Max height is 100%
            const heightPct = Math.max(8, item.score);
            bar.style.height = `${heightPct}%`;
            
            const color = item.tier === 'low' ? 'var(--low-risk)' : item.tier === 'med' ? 'var(--med-risk)' : 'var(--high-risk)';
            bar.style.backgroundColor = color;
            bar.style.color = color;
            bar.setAttribute('data-tip', `${item.date}: Score ${item.score}`);
            miniChart.appendChild(bar);
        });

        miniChartWrap.appendChild(miniChart);

        const rangeLabels = document.createElement('div');
        rangeLabels.style = 'margin-top:4px; display:flex; justify-content:space-between; font-size:10px; color:var(--text-dim);';
        rangeLabels.innerHTML = `<span>${chronologicalHistory[0].date}</span><span>${history[0].date}</span>`;
        miniChartWrap.appendChild(rangeLabels);

        // Render history items list
        const fragment = document.createDocumentFragment();
        history.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.style.animationDelay = `${index * 0.03}s`;
            
            const color = item.tier === 'low' ? 'var(--low-risk)' : item.tier === 'med' ? 'var(--med-risk)' : 'var(--high-risk)';
            div.style.borderLeftColor = color;

            const badgeLabel = item.tier === 'low' ? 'Low' : item.tier === 'med' ? 'Medium' : 'High';

            div.innerHTML = `
                <span class="history-item-date">${item.date}</span>
                <span class="history-item-score" style="color: ${color}">${item.score}</span>
                <span class="history-item-vals">🛌 ${item.sleep}h sleep · 🧠 ${item.stress}/10 stress · ${item.study}h goal</span>
                <span class="history-item-badge ${item.tier}">${badgeLabel}</span>
            `;
            fragment.appendChild(div);
        });
        historyList.appendChild(fragment);
    }

    toggleHistoryBtn.addEventListener('click', () => {
        historyOpen = !historyOpen;
        historyPanel.classList.toggle('show', historyOpen);
        
        const textSpan = document.getElementById('history-btn-text');
        const chevron = document.getElementById('history-chevron');
        
        if (historyOpen) {
            textSpan.textContent = 'Hide History';
            chevron.style.transform = 'rotate(180deg)';
            renderHistory();
            setTimeout(() => {
                historyPanel.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        } else {
            textSpan.textContent = 'View History';
            chevron.style.transform = 'none';
        }
    });

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your local workload logs?')) {
            localStorage.removeItem('burnoutHistory');
            renderHistory();
            showToast('Workload logs cleared');
        }
    });

    // ==========================================================================
    // TESTING SUITE
    // ==========================================================================
    
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
                console.error(`❌ TEST FAILED: ${testName} -> Expected ${expectedLevel}, but got ${result.baseLevel} (Raw Score: ${result.score})`);
            }
        }

        // Test Case 1: High stress + low sleep -> Expect High burnout
        assertTest("High stress + Low sleep + Heavy Study", 4, 9, 10, 5, "High");

        // Test Case 2: Low stress + good sleep -> Expect Low burnout
        assertTest("Low stress + Good sleep", 8, 3, 4, 10, "Low");

        // Test Case 3: Medium scenario (Average sleep, high stress)
        assertTest("Average sleep + High stress", 6, 8, 5, 5, "Medium");

        // Test Case 4: Urgent deadline impact
        assertTest("Good habits + Urgent deadline", 8, 4, 5, 1, "Low");

        console.log(`=== Tests Complete: ${passed}/${total} Passed ===`);
        alert(`Tests Complete! Passed ${passed}/${total}. Check browser console for full output.`);
    }

    // Expose tests globally
    window.runBurnoutTests = runTests;
});
