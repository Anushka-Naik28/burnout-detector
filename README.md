# 🧠 AI Burnout Detector & Smart Study Assistant

A lightweight, intelligent web application designed to help students analyze their workload, prevent academic burnout, and receive personalized, AI-driven wellness advice. 

---

## ⚠️ The Problem
Student burnout is at an all-time high. The pressure of managing multiple deadlines, maintaining academic performance, and balancing personal life often leads to severe stress and sleep deprivation. Students typically struggle to identify when they are pushing themselves too far until they hit a wall.

## 💡 The Solution
The **AI Burnout Detector** serves as an early warning system. By analyzing critical lifestyle data points (sleep, stress levels, study hours, and deadline proximity), it instantly calculates a **Burnout Risk Score**. Then, it provides dynamic, actionable study plans and health recommendations designed to optimize productivity without compromising well-being.

---

## ✨ Key Features
- **Smart Scoring Heuristics**: Dynamically shifts burnout risk levels (Low, Medium, High) based on real-world inputs utilizing customizable algorithms.
- **Dynamic Action Plans**: Recommends safe study hour limits and structured break paradigms (like Pomodoro) adjusted specifically for your current burnout tier.
- **✨ Gemini AI Integration**: Supercharged by the Google Gemini API, capable of reading your specific data context and formulating completely unique, highly personalized empathetic wellness tips. 
- **Persisted History Logs**: Built-in 10-day local storage tracks historical entries automatically, allowing you to easily view trends in your stress/sleep cycles without needing a complex backend.
- **Premium Glassmorphic UI**: Beautiful, interactive front-end designed with soft gradients, floating cards, custom CSS badges, and staggered CSS animations tailored for premium aesthetics.

---

## 🛠 Tech Stack
This project runs entirely client-side, enabling robust, fast, and privacy-conscious execution.
- **HTML5**: Semantic document structuring.
- **CSS3 / Vanilla CSS**: Zero external frameworks. Custom variables, glassmorphism filters, flexbox, and CSS animations.
- **JavaScript (Vanilla)**: Handles the algorithms, DOM manipulations, UI state toggles, and browser `localStorage` persistence.
- **Google Gemini API**: A powerful generative AI integration utilizing native `fetch` over REST API.

---

## 🚀 How It Works
1. **Input Data**: Enter your recent sleep duration, your current stress out of 10, your goal study hours, and how far away your main deadline is.
2. (Optional) Provide a **Gemini API Key** in the designated field if you want to unlock generative AI insights.
3. Click **"Check Burnout Level"**.
4. **Analyze**: The app executes its core logic rules to categorize your risk.
5. **Review Recommendations**: The system gracefully presents your Risk Badge, Suggested Study Plan limits, core Health Recommendations, and your personalized Gemini advice.
6. **Track Over Time**: Click **"View History"** at the bottom of the page to review your past inputs and track improvements or danger zones over multiple days.

---

## 🔮 Future Improvements
- **Data Visualization**: Adding `Chart.js` to vividly plot stress and sleep correlations against burnout severity over 30 days.
- **Push Notifications**: Integrating a service worker or Web Notifications API to send hydration or screen-break reminders during long study sessions.
- **Backend Infrastructure**: Shifting `localStorage` to a Firebase or Supabase cloud backend for seamless cross-device synchronization and secure API key vaulting.
- **Calendar Integrations**: Directly syncing with Google Calendar/Apple Calendar to intelligently read and manipulate study blocks dynamically.
