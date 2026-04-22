// ============================================
// AI Study Planner — Full Application Logic
// ============================================

// ─── TOAST SYSTEM ───
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
    const colors = { success: '#10B981', error: '#EF4444', info: '#4F46E5', warning: '#F59E0B' };
    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto';
    toast.style.cssText = `
        display:flex; align-items:center; gap:10px;
        background:white; border-left:4px solid ${colors[type]};
        border-radius:12px; padding:13px 16px; min-width:260px; max-width:360px;
        box-shadow:0 8px 30px rgba(0,0,0,0.12);
        font-size:13px; font-weight:600; color:#1E293B;
        animation: toast-in 0.35s cubic-bezier(0.16,1,0.3,1) forwards;
    `;
    toast.innerHTML = `<i class="fa-solid ${icons[type]}" style="color:${colors[type]};font-size:15px;flex-shrink:0"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'toast-out 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 3500);
};

// Add toast CSS animations
const toastStyles = document.createElement('style');
toastStyles.textContent = `
  @keyframes toast-in  { from { transform:translateX(120%); opacity:0; } to { transform:translateX(0); opacity:1; } }
  @keyframes toast-out { from { transform:translateX(0); opacity:1; } to { transform:translateX(120%); opacity:0; } }
`;
document.head.appendChild(toastStyles);

// ─── AUTH ───
document.addEventListener('DOMContentLoaded', () => {
    if (!api.getToken()) {
        document.getElementById('auth-view').classList.remove('hidden');
        document.getElementById('sidebar').classList.add('hidden');
        toggleAuth('register');
    } else {
        document.getElementById('auth-view').classList.add('hidden');
        document.getElementById('sidebar').classList.remove('hidden');
        document.getElementById('sidebar').classList.add('flex');
        showPage('dashboard');
    }
});

window.toggleAuth = function(type) {
    const loginForm    = document.getElementById('login-container');
    const registerForm = document.getElementById('register-container');
    const pillBg  = document.getElementById('pill-bg');
    const btnLogin = document.getElementById('btn-login-tab');
    const btnReg   = document.getElementById('btn-reg-tab');
    if (type === 'register') {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        if (pillBg) pillBg.style.transform = 'translateX(100%)';
        if (btnReg)   btnReg.classList.add('active');
        if (btnLogin) btnLogin.classList.remove('active');
    } else {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        if (pillBg) pillBg.style.transform = 'translateX(0)';
        if (btnLogin) btnLogin.classList.add('active');
        if (btnReg)   btnReg.classList.remove('active');
    }
};

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...';
    btn.disabled = true;
    try {
        const res = await api.request('/auth/login', 'POST', {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value
        });
        api.setToken(res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        document.getElementById('auth-view').classList.add('hidden');
        document.getElementById('sidebar').classList.remove('hidden');
        document.getElementById('sidebar').classList.add('flex');
        showPage('dashboard');
    } catch (err) {
        showToast(err.message, 'error');
    } finally { btn.innerHTML = orig; btn.disabled = false; }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Creating...';
    btn.disabled = true;
    try {
        await api.request('/auth/register', 'POST', {
            name:     document.getElementById('reg-name').value,
            email:    document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value
        });
        showToast('Account created! Please sign in.', 'success');
        toggleAuth('login');
    } catch (err) {
        showToast(err.message, 'error');
    } finally { btn.innerHTML = orig; btn.disabled = false; }
});

window.logout = function() {
    api.clearToken();
    localStorage.removeItem('user');
    window.location.reload();
};

// ─── PAGE ROUTING ───
window.showPage = function(pageId) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const page = document.getElementById(`page-${pageId}`);
    if (page) {
        page.classList.remove('hidden');
        page.classList.remove('animate-fade');
        void page.offsetWidth;
        page.classList.add('animate-fade');
    }
    document.getElementById('main-content').classList.remove('hidden');
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('onclick')?.includes(`'${pageId}'`)) link.classList.add('active');
    });
    if (pageId === 'dashboard') loadDashboard();
    if (pageId === 'tasks')     loadTasks();
    if (pageId === 'analytics') loadAnalytics();
    if (pageId === 'exams')     loadExams();
    if (pageId === 'revision')  loadRevision();
    if (pageId === 'planner')   loadSavedPlans();
    if (pageId === 'notes')     loadNotes();
    if (pageId === 'profile')   loadProfile();
};

// ─── HELPERS ───
function animateNumber(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const dur = 800, start = performance.now();
    function update(now) {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = (target % 1 === 0)
            ? Math.round(target * Math.sin(p * Math.PI / 2))
            : (target * Math.sin(p * Math.PI / 2)).toFixed(1);
        if (p < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function daysUntil(dateStr) {
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(dateStr); target.setHours(0,0,0,0);
    return Math.round((target - today) / 86400000);
}

function priorityBadge(priority) {
    const map = { high:'🔴', medium:'🟡', low:'🟢' };
    return `<span class="text-[10px] font-bold ml-2">${map[priority] || '🟡'} ${priority}</span>`;
}

// ─── DASHBOARD ───
async function loadDashboard() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name) document.getElementById('user-name-display').innerText = user.name.split(' ')[0];

    try {
        const [stats, tasks, exams] = await Promise.all([
            api.request('/analytics/stats').catch(() => ({})),
            api.request('/tasks/').catch(() => []),
            api.request('/exams/').catch(() => [])
        ]);

        animateNumber('dash-focus-time', stats.total_focus_time_minutes || 0);
        animateNumber('dash-completed-tasks', stats.completed_tasks || 0);

        const rate = (stats.total_tasks > 0)
            ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0;
        document.getElementById('dash-rate').innerText = `${rate}%`;
        setTimeout(() => {
            const b = document.getElementById('dash-progress-line');
            if (b) b.style.width = `${rate}%`;
        }, 100);

        // Streak
        document.getElementById('dash-streak').innerText = stats.streak || 0;

        // 7-day habit grid
        renderHabitGrid(stats.week_grid || []);

        // Exam countdown
        renderExamCountdownRow(exams);

        // Tasks
        renderDashTasks(tasks);

        // Plan list empty state
        const planDiv = document.getElementById('dash-plan-list');
        if (planDiv && planDiv.innerHTML.trim() === '') {
            planDiv.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fa-regular fa-calendar-xmark text-2xl"></i></div>
                    <p class="font-bold text-gray-900 mb-1 text-sm">No Schedule Active</p>
                    <p class="text-xs text-[#64748B] max-w-[180px] mb-4">Use the AI Planner to map out your day.</p>
                    <button onclick="showPage('planner')" class="btn-secondary px-4 py-2 text-xs">Create Plan</button>
                </div>`;
        }
    } catch(err) { console.error(err); }
}

function renderHabitGrid(weekGrid) {
    const container = document.getElementById('habit-grid');
    if (!container) return;
    container.innerHTML = '';
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    weekGrid.forEach(entry => {
        const mins = entry.minutes || 0;
        const intensity = mins === 0 ? 0 : mins < 30 ? 1 : mins < 60 ? 2 : mins < 90 ? 3 : 4;
        const colors = ['#F1F5F9','#C7D2FE','#818CF8','#4F46E5','#312E81'];
        const date = new Date(entry.date);
        const dayName = days[date.getDay()];
        const col = document.createElement('div');
        col.className = 'flex flex-col items-center gap-1';
        col.innerHTML = `
            <div title="${entry.date}: ${mins} min" style="width:38px;height:38px;border-radius:10px;background:${colors[intensity]};border:2px solid rgba(255,255,255,0.6);transition:transform 0.2s;cursor:default;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></div>
            <span style="font-size:9px;font-weight:700;color:#94A3B8">${dayName}</span>
            <span style="font-size:9px;font-weight:600;color:#CBD5E1">${mins}m</span>
        `;
        container.appendChild(col);
    });
}

function renderExamCountdownRow(exams) {
    const row   = document.getElementById('exam-countdown-row');
    const cards = document.getElementById('exam-countdown-cards');
    if (!row || !cards) return;
    const upcoming = exams.filter(e => daysUntil(e.exam_date) >= 0).slice(0, 4);
    if (upcoming.length === 0) { row.classList.add('hidden'); return; }
    row.classList.remove('hidden');
    cards.innerHTML = '';
    upcoming.forEach(e => {
        const d = daysUntil(e.exam_date);
        const urgency = d <= 3 ? '#EF4444' : d <= 7 ? '#F59E0B' : '#4F46E5';
        const card = document.createElement('div');
        card.className = 'flex items-center gap-3 px-4 py-3 bg-white rounded-xl border shadow-sm';
        card.style.borderColor = urgency + '33';
        card.innerHTML = `
            <div style="width:40px;height:40px;border-radius:10px;background:${urgency}1A;display:flex;align-items:center;justify-content:center;font-size:18px">📅</div>
            <div>
                <p style="font-size:13px;font-weight:700;color:#1E293B">${e.subject}</p>
                <p style="font-size:11px;font-weight:600;color:${urgency}">${d === 0 ? 'Today!' : d === 1 ? 'Tomorrow!' : `In ${d} days`}</p>
            </div>`;
        cards.appendChild(card);
    });
}

function renderDashTasks(tasks) {
    const list = document.getElementById('dash-task-list');
    if (!list) return;
    list.innerHTML = '';
    const recent = tasks.slice(0, 6);
    if (recent.length === 0) {
        list.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fa-solid fa-list-check text-2xl"></i></div><p class="font-bold text-gray-900 mb-1 text-sm">All Caught Up</p><button onclick="showPage('tasks')" class="btn-secondary px-4 py-2 text-xs mt-3">Add a Task</button></div>`;
        return;
    }
    recent.forEach(t => {
        const today = new Date().toISOString().split('T')[0];
        const overdue = t.deadline && t.deadline < today && t.status !== 'completed';
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl border hover:bg-white transition-all hover:border-[#E2E8F0] hover:shadow-sm';
        div.style.borderColor = overdue ? '#FCA5A5' : 'transparent';
        div.innerHTML = `
            ${t.status === 'completed'
                ? '<i class="fa-solid fa-circle-check text-emerald-500 shrink-0"></i>'
                : '<i class="fa-regular fa-circle text-[#CBD5E1] shrink-0"></i>'}
            <span class="${t.status === 'completed' ? 'line-through text-[#94A3B8]' : 'text-gray-900'} text-[13px] font-semibold truncate flex-1">${t.title}</span>
            ${overdue ? '<span class="text-[10px] font-bold text-red-400 shrink-0">OVERDUE</span>' : ''}
            ${t.deadline && !overdue ? `<span class="text-[10px] font-medium text-[#94A3B8] shrink-0">${t.deadline}</span>` : ''}
        `;
        list.appendChild(div);
    });
}

// Quick-add task from dashboard
document.getElementById('quick-task-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inp = document.getElementById('quick-task-input');
    if (!inp.value.trim()) return;
    try {
        await api.request('/tasks/', 'POST', { title: inp.value.trim() });
        inp.value = '';
        showToast('Task added!', 'success');
        loadDashboard();
    } catch(err) { showToast(err.message, 'error'); }
});

// ─── TASKS ───
async function loadTasks() {
    try {
        window.allTasks = await api.request('/tasks/');
        renderTasks(window.allTasks);
    } catch(err) { console.error(err); }
}

document.getElementById('task-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title    = document.getElementById('task-title').value.trim();
    const deadline = document.getElementById('task-deadline').value;
    const priority = document.getElementById('task-priority').value;
    if (!title) return;
    try {
        await api.request('/tasks/', 'POST', { title, deadline: deadline || null, priority });
        document.getElementById('task-title').value    = '';
        document.getElementById('task-deadline').value = '';
        document.getElementById('task-priority').value = 'medium';
        showToast('Task saved!', 'success');
        loadTasks();
    } catch(err) { showToast(err.message, 'error'); }
});

function renderTasks(tasks) {
    const list = document.getElementById('main-task-list');
    if (!list) return;
    list.innerHTML = '';
    if (tasks.length === 0) {
        list.innerHTML = `<div class="glass-card flex flex-col items-center justify-center p-16 text-center border-dashed border-2 border-[rgba(226,232,240,0.8)] shadow-none"><div class="w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] text-2xl mb-4"><i class="fa-solid fa-clipboard-check"></i></div><h3 class="text-xl font-bold text-gray-900 mb-2">No Tasks Found</h3><p class="text-[#64748B] text-sm font-medium">Add tasks from the sidebar to get started.</p></div>`;
        return;
    }
    const today = new Date().toISOString().split('T')[0];
    const prioOrder = { high: 0, medium: 1, low: 2 };
    tasks.sort((a,b) => (prioOrder[a.priority]||1) - (prioOrder[b.priority]||1));

    tasks.forEach(t => {
        const overdue = t.deadline && t.deadline < today && t.status !== 'completed';
        const daysLeft = t.deadline ? daysUntil(t.deadline) : null;
        const prioColors = { high:'text-red-500 bg-red-50', medium:'text-amber-500 bg-amber-50', low:'text-emerald-500 bg-emerald-50' };
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-4 bg-white rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(79,70,229,0.1)] group';
        div.style.borderColor = overdue ? '#FCA5A5' : 'rgba(226,232,240,0.6)';
        div.innerHTML = `
            <div class="flex items-center gap-4 flex-1 min-w-0">
                <input type="checkbox" class="task-checkbox shrink-0" ${t.status==='completed'?'checked':''} onchange="toggleTaskStatus(${t.id}, this.checked)">
                <div class="min-w-0">
                    <p class="${t.status==='completed'?'line-through text-[#94A3B8]':'text-gray-900 font-semibold'} text-[14px] truncate">${t.title}</p>
                    <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md ${prioColors[t.priority]||prioColors.medium}">${t.priority||'medium'}</span>
                        ${t.deadline ? `<span class="text-[10px] font-medium ${overdue?'text-red-500 font-bold':'text-[#94A3B8]'}">
                            ${overdue ? '⚠️ Overdue' : daysLeft === 0 ? '📅 Due today' : daysLeft === 1 ? '📅 Due tomorrow' : `📅 ${t.deadline}`}
                        </span>` : ''}
                    </div>
                </div>
            </div>
            <button onclick="deleteTask(${t.id})" class="text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 p-2.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                <i class="fa-solid fa-trash-can text-sm"></i>
            </button>
        `;
        list.appendChild(div);
    });
}

window.toggleTaskStatus = async function(id, isDone) {
    try {
        await api.request(`/tasks/${id}`, 'PUT', { status: isDone ? 'completed' : 'pending' });
        loadTasks();
    } catch(err) { console.error(err); }
};

window.deleteTask = async function(id) {
    if (!confirm('Delete this task?')) return;
    try {
        await api.request(`/tasks/${id}`, 'DELETE');
        showToast('Task deleted', 'info');
        loadTasks();
    } catch(err) { showToast(err.message, 'error'); }
};

window.filterTasks = function(status, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('bg-primary','text-white','shadow-md');
        b.classList.add('text-[#64748B]');
    });
    if (btn) { btn.classList.add('bg-primary','text-white','shadow-md'); btn.classList.remove('text-[#64748B]'); }
    if (!window.allTasks) return;
    const today = new Date().toISOString().split('T')[0];
    const map = {
        all:      window.allTasks,
        pending:  window.allTasks.filter(t => t.status === 'pending'),
        completed:window.allTasks.filter(t => t.status === 'completed'),
        overdue:  window.allTasks.filter(t => t.deadline && t.deadline < today && t.status !== 'completed'),
        high:     window.allTasks.filter(t => t.priority === 'high')
    };
    renderTasks(map[status] || window.allTasks);
};

// ─── AI PLANNER ───
window.addSubjectRow = function() {
    const row = document.createElement('div');
    row.className = 'subject-row flex gap-3 items-center bg-white p-2.5 rounded-xl border border-[rgba(226,232,240,0.8)] shadow-sm animate-fade hover:-translate-y-0.5 transition-transform';
    row.innerHTML = `
        <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-primary shrink-0"><i class="fa-solid fa-book text-xs"></i></div>
        <input type="text" placeholder="Subject Name" class="subject-name flex-1 bg-transparent text-gray-900 font-semibold text-sm outline-none h-full" required>
        <select class="subject-difficulty bg-transparent text-xs font-bold text-primary focus:outline-none cursor-pointer border-l border-[rgba(226,232,240,0.8)] pl-3">
            <option value="easy">Easy</option>
            <option value="medium" selected>Medium</option>
            <option value="hard">Hard</option>
        </select>
        <button type="button" onclick="this.closest('.subject-row').remove()" class="w-8 h-8 flex items-center justify-center text-[#94A3B8] hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
            <i class="fa-solid fa-xmark text-sm"></i>
        </button>`;
    document.getElementById('subjects-container').appendChild(row);
};

document.getElementById('planner-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Synthesizing...';
    btn.disabled = true;
    const hours = document.getElementById('plan-hours').value;
    const subjects = [...document.querySelectorAll('.subject-row')].map(r => ({
        name: r.querySelector('.subject-name').value.trim(),
        difficulty: r.querySelector('.subject-difficulty').value
    })).filter(s => s.name);
    try {
        const res = await api.request('/planner/generate-plan', 'POST', { available_hours: hours, subjects });
        window._currentPlan = res.plan;
        renderPlan(res.plan);
        showToast('Schedule generated!', 'success');
    } catch(err) { showToast(err.message, 'error'); }
    finally { btn.innerHTML = orig; btn.disabled = false; }
});

function renderPlan(plan) {
    document.getElementById('planner-result-container').classList.remove('hidden');
    const resultDiv = document.getElementById('planner-results');
    const dashDiv   = document.getElementById('dash-plan-list');
    resultDiv.innerHTML = '';
    if (dashDiv) dashDiv.innerHTML = '';
    if (!plan || plan.length === 0) return;
    const colors = {
        hard:   { border:'border-l-red-500',     bg:'bg-red-50 text-red-600',     dot:'bg-red-500' },
        medium: { border:'border-l-indigo-500',   bg:'bg-indigo-50 text-indigo-600', dot:'bg-indigo-500' },
        easy:   { border:'border-l-emerald-500',  bg:'bg-emerald-50 text-emerald-600', dot:'bg-emerald-500' }
    };
    plan.forEach(item => {
        const c = colors[item.difficulty] || colors.medium;
        const div = document.createElement('div');
        div.className = `p-5 bg-white border border-l-[3px] ${c.border} border-[rgba(226,232,240,0.8)] rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1`;
        div.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <span class="text-[15px] text-gray-900 font-bold">${item.subject}</span>
                <span class="${c.bg} px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">${item.difficulty}</span>
            </div>
            <div class="flex items-center text-[#64748B] font-semibold text-xs">
                <div class="w-6 h-6 rounded-md bg-[#F1F5F9] flex items-center justify-center mr-2"><i class="fa-regular fa-clock text-[#94A3B8] text-[10px]"></i></div>
                ${item.allocated_minutes} MIN BLOCK
            </div>`;
        resultDiv.appendChild(div);
        if (dashDiv) {
            const di = document.createElement('div');
            di.className = 'flex justify-between items-center p-3.5 bg-[#F8FAFC] rounded-xl hover:bg-white transition-colors border border-transparent hover:border-[#E2E8F0] shadow-sm cursor-default';
            di.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-2.5 h-2.5 rounded-full ${c.dot}"></div>
                    <span class="text-gray-900 font-bold text-[13px] truncate">${item.subject}</span>
                </div>
                <span class="text-[11px] font-black text-[#64748B] bg-white border border-[#E2E8F0] px-2.5 py-1 rounded shadow-sm">${item.allocated_minutes}m</span>`;
            dashDiv.appendChild(di);
        }
    });
}

// Save plan
window.savePlan = async function() {
    if (!window._currentPlan) return;
    const name = prompt('Name your plan:', `Plan ${new Date().toLocaleDateString()}`) || 'Study Plan';
    try {
        await api.request('/plans/', 'POST', { name, plan_data: window._currentPlan });
        showToast('Plan saved!', 'success');
        loadSavedPlans();
    } catch(err) { showToast(err.message, 'error'); }
};

async function loadSavedPlans() {
    try {
        const plans = await api.request('/plans/');
        const section = document.getElementById('saved-plans-section');
        const list    = document.getElementById('saved-plans-list');
        if (!section || !list) return;
        if (plans.length === 0) { section.classList.add('hidden'); return; }
        section.classList.remove('hidden');
        list.innerHTML = '';
        plans.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[rgba(226,232,240,0.8)] rounded-lg text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary transition-all';
            btn.innerHTML = `<i class="fa-solid fa-floppy-disk text-[10px]"></i>${p.name}<button class="ml-1 text-[#CBD5E1] hover:text-red-500" onclick="deletePlan(${p.id},event)"><i class="fa-solid fa-xmark"></i></button>`;
            btn.onclick = () => { renderPlan(JSON.parse(p.plan_data)); showToast(`Loaded: ${p.name}`, 'info'); };
            list.appendChild(btn);
        });
    } catch(e) {}
}

window.deletePlan = async function(id, e) {
    e.stopPropagation();
    try {
        await api.request(`/plans/${id}`, 'DELETE');
        showToast('Plan deleted', 'info');
        loadSavedPlans();
    } catch(err) { showToast(err.message, 'error'); }
};

// ─── ANALYTICS ───
let focusChartInstance = null;
let subjectChartInstance = null;
window.loadAnalytics = async function() {
    try {
        const [stats, goal] = await Promise.all([
            api.request('/analytics/stats').catch(() => ({})),
            api.request('/goals/').catch(() => ({ weekly_hours_goal: 10 }))
        ]);
        document.getElementById('stat-total-tasks').innerText     = stats.total_tasks || 0;
        document.getElementById('stat-completed-tasks').innerText = stats.completed_tasks || 0;
        document.getElementById('stat-streak').innerText          = stats.streak || 0;

        const rate = (stats.total_tasks > 0) ? Math.round((stats.completed_tasks/stats.total_tasks)*100) : 0;
        const hrs  = ((stats.total_focus_time_minutes||0) / 60);
        animateNumber('stat-total-hrs', parseFloat(hrs.toFixed(1)));

        // Weekly goal
        const weeklyHrs = (stats.weekly_focus_minutes || 0) / 60;
        const goalHrs   = goal.weekly_hours_goal || 10;
        const goalPct   = Math.min(Math.round((weeklyHrs / goalHrs) * 100), 100);
        document.getElementById('weekly-goal-input').value    = goalHrs;
        document.getElementById('weekly-progress-label').innerText = `${weeklyHrs.toFixed(1)}h this week`;
        document.getElementById('weekly-goal-label').innerText     = `Goal: ${goalHrs}h`;
        document.getElementById('weekly-goal-pct').innerText       = `${goalPct}%`;
        setTimeout(() => {
            const bar = document.getElementById('weekly-goal-bar');
            if (bar) bar.style.width = `${goalPct}%`;
        }, 200);

        renderFocusChart(stats.daily_focus || {});
        renderSubjectChart(stats.subject_breakdown || []);
    } catch(err) { console.error(err); }
};

window.saveWeeklyGoal = async function() {
    const val = parseFloat(document.getElementById('weekly-goal-input').value);
    if (!val || val <= 0) return;
    try {
        await api.request('/goals/', 'POST', { weekly_hours_goal: val });
        showToast('Goal saved!', 'success');
        loadAnalytics();
    } catch(err) { showToast(err.message, 'error'); }
};

function renderFocusChart(dailyFocusData) {
    const ctx = document.getElementById('focusChart')?.getContext('2d');
    if (!ctx) return;
    const today = new Date();
    const dates = [], data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        const str = d.toISOString().split('T')[0];
        dates.push(str);
        data.push(dailyFocusData[str] || 0);
    }
    if (focusChartInstance) focusChartInstance.destroy();
    const grad = ctx.createLinearGradient(0,0,0,260);
    grad.addColorStop(0, 'rgba(79,70,229,0.35)');
    grad.addColorStop(1, 'rgba(79,70,229,0)');
    focusChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.map(d => `${d.split('-')[1]}/${d.split('-')[2]}`),
            datasets: [{ data, backgroundColor: grad, borderColor:'#4F46E5', borderWidth:3, tension:0.45, fill:true,
                pointBackgroundColor:'#ffffff', pointBorderColor:'#4F46E5', pointBorderWidth:2,
                pointRadius:0, pointHoverRadius:6 }]
        },
        options: {
            responsive:true, maintainAspectRatio:false,
            interaction: { intersect:false, mode:'index' },
            scales: {
                y: { beginAtZero:true, grid:{ color:'rgba(226,232,240,0.5)', borderDash:[4,4] }, ticks:{ color:'#94A3B8', font:{size:11}, padding:10 } },
                x: { grid:{ display:false }, ticks:{ color:'#94A3B8', font:{size:11}, padding:10 } }
            },
            plugins: {
                legend:{ display:false },
                tooltip:{ backgroundColor:'#0F172A', titleColor:'#F8FAFC', bodyColor:'#CBD5E1', padding:12, cornerRadius:12, displayColors:false,
                    callbacks:{ label: c => `${c.parsed.y} mins focused` } }
            }
        }
    });
}

function renderSubjectChart(breakdown) {
    const ctx   = document.getElementById('subjectChart')?.getContext('2d');
    const empty = document.getElementById('subject-empty');
    const legend = document.getElementById('subject-legend');
    if (!ctx) return;
    if (breakdown.length === 0) {
        if (empty) empty.classList.remove('hidden');
        if (legend) legend.innerHTML = '';
        return;
    }
    if (empty) empty.classList.add('hidden');
    const palette = ['#4F46E5','#7C3AED','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444'];
    const labels  = breakdown.map(s => s.subject);
    const data    = breakdown.map(s => s.minutes);
    const colors  = breakdown.map((_, i) => palette[i % palette.length]);
    if (subjectChartInstance) subjectChartInstance.destroy();
    subjectChartInstance = new Chart(ctx, {
        type:'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth:2, borderColor:'#ffffff', hoverOffset:8 }] },
        options: {
            responsive:true, maintainAspectRatio:false, cutout:'70%',
            plugins: { legend:{ display:false },
                tooltip:{ callbacks:{ label: c => `${c.label}: ${c.parsed}min` } } }
        }
    });
    if (legend) {
        legend.innerHTML = breakdown.map((s,i) => `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div style="width:10px;height:10px;border-radius:3px;background:${colors[i]};flex-shrink:0"></div>
                    <span class="text-[11px] font-semibold text-gray-700 truncate">${s.subject}</span>
                </div>
                <span class="text-[11px] font-bold text-[#64748B]">${s.minutes}m</span>
            </div>`).join('');
    }
}

// ─── EXAMS ───
async function loadExams() {
    try {
        const exams = await api.request('/exams/');
        renderExams(exams);
    } catch(err) { console.error(err); }
}

document.getElementById('exam-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subject = document.getElementById('exam-subject').value.trim();
    const date    = document.getElementById('exam-date').value;
    const notes   = document.getElementById('exam-notes').value.trim();
    if (!subject || !date) return;
    try {
        await api.request('/exams/', 'POST', { subject, exam_date: date, notes });
        e.target.reset();
        showToast('Exam added!', 'success');
        loadExams();
    } catch(err) { showToast(err.message, 'error'); }
});

function renderExams(exams) {
    const list = document.getElementById('exams-list');
    if (!list) return;
    list.innerHTML = '';
    if (exams.length === 0) {
        list.innerHTML = `<div class="glass-card col-span-2 flex flex-col items-center justify-center p-16 text-center border-dashed border-2 border-[rgba(226,232,240,0.8)] shadow-none"><div class="text-4xl mb-4">🎓</div><h3 class="text-lg font-bold text-gray-900 mb-2">No Exams Added</h3><p class="text-[#64748B] text-sm">Add your upcoming exams to track countdowns.</p></div>`;
        return;
    }
    exams.forEach(exam => {
        const d = daysUntil(exam.exam_date);
        const urgency = d < 0 ? 'past' : d <= 3 ? 'critical' : d <= 7 ? 'soon' : 'normal';
        const urgencyStyles = {
            past:     { bg:'#F1F5F9', countColor:'#94A3B8', label:'Passed' },
            critical: { bg:'#FEF2F2', countColor:'#EF4444', label:`${d}d left` },
            soon:     { bg:'#FFFBEB', countColor:'#F59E0B', label:`${d}d left` },
            normal:   { bg:'#EEF2FF', countColor:'#4F46E5', label:`${d}d left` }
        };
        const s = urgencyStyles[urgency];
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl border border-[rgba(226,232,240,0.8)] p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative overflow-hidden';
        card.innerHTML = `
            <div style="position:absolute;top:0;right:0;width:80px;height:80px;border-radius:0 0 0 80px;background:${s.bg};display:flex;align-items:flex-start;justify-content:flex-end;padding:12px">
                <span style="font-size:18px;font-weight:900;color:${s.countColor}">${s.label}</span>
            </div>
            <div class="mb-4">
                <div class="text-3xl mb-3">📚</div>
                <h3 class="text-lg font-black text-gray-900">${exam.subject}</h3>
                <p class="text-sm text-[#64748B] font-medium mt-1">${exam.exam_date}</p>
                ${exam.notes ? `<p class="text-xs text-[#94A3B8] mt-2 line-clamp-2">${exam.notes}</p>` : ''}
            </div>
            <button onclick="deleteExam(${exam.id})" class="text-xs font-bold text-[#CBD5E1] hover:text-red-500 transition-colors flex items-center gap-1">
                <i class="fa-solid fa-trash-can"></i> Remove
            </button>`;
        list.appendChild(card);
    });
}

window.deleteExam = async function(id) {
    if (!confirm('Delete this exam?')) return;
    try {
        await api.request(`/exams/${id}`, 'DELETE');
        showToast('Exam removed', 'info');
        loadExams();
    } catch(err) { showToast(err.message, 'error'); }
};

// ─── REVISION TRACKER ───
async function loadRevision() {
    try {
        const topics = await api.request('/revision/');
        renderRevision(topics);
    } catch(err) { console.error(err); }
}

document.getElementById('revision-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subject = document.getElementById('revision-subject').value.trim();
    const topic   = document.getElementById('revision-topic').value.trim();
    if (!subject || !topic) return;
    try {
        await api.request('/revision/', 'POST', { subject, topic });
        e.target.reset();
        showToast('Topic added!', 'success');
        loadRevision();
    } catch(err) { showToast(err.message, 'error'); }
});

function renderRevision(topics) {
    const list = document.getElementById('revision-list');
    if (!list) return;
    if (topics.length === 0) {
        list.innerHTML = `<div class="glass-card flex flex-col items-center justify-center p-16 text-center border-dashed border-2 border-[rgba(226,232,240,0.8)] shadow-none"><div class="text-4xl mb-4">📚</div><h3 class="text-lg font-bold text-gray-900 mb-2">No Topics Yet</h3><p class="text-[#64748B] text-sm">Add topics to track your revision progress.</p></div>`;
        return;
    }

    // Group by subject
    const grouped = {};
    topics.forEach(t => {
        if (!grouped[t.subject]) grouped[t.subject] = [];
        grouped[t.subject].push(t);
    });

    list.innerHTML = '';
    Object.entries(grouped).forEach(([subject, subTopics]) => {
        const done     = subTopics.filter(t => t.status === 'done').length;
        const pct      = Math.round((done / subTopics.length) * 100);
        const section  = document.createElement('div');
        section.className = 'glass-card p-6 mb-4';
        section.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-black text-gray-900 text-base">${subject}</h3>
                <div class="flex items-center gap-3">
                    <div class="progress-bg w-24 h-2">
                        <div class="progress-fill h-full rounded-full" style="width:${pct}%"></div>
                    </div>
                    <span class="text-xs font-bold text-[#64748B]">${done}/${subTopics.length}</span>
                </div>
            </div>
            <div class="space-y-2" id="topics-${subject.replace(/\s/g,'_')}"></div>`;
        list.appendChild(section);
        const topicContainer = section.querySelector(`#topics-${subject.replace(/\s/g,'_')}`);
        subTopics.forEach(t => {
            const statusConfig = {
                not_started: { label:'Not Started', next:'reviewing',  color:'#94A3B8', bg:'#F1F5F9',   icon:'fa-circle' },
                reviewing:   { label:'Reviewing',   next:'done',      color:'#F59E0B', bg:'#FFFBEB',    icon:'fa-spinner' },
                done:        { label:'Done',         next:'not_started',color:'#10B981', bg:'#ECFDF5',   icon:'fa-circle-check' }
            };
            const cfg = statusConfig[t.status] || statusConfig.not_started;
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between p-3 rounded-xl border border-[rgba(226,232,240,0.6)] hover:border-primary transition-all group';
            row.style.background = cfg.bg + '80';
            row.innerHTML = `
                <div class="flex items-center gap-3">
                    <i class="fa-solid ${cfg.icon}" style="color:${cfg.color};font-size:14px"></i>
                    <span class="${t.status==='done'?'line-through text-[#94A3B8]':'text-gray-900 font-semibold'} text-sm">${t.topic}</span>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="advanceTopic(${t.id},'${cfg.next}')" style="font-size:10px;font-weight:700;color:${cfg.color};padding:4px 10px;border-radius:8px;border:1px solid ${cfg.color}33;background:white;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='${cfg.bg}'" onmouseout="this.style.background='white'">
                        → ${statusConfig[cfg.next].label}
                    </button>
                    <button onclick="deleteTopic(${t.id})" class="text-[#CBD5E1] hover:text-red-500 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>`;
            topicContainer.appendChild(row);
        });
    });
}

window.advanceTopic = async function(id, newStatus) {
    try {
        await api.request(`/revision/${id}`, 'PUT', { status: newStatus });
        loadRevision();
    } catch(err) { showToast(err.message, 'error'); }
};

window.deleteTopic = async function(id) {
    try {
        await api.request(`/revision/${id}`, 'DELETE');
        showToast('Topic removed', 'info');
        loadRevision();
    } catch(err) { showToast(err.message, 'error'); }
};

// ─── ONBOARDING ───
window.closeOnboarding = function() {
    const modal = document.getElementById('onboarding-modal');
    if (modal) { modal.style.display = 'none'; modal.classList.add('hidden'); }
    localStorage.setItem('onboarding_done', '1');
};

function checkOnboarding() {
    if (!localStorage.getItem('onboarding_done')) {
        const modal = document.getElementById('onboarding-modal');
        if (modal) { modal.classList.remove('hidden'); modal.style.display = 'flex'; }
    }
}

// ─── PROFILE / SETTINGS ───
async function loadProfile() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const profile = await api.request('/auth/profile').catch(() => user);
        document.getElementById('profile-name').value  = profile.name  || '';
        document.getElementById('profile-email').value = profile.email || '';
        document.getElementById('profile-name-display').innerText  = profile.name  || 'Your Name';
        document.getElementById('profile-email-display').innerText = profile.email || 'your@email.com';
        const avatar = document.getElementById('profile-avatar');
        if (avatar && profile.name) avatar.innerText = profile.name.charAt(0).toUpperCase();
    } catch(err) { console.error(err); }
}

document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name  = document.getElementById('profile-name').value.trim();
    const email = document.getElementById('profile-email').value.trim();
    try {
        const res = await api.request('/auth/profile', 'PUT', { name, email });
        const updated = res.user || { name, email };
        localStorage.setItem('user', JSON.stringify({
            ...JSON.parse(localStorage.getItem('user') || '{}'),
            ...updated
        }));
        showToast('Profile updated!', 'success');
        loadProfile();
        document.getElementById('user-name-display').innerText = (updated.name || name).split(' ')[0];
    } catch(err) { showToast(err.message, 'error'); }
});

document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const current_password = document.getElementById('current-password').value;
    const new_password     = document.getElementById('new-password').value;
    if (!new_password || new_password.length < 6) {
        showToast('Password must be at least 6 characters', 'warning'); return;
    }
    try {
        await api.request('/auth/profile', 'PUT', { current_password, new_password });
        showToast('Password updated!', 'success');
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
    } catch(err) { showToast(err.message, 'error'); }
});

// ─── SUBJECT NOTES ───
let _currentNoteSubject = null;
let _allNotes = [];

async function loadNotes() {
    try {
        _allNotes = await api.request('/notes/');
        renderNoteSidebar();
        if (_currentNoteSubject) openNote(_currentNoteSubject);
        else {
            document.getElementById('note-editor').classList.add('hidden');
            document.getElementById('note-empty').classList.remove('hidden');
        }
    } catch(err) { console.error(err); }
}

function renderNoteSidebar() {
    const list = document.getElementById('notes-subject-list');
    if (!list) return;
    list.innerHTML = '';
    if (_allNotes.length === 0) {
        list.innerHTML = '<p class="text-xs text-[#94A3B8] font-medium">No subjects yet.</p>';
        return;
    }
    _allNotes.forEach(n => {
        const btn = document.createElement('button');
        btn.className = `w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all ${_currentNoteSubject===n.subject?'bg-primary text-white':'text-gray-700 hover:bg-[#F1F5F9]'}`;
        btn.innerText = n.subject;
        btn.onclick = () => openNote(n.subject);
        list.appendChild(btn);
    });
}

function openNote(subject) {
    _currentNoteSubject = subject;
    const note = _allNotes.find(n => n.subject === subject);
    document.getElementById('note-editor-title').innerText = `📝 ${subject}`;
    document.getElementById('note-textarea').value = note ? note.content : '';
    document.getElementById('note-last-saved').innerText = note?.updated_at || 'Never';
    document.getElementById('note-editor').classList.remove('hidden');
    document.getElementById('note-empty').classList.add('hidden');
    renderNoteSidebar();
}

window.createNoteSubject = function() {
    const inp = document.getElementById('new-note-subject');
    const subj = inp.value.trim();
    if (!subj) return;
    if (_allNotes.find(n => n.subject === subj)) { showToast('Subject already exists', 'warning'); return; }
    inp.value = '';
    // Save empty note to create the subject
    api.request('/notes/', 'POST', { subject: subj, content: '' })
        .then(() => { showToast(`"${subj}" added`, 'success'); loadNotes(); openNote(subj); })
        .catch(err => showToast(err.message, 'error'));
};

window.saveNote = async function() {
    if (!_currentNoteSubject) return;
    const content = document.getElementById('note-textarea').value;
    try {
        await api.request('/notes/', 'POST', { subject: _currentNoteSubject, content });
        showToast('Notes saved!', 'success');
        const now = new Date().toLocaleString();
        document.getElementById('note-last-saved').innerText = now;
        await loadNotes();
    } catch(err) { showToast(err.message, 'error'); }
};

window.deleteCurrentNote = async function() {
    if (!_currentNoteSubject) return;
    const note = _allNotes.find(n => n.subject === _currentNoteSubject);
    if (!note) return;
    if (!confirm(`Delete notes for "${_currentNoteSubject}"?`)) return;
    try {
        await api.request(`/notes/${note.id}`, 'DELETE');
        showToast('Notes deleted', 'info');
        _currentNoteSubject = null;
        loadNotes();
    } catch(err) { showToast(err.message, 'error'); }
};

// Auto-save on Ctrl+S
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && _currentNoteSubject) {
        e.preventDefault();
        saveNote();
    }
});

// ─── PDF EXPORT ───
window.exportPlanPDF = function() {
    if (!window._currentPlan || window._currentPlan.length === 0) {
        showToast('Generate a plan first!', 'warning'); return;
    }
    const user  = JSON.parse(localStorage.getItem('user') || '{}');
    const today = new Date().toLocaleDateString('en-IN', { dateStyle: 'full' });
    let html = `
        <html><head><title>Study Plan</title><style>
            body{font-family:system-ui,sans-serif;color:#1E293B;padding:40px;max-width:700px;margin:0 auto}
            h1{font-size:24px;font-weight:900;margin-bottom:4px}
            p{color:#64748B;font-size:13px;margin-bottom:30px}
            .card{padding:16px 20px;border-radius:12px;margin-bottom:12px;border-left:4px solid;background:#F8FAFC}
            .hard{border-color:#EF4444}.medium{border-color:#4F46E5}.easy{border-color:#10B981}
            .badge{display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;text-transform:uppercase;margin-left:8px}
            .hard .badge{background:#FEF2F2;color:#EF4444}.medium .badge{background:#EEF2FF;color:#4F46E5}.easy .badge{background:#ECFDF5;color:#10B981}
            .time{font-size:12px;color:#94A3B8;margin-top:4px;font-weight:600}
            footer{margin-top:40px;font-size:11px;color:#94A3B8;text-align:center}
        </style></head><body>
        <h1>📚 Study Plan</h1>
        <p>Prepared for <strong>${user.name || 'Student'}</strong> &nbsp;•&nbsp; ${today}</p>`;

    window._currentPlan.forEach(item => {
        html += `<div class="card ${item.difficulty}">
            <strong style="font-size:15px">${item.subject}</strong>
            <span class="badge">${item.difficulty}</span>
            <div class="time">⏱ ${item.allocated_minutes} minutes</div>
        </div>`;
    });

    const total = window._currentPlan.reduce((s, i) => s + i.allocated_minutes, 0);
    html += `<div style="margin-top:20px;padding:16px;background:#EEF2FF;border-radius:12px;font-weight:700;font-size:14px">
        Total study time: ${Math.floor(total/60)}h ${total%60}m
    </div>
    <footer>Generated by AI Study Planner</footer></body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
};

// Run onboarding check after login (called in login success)
const _origShowPage = window.showPage;
window.showPage = function(pageId) {
    _origShowPage(pageId);
    if (pageId === 'dashboard') {
        setTimeout(checkOnboarding, 800);
    }
};

// ─── AI STUDYBOT CHAT ───
let _aiHistory = [];
let _aiOpen = false;
let _aiGreeted = false;

// Show floating button after login + update mobile bottom nav
const _origShowPageForAI = window.showPage;
window.showPage = function(pageId) {
    _origShowPageForAI(pageId);
    const btn = document.getElementById('ai-chat-btn');
    if (btn && api.getToken()) {
        btn.classList.remove('hidden');
        btn.style.display = 'flex';
    }

    // Show mobile bottom nav and topbar when logged in
    const mobileNav = document.getElementById('mobile-bottom-nav');
    const mobileTop = document.getElementById('mobile-topbar');
    if (mobileNav && api.getToken()) mobileNav.classList.remove('hidden');
    if (mobileTop && api.getToken()) mobileTop.classList.remove('hidden');

    // Update mobile bottom nav active state
    const navMap = { dashboard:'mob-btn-dashboard', tasks:'mob-btn-tasks', pomodoro:'mob-btn-pomodoro', analytics:'mob-btn-analytics' };
    document.querySelectorAll('.mob-nav-btn').forEach(b => b.classList.remove('active'));
    if (navMap[pageId]) {
        const active = document.getElementById(navMap[pageId]);
        if (active) active.classList.add('active');
    }

    // Close sidebar on mobile after navigation
    closeSidebar();
};

// ─── MOBILE SIDEBAR ───
window.openSidebar = function() {
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebar-overlay');
    if (sidebar)  { sidebar.classList.add('open');   sidebar.style.display = 'flex'; }
    if (overlay)  { overlay.classList.add('open');   overlay.classList.remove('hidden'); }
};

window.closeSidebar = function() {
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebar-overlay');
    if (window.innerWidth < 768) {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) { overlay.classList.remove('open'); overlay.classList.add('hidden'); }
    }
};

window.toggleAIChat = function() {
    const panel = document.getElementById('ai-chat-panel');
    const icon  = document.getElementById('ai-btn-icon');
    const unread = document.getElementById('ai-unread');
    _aiOpen = !_aiOpen;

    if (_aiOpen) {
        panel.classList.remove('hidden');
        panel.style.display = 'flex';

        // Desktop: popup in bottom-right — Mobile: full screen
        if (window.innerWidth >= 768) {
            panel.style.bottom       = '88px';
            panel.style.right        = '24px';
            panel.style.left         = 'auto';
            panel.style.top          = 'auto';
            panel.style.width        = '360px';
            panel.style.height       = '520px';
            panel.style.borderRadius = '20px';
        } else {
            panel.style.top    = '0';
            panel.style.bottom = '0';
            panel.style.left   = '0';
            panel.style.right  = '0';
            panel.style.width  = '100%';
            panel.style.height = '100%';
            panel.style.borderRadius = '0';
        }

        if (icon)  { icon.className = 'fa-solid fa-xmark text-white text-xl'; }
        if (unread) unread.classList.add('hidden');
        if (!_aiGreeted) {
            _aiGreeted = true;
            addBotMessage("👋 Hi! I'm **StudyBot**, your personal AI study assistant!\n\nYou can ask me to:\n• Explain any concept\n• Give practice questions\n• Create a study plan\n• Summarize a topic\n\nWhat would you like help with today? 📚");
        }
        setTimeout(() => {
            const msgs = document.getElementById('ai-messages');
            if (msgs) msgs.scrollTop = msgs.scrollHeight;
        }, 100);
    } else {
        panel.classList.add('hidden');
        panel.style.display = '';
        if (icon) { icon.className = 'fa-solid fa-robot text-white text-xl'; }
    }
};

window.clearAIChat = function() {
    _aiHistory = [];
    _aiGreeted = false;
    const msgs = document.getElementById('ai-messages');
    if (msgs) msgs.innerHTML = '';
    addBotMessage("Chat cleared! 🧹 How can I help you study today?");
};

function addUserMessage(text) {
    const msgs = document.getElementById('ai-messages');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = 'ai-msg-user';
    div.innerHTML = `<div class="bubble">${escapeHtml(text)}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

function addBotMessage(text) {
    const msgs = document.getElementById('ai-messages');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = 'ai-msg-bot';
    div.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="bubble">${formatAIResponse(text)}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
    const msgs = document.getElementById('ai-messages');
    if (!msgs) return null;
    const div = document.createElement('div');
    div.className = 'ai-msg-bot';
    div.id = 'typing-indicator-row';
    div.innerHTML = `<div class="avatar">🤖</div><div class="typing-indicator"><span></span><span></span><span></span></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
}

function removeTyping() {
    const el = document.getElementById('typing-indicator-row');
    if (el) el.remove();
}

function formatAIResponse(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^• (.+)$/gm, '<li>$1</li>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
        .replace(/((<li>.*<\/li>)+)/gs, '<ul>$1</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
    return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

window.sendAIMessage = async function() {
    const input = document.getElementById('ai-input');
    const message = input?.value.trim();
    if (!message) return;
    input.value = '';

    addUserMessage(message);
    _aiHistory.push({ role: 'user', content: message });

    const typingEl = showTyping();
    const sendBtn = document.getElementById('ai-send-btn');
    if (sendBtn) sendBtn.disabled = true;

    try {
        const res = await api.request('/ai/chat', 'POST', {
            message,
            history: _aiHistory.slice(-10)
        });
        removeTyping();
        const reply = res.reply || 'Sorry, I could not get a response. Please try again.';
        addBotMessage(reply);
        _aiHistory.push({ role: 'assistant', content: reply });
    } catch(err) {
        removeTyping();
        addBotMessage('❌ Something went wrong. Please check your connection and try again.');
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        const msgs = document.getElementById('ai-messages');
        if (msgs) msgs.scrollTop = msgs.scrollHeight;
    }
};

window.sendQuickPrompt = function(prompt) {
    const input = document.getElementById('ai-input');
    if (input) { input.value = prompt; }
    sendAIMessage();
};
