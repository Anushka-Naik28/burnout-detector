document.addEventListener('DOMContentLoaded', () => {
    const checkBtn = document.getElementById('checkBtn');
    const outputSection = document.getElementById('outputSection');
    
    const burnoutLevelSpan = document.getElementById('burnoutLevel');
    const motivationMessage = document.getElementById('motivationMessage');
    const studyPlanText = document.getElementById('studyPlanText');
    const healthText = document.getElementById('healthText');
    
    // History Elements
    const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
    const historySection = document.getElementById('historySection');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    checkBtn.addEventListener('click', () => {
        const sleepInput = document.getElementById('sleepHours').value;
        const stressInput = document.getElementById('stressLevel').value;
        const studyInput = document.getElementById('studyHours').value;
        const daysInput = document.getElementById('daysLeft').value;

        if(!sleepInput || !studyInput || !daysInput) {
            alert('Please fill out all fields to get an accurate recommendation.');
            return;
        }

        const sleep = parseFloat(sleepInput) || 0;
        const stress = parseInt(stressInput) || 5;
        const study = parseFloat(studyInput) || 0;
        const days = parseInt(daysInput) || 0;
        const apiKey = document.getElementById('apiKey').value.trim();

        const levelText = calculateBurnout(sleep, stress, study, days);
        
        // Save to History
        saveToHistory({ sleep, stress, study, days, level: levelText });
        
        // Fetch AI Insight if API key is provided
        fetchGeminiAdvice(sleep, stress, study, levelText, apiKey);
        
        outputSection.classList.remove('hidden');
        
        // Let animation play, scroll if necessary shortly after
        setTimeout(() => {
            outputSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    });

    function calculateBurnout(sleep, stress, study, days) {
        let score = 0;
        
        // User specified logic rules
        if (sleep < 5) score += 2;         // increase burnout score
        if (stress > 7) score += 4;       // increase burnout score significantly
        if (study > 8) score += 2;        // increase burnout score
        if (days < 2) score += 2;         // increase urgency

        let level = '';
        let levelClass = '';
        let studyHoursRecommended = '';
        let breaksRecommended = '';

        if (score <= 3) {
            level = 'Low \uD83D\uDE0A';
            levelClass = 'badge-low';
            motivationMessage.innerText = `"You're crushing it! Channel this great energy into getting things done today."`;
            studyHoursRecommended = (study > 0 && study <= 8) ? study : '6\u20137';
            breaksRecommended = 'Make sure to take short 5-10 minute restorative breaks every hour to maintain this good pace.';
            
            studyPlanText.innerText = `You're in a great spot! I safely recommend maintaining ${studyHoursRecommended} productive hours today. ${breaksRecommended}`;
        } else if (score <= 6) {
            level = 'Medium \uD83D\uDE2C';
            levelClass = 'badge-medium';
            motivationMessage.innerText = `"You're doing great, but remember that pacing yourself is the secret to long-term success."`;
            studyHoursRecommended = '4\u20135';
            breaksRecommended = 'I highly recommend structured 15-minute breaks every 45 minutes.';
            
            studyPlanText.innerText = `Let's dial it back slightly to prevent burnout. Try to study ${studyHoursRecommended} hours today. ${breaksRecommended} Focus only on high-priority topics.`;
        } else {
            level = 'High \uD83D\uDEA8';
            levelClass = 'badge-high';
            motivationMessage.innerText = `"It's perfectly okay to feel overwhelmed. Please give yourself permission to step back and just breathe today."`;
            studyHoursRecommended = '2\u20133 max';
            breaksRecommended = 'You need frequent 20-minute breaks every 30 minutes of deep work.';
            
            studyPlanText.innerText = `Your burnout risk is currently very high. Please study for ${studyHoursRecommended} hours today. ${breaksRecommended}`;
        }

        // Dynamic Wellness Tips
        let healthPlan = [];
        
        if (sleep < 5) {
            healthPlan.push(`Your sleep is critically low (${sleep} hrs). Getting 7-8 hours tonight is non-negotiable for memory consolidation.`);
        } else if (sleep < 7) {
            healthPlan.push(`You could use a bit more rest than your ${sleep} hours. Try stepping away from screens 30 mins earlier tonight.`);
        } else {
            healthPlan.push(`Excellent job getting ${sleep} hours of sleep! That's a great foundation.`);
        }

        if (stress > 7) {
            healthPlan.push(`Your stress levels are elevated (${stress}/10). I strongly advise immediate relaxation exercises\u2014try a 10-minute guided meditation or deep breathing.`);
        } else if (stress > 4) {
            healthPlan.push(`Since your stress is moderate (${stress}/10), make sure you carve out time for a relaxing hobby later today.`);
        }

        healthPlan.push("Don't forget to keep a water bottle nearby and stay hydrated!");

        healthText.innerText = healthPlan.join(' ');


        burnoutLevelSpan.innerText = level;
        burnoutLevelSpan.className = `badge ${levelClass}`;
        
        return level; // Return the text label for Gemini Prompt
    }

    async function fetchGeminiAdvice(sleep, stress, study, level, apiKey) {
        const aiInsightCard = document.getElementById('aiInsightCard');
        const aiInsightText = document.getElementById('aiInsightText');
        
        if (!apiKey) {
            aiInsightCard.style.display = 'none';
            return;
        }
        
        aiInsightCard.style.display = 'block';
        aiInsightText.innerHTML = '<i>Thinking...</i>';

        // Extract raw text from level string (e.g., 'Low 😊' -> 'Low')
        const cleanLevel = level.split(' ')[0];

        const prompt = `User has ${stress}/10 stress, ${sleep} hours of sleep, ${study} study hours, burnout level is ${cleanLevel}. Give helpful student advice. Keep it under 3 sentences.`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates.length > 0) {
                const advice = data.candidates[0].content.parts[0].text;
                // Parse basic markdown to HTML for better rendering
                aiInsightText.innerHTML = advice.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
            } else {
                aiInsightText.innerText = "No advice returned from AI.";
            }

        } catch (error) {
            console.error("Gemini API Error:", error);
            aiInsightText.innerText = "Couldn't load AI insight. Please check your API key or network connection.";
        }
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
            return;
        }

        history.forEach(item => {
            const cleanLevel = item.level.split(' ')[0]; // E.g., 'Low 😊' -> 'Low'
            let levelColor = 'var(--text-muted)';
            if (cleanLevel === 'Low') levelColor = 'var(--low-risk)';
            if (cleanLevel === 'Medium') levelColor = 'var(--medium-risk)';
            if (cleanLevel === 'High') levelColor = 'var(--high-risk)';

            const li = document.createElement('div');
            li.className = 'history-item';
            li.style.borderLeftColor = levelColor;
            
            li.innerHTML = `
                <div class="history-item-header">
                    <span>Result: <span style="color: ${levelColor}">${item.level}</span></span>
                    <span class="history-item-date">${item.date}</span>
                </div>
                <div class="history-item-details">
                    🛌 ${item.sleep}h sleep &nbsp;|&nbsp; 🧠 ${item.stress}/10 stress &nbsp;|&nbsp; 🎯 ${item.study}h study
                </div>
            `;
            historyList.appendChild(li);
        });
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

});
