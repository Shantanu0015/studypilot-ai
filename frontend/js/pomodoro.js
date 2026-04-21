// ============================================
// POMODORO TIMER - SMOOTH SVG LOGIC (MANUAL INPUT)
// ============================================

let timerInterval;
let isRunning = false;
let isFocusMode = true;

const timeDisplay = document.getElementById('time-display');
const modeText = document.getElementById('mode-text');
const dashFocusTotalDisplay = document.getElementById('dash-focus-time');
const ringPath = document.getElementById('timer-ring-path');
const manualTimeInput = document.getElementById('manual-time-input');

// svg ring circumference is ~276
const CIRCUMFERENCE = 276;

function getFocusTimeSeconds() {
    let val = parseInt(manualTimeInput ? manualTimeInput.value : 25);
    if(isNaN(val) || val <= 0) val = 25;
    return val * 60;
}

function getBreakTimeSeconds() {
    return 5 * 60; 
}

let timeLeft = getFocusTimeSeconds();
let currentTotalTime = timeLeft;

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

window.applyManualTime = function() {
    if (isRunning || !isFocusMode) return;
    timeLeft = getFocusTimeSeconds();
    currentTotalTime = timeLeft;
    updateDisplay();
};

function updateDisplay() {
    if (!timeDisplay) return;
    timeDisplay.textContent = formatTime(timeLeft);
    
    // Update SVG Ring
    if (ringPath) {
        // avoid divide by zero
        const progress = currentTotalTime > 0 ? (timeLeft / currentTotalTime) : 0;
        // offset goes from 0 (full) to CIRCUMFERENCE (empty)
        const offset = CIRCUMFERENCE - (progress * CIRCUMFERENCE);
        ringPath.style.strokeDashoffset = offset;
    }
}

function toggleMode() {
    isFocusMode = !isFocusMode;
    timeLeft = isFocusMode ? getFocusTimeSeconds() : getBreakTimeSeconds();
    currentTotalTime = timeLeft;
    
    const svgContainer = document.querySelector('.timer-svg');
    if (isFocusMode) {
        modeText.textContent = "Focus Session";
        modeText.className = "stat-label px-4 py-1.5 bg-[#EEF2FF] text-primary rounded-full shadow-sm border border-white";
        if(svgContainer) svgContainer.classList.remove('timer-break');
        if(manualTimeInput) manualTimeInput.disabled = false;
    } else {
        modeText.textContent = "Take a Break";
        modeText.className = "stat-label px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full shadow-sm border border-white";
        if(svgContainer) svgContainer.classList.add('timer-break');
        if(manualTimeInput) manualTimeInput.disabled = true;
    }
    updateDisplay();
}

async function logSession() {
    if (isFocusMode && window.api) {
        const today = new Date().toISOString().split('T')[0];
        const minsLogged = Math.round(currentTotalTime / 60);
        const subjectInput = document.getElementById('pomodoro-subject');
        const subject = subjectInput ? subjectInput.value.trim() : '';
        try {
            await api.request('/analytics/log', 'POST', {
                date: today,
                focus_time: minsLogged,
                subject: subject || null
            });
            if (dashFocusTotalDisplay) {
                dashFocusTotalDisplay.textContent = parseInt(dashFocusTotalDisplay.textContent || 0) + minsLogged;
            }
            if (window.loadAnalytics) window.loadAnalytics();
        } catch (e) { console.error(e); }
    }
}

function sendBreakNotification() {
    const title = isFocusMode ? '🎉 Focus Session Done!' : '⚡ Break Over!';
    const body  = isFocusMode ? 'Time for a well-earned break.' : 'Get back to studying. You got this!';
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
    } else if (window.showToast) {
        window.showToast(title + ' ' + body, 'success');
    }
}

// Request notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Space bar to start/pause
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.getElementById('page-pomodoro') &&
        !document.getElementById('page-pomodoro').classList.contains('hidden')) {
        e.preventDefault();
        isRunning ? pausePomodoro() : startPomodoro();
    }
});


window.startPomodoro = function() {
    if (isRunning) return;
    isRunning = true;
    if(manualTimeInput) manualTimeInput.disabled = true;
    
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft < 0) {
            timeLeft = 0;
            clearInterval(timerInterval);
            isRunning = false;
            updateDisplay();
            
            if (isFocusMode) logSession();
            sendBreakNotification();
            toggleMode();
        } else {
            updateDisplay();
        }
    }, 1000);
    
    document.getElementById('btn-start').classList.add('scale-95', 'opacity-80');
};

window.pausePomodoro = function() {
    isRunning = false;
    clearInterval(timerInterval);
    document.getElementById('btn-start').classList.remove('scale-95', 'opacity-80');
};

window.resetPomodoro = function() {
    isRunning = false;
    clearInterval(timerInterval);
    timeLeft = isFocusMode ? getFocusTimeSeconds() : getBreakTimeSeconds();
    currentTotalTime = timeLeft;
    updateDisplay();
    document.getElementById('btn-start').classList.remove('scale-95', 'opacity-80');
    if(manualTimeInput && isFocusMode) manualTimeInput.disabled = false;
};

document.addEventListener('DOMContentLoaded', () => {
    // Initial display
    if(manualTimeInput) {
        manualTimeInput.addEventListener('input', applyManualTime);
    }
    updateDisplay();
});
