/**
 * logic.js
 * Contains the core business logic, API calls, and algorithmic calculations for the 
 * Burnout Detector application, successfully separated from the DOM UI manipulation.
 */

/**
 * Sanitizes input text to prevent XSS (Cross-Site Scripting) injection attacks.
 * Converts dangerous syntax characters into safe HTML entities.
 * 
 * @param {string} str - The raw string to sanitize
 * @returns {string} The safely escaped HTML string
 */
export function escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

/**
 * Calculates the total burnout score and risk level based on rigorous heuristics.
 * 
 * @param {number} sleep - Hours of sleep obtained last night (0-24)
 * @param {number} stress - Self-reported stress level (scaled 1-10)
 * @param {number} study - Hours intended to study today (0-24)
 * @param {number} days - Days remaining until the nearest major deadline
 * @returns {Object} An object containing the calculated { score, baseLevel }
 */
export function getBurnoutScoreAndLevel(sleep, stress, study, days) {
    let score = 0;
    
    // Core Logical Heuristics
    if (sleep < 5) score += 2;         // Severe sleep deprivation highly impacts burnout
    if (stress > 7) score += 4;        // High stress is the heaviest leading indicator
    if (study > 8) score += 2;         // Attempting massive study loads adds to risk
    if (days < 2) score += 2;          // Imminent deadlines create high urgency pressure

    let baseLevel = '';
    if (score <= 3) baseLevel = 'Low';
    else if (score <= 6) baseLevel = 'Medium';
    else baseLevel = 'High';

    return { score, baseLevel };
}

/**
 * Integrates with Google Gemini to generate highly personalized academic interventions.
 *
 * @param {number} sleep - Hours of sleep obtained
 * @param {number} stress - Self-reported stress level (1-10)
 * @param {number} study - Intended study hours
 * @param {string} cleanLevel - Calculated burnout severity (Low, Medium, High)
 * @param {string} apiKey - The provided Google Gemini API Key
 * @returns {Promise<string|null>} The formatted AI advice HTML, or null if API Key is missing.
 */
export async function getAiInsights(sleep, stress, study, cleanLevel, apiKey) {
    if (!apiKey) return null;

    const prompt = `Act as an expert academic advisor. The student user has an academic stress level of ${stress}/10, slept only ${sleep} hours last night, and plans to formally study ${study} hours today. Their calculated student burnout level is ${cleanLevel}. Provide highly specific, actionable advice to help them optimize their study plan and prevent academic burnout. Do not give generic health tips; tie everything directly to improving grades safely. Keep it under 3 concise sentences.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0) {
            const advice = data.candidates[0].content.parts[0].text;
            
            // Sanitize raw output to prevent DOM-based XSS attacks before formatting markdown
            const safeAdvice = escapeHTML(advice);
            
            // Parse basic markdown to HTML line breaks and bold tags
            return safeAdvice.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        } 
        
        return "No actionable advice returned from AI.";
        
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Couldn't load AI insight. Please check your API key or network connection.");
    }
}
