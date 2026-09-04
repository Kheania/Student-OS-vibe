/* ==========================================================================
   STUDENT OS — script.js
   Vanilla JS SPA. All state persisted to localStorage under STORAGE_KEY.
   ========================================================================== */

const STORAGE_KEY = 'studentOS_v1';
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEK_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

/* ----------------------------------------------------------------------
   DEFAULT DATA
   ---------------------------------------------------------------------- */
function defaultState() {
  return {
    tasks: [
      { id: uid(), title: 'Finish JavaScript lesson', subject: 'Coding', priority: 'high', due: '18:00', done: false, created: Date.now() - 3000 },
      { id: uid(), title: 'Submit research assignment', subject: 'History', priority: 'medium', due: '15:00', done: true, created: Date.now() - 2000 },
      { id: uid(), title: 'Review CSS Grid', subject: 'Web Dev', priority: 'low', due: '20:00', done: false, created: Date.now() - 1000 }
    ],
    assignments: [
      { id: uid(), title: 'Portfolio site v1', subject: 'Web Development', deadline: daysFromNow(2), priority: 'high', status: 'In Progress' },
      { id: uid(), title: 'Algorithms problem set', subject: 'Computer Programming', deadline: daysFromNow(5), priority: 'medium', status: 'Not Started' }
    ],
    subjects: [
      { id: uid(), name: 'Web Development', teacher: 'Ms. Alvarez', progress: 72, studyHours: 14 },
      { id: uid(), name: 'Mathematics', teacher: 'Mr. Chen', progress: 58, studyHours: 9 },
      { id: uid(), name: 'Computer Programming', teacher: 'Mr. Reyes', progress: 84, studyHours: 21 }
    ],
    notes: [
      { id: uid(), title: 'Flexbox vs Grid', category: 'Coding', content: 'Grid for 2D layouts, flexbox for 1D. Use gap instead of margin hacks.', created: Date.now() - 500000 }
    ],
    goals: [
      { id: uid(), title: 'Become a professional developer', progress: 35 },
      { id: uid(), title: 'Build 10 portfolio projects', progress: 20 },
      { id: uid(), title: 'Master JavaScript', progress: 45 },
      { id: uid(), title: 'Learn React', progress: 15 }
    ],
    schedule: [
      { id: uid(), day: 'Monday', time: '08:00', name: 'Mathematics' },
      { id: uid(), day: 'Monday', time: '10:00', name: 'Web Development' },
      { id: uid(), day: 'Monday', time: '13:00', name: 'Computer Programming' },
      { id: uid(), day: 'Tuesday', time: '08:00', name: 'Science' },
      { id: uid(), day: 'Tuesday', time: '10:00', name: 'Networking' }
    ],
    codingSessions: [],
    dailyLog: {},              // { 'YYYY-MM-DD': { studyMinutes, tasksCompleted, codingMinutes } }
    skills: [
      { id: uid(), name: 'HTML', progress: 100 },
      { id: uid(), name: 'CSS', progress: 80 },
      { id: uid(), name: 'JavaScript', progress: 40 },
      { id: uid(), name: 'React', progress: 20 }
    ],
    codingGoalText: 'Complete 2 JavaScript exercises.',
    streak: { current: 3, longest: 7, lastActiveDate: todayKey() },
    pomo: { sessionsToday: 0, lastDate: todayKey() },
    music: { playlist: 'coding', trackIndex: 0, volume: 70, shuffle: false, repeat: false, customTracks: [] },
    settings: { theme: 'dark', username: 'Ken', startOfWeek: 'Monday', notifications: true }
  };
}

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
function todayKey(d = new Date()) { return d.toISOString().slice(0, 10); }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

/* ----------------------------------------------------------------------
   STATE LOAD / SAVE
   ---------------------------------------------------------------------- */
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // merge with defaults to survive schema additions
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    console.error('Failed to load state, using defaults', e);
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

function getLog(dateKey = todayKey()) {
  if (!state.dailyLog[dateKey]) state.dailyLog[dateKey] = { studyMinutes: 0, tasksCompleted: 0, codingMinutes: 0 };
  return state.dailyLog[dateKey];
}

/* ==========================================================================
   TOASTS
   ========================================================================== */
function toast(message, type = 'default') {
  if (!state.settings.notifications && type !== 'force') return;
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = `toast ${type === 'force' ? '' : type}`;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 220);
  }, 3200);
}

/* ==========================================================================
   MODALS
   ========================================================================== */
const backdrop = document.getElementById('modalBackdrop');
function openModal(id) {
  closeAllModals();
  document.getElementById(id).classList.add('active');
  backdrop.classList.add('active');
}
function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  backdrop.classList.remove('active');
}
backdrop.addEventListener('click', closeAllModals);
document.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', closeAllModals));
document.querySelectorAll('[data-open-modal]').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.openModal)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAllModals(); closeSearch(); } });

let confirmCallback = null;
function askConfirm(title, text, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmText').textContent = text;
  confirmCallback = onConfirm;
  openModal('confirmModal');
}
document.getElementById('confirmActionBtn').addEventListener('click', () => {
  if (confirmCallback) confirmCallback();
  closeAllModals();
});

/* ==========================================================================
   NAVIGATION / VIEWS
   ========================================================================== */
function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${view}`)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
  document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
  closeMobileSidebar();
}
document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
document.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.nav)));

/* Sidebar collapse (desktop) */
document.getElementById('collapseBtn').addEventListener('click', () => {
  document.getElementById('shell').classList.toggle('collapsed');
});

/* Mobile sidebar */
const sidebarBackdrop = document.createElement('div');
sidebarBackdrop.className = 'sidebar-backdrop';
document.body.appendChild(sidebarBackdrop);
function openMobileSidebar() { document.getElementById('sidebar').classList.add('mobile-open'); sidebarBackdrop.classList.add('active'); }
function closeMobileSidebar() { document.getElementById('sidebar').classList.remove('mobile-open'); sidebarBackdrop.classList.remove('active'); }
document.getElementById('mobileMenuBtn').addEventListener('click', openMobileSidebar);
sidebarBackdrop.addEventListener('click', closeMobileSidebar);

/* ==========================================================================
   DATE / GREETING
   ========================================================================== */
function renderHeader() {
  const now = new Date();
  const hour = now.getHours();
  const greetWord = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = `${greetWord}, ${state.settings.username} 👋`;
  document.getElementById('profileName').textContent = state.settings.username;
  document.getElementById('profileAvatar').textContent = state.settings.username.charAt(0).toUpperCase() || '?';
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('dateTop').textContent = dateStr;
}

/* ==========================================================================
   TASKS
   ========================================================================== */
function addTask(title, subject, priority, due) {
  state.tasks.unshift({ id: uid(), title, subject: subject || 'General', priority, due: due || '', done: false, created: Date.now() });
  saveState();
  renderAll();
  toast('Task added');
}
function toggleTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  t.done = !t.done;
  const log = getLog();
  log.tasksCompleted += t.done ? 1 : -1;
  if (t.done) registerActivity();
  saveState();
  renderAll();
}
function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState();
  renderAll();
  toast('Task deleted');
}

function priorityWeight(p) { return { high: 0, medium: 1, low: 2 }[p] ?? 3; }

function taskItemHTML(t) {
  return `
  <div class="task-item ${t.done ? 'done' : ''}" data-id="${t.id}">
    <button class="task-check" data-action="toggle">${t.done ? '✓' : ''}</button>
    <div class="task-main">
      <div class="task-title">${escapeHTML(t.title)}</div>
      <div class="task-meta">
        ${t.subject ? `<span class="task-subject">${escapeHTML(t.subject)}</span>` : ''}
        ${t.due ? `<span class="task-due">${t.due}</span>` : ''}
        <span class="priority-tag ${t.priority}">${t.priority}</span>
      </div>
    </div>
    <button class="icon-btn sm task-del" data-action="delete" title="Delete">✕</button>
  </div>`;
}

function emptyTasksHTML() {
  return `<div class="empty-state">
    <div class="empty-emoji">🗒️</div>
    <div class="empty-title">No tasks yet.</div>
    <div class="empty-sub">Your day is clear.</div>
    <button class="empty-cta" data-open-modal="taskModal">Add your first task →</button>
  </div>`;
}
function allDoneHTML() {
  return `<div class="celebrate">
    <div class="flame">🔥 Nice work!</div>
    <div class="empty-sub" style="margin-top:6px;">You completed everything for today.</div>
  </div>`;
}

function bindTaskListEvents(container) {
  container.querySelectorAll('[data-action="toggle"]').forEach(btn =>
    btn.addEventListener('click', () => toggleTask(btn.closest('.task-item').dataset.id)));
  container.querySelectorAll('[data-action="delete"]').forEach(btn =>
    btn.addEventListener('click', () => deleteTask(btn.closest('.task-item').dataset.id)));
  container.querySelectorAll('[data-open-modal]').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.openModal)));
}

function renderDashboardTasks() {
  const container = document.getElementById('dashTaskList');
  const todays = state.tasks.slice(0, 6);
  if (state.tasks.length === 0) { container.innerHTML = emptyTasksHTML(); }
  else if (state.tasks.every(t => t.done)) { container.innerHTML = allDoneHTML(); }
  else { container.innerHTML = todays.map(taskItemHTML).join(''); }
  bindTaskListEvents(container);
}

let taskFilter = 'all';
let taskSort = 'priority';
function renderFullTasks() {
  const container = document.getElementById('fullTaskList');
  let list = [...state.tasks];
  if (taskFilter === 'active') list = list.filter(t => !t.done);
  else if (taskFilter === 'completed') list = list.filter(t => t.done);
  else if (taskFilter === 'high') list = list.filter(t => t.priority === 'high');

  if (taskSort === 'priority') list.sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority));
  else if (taskSort === 'due') list.sort((a, b) => (a.due || '99:99').localeCompare(b.due || '99:99'));
  else list.sort((a, b) => b.created - a.created);

  if (list.length === 0) container.innerHTML = emptyTasksHTML();
  else container.innerHTML = list.map(taskItemHTML).join('');
  bindTaskListEvents(container);
}

document.getElementById('taskForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('taskTitleInput').value.trim();
  if (!title) return;
  addTask(title, document.getElementById('taskSubjectInput').value.trim(),
    document.getElementById('taskPriorityInput').value, document.getElementById('taskDueInput').value);
  e.target.reset();
  closeAllModals();
});
document.getElementById('taskFilterChips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#taskFilterChips .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  taskFilter = chip.dataset.filter;
  renderFullTasks();
});
document.getElementById('taskSortSelect').addEventListener('change', (e) => { taskSort = e.target.value; renderFullTasks(); });

/* ==========================================================================
   DEADLINES (assignments)
   ========================================================================== */
function renderDeadlines() {
  const container = document.getElementById('dashDeadlines');
  const sorted = [...state.assignments].filter(a => a.status !== 'Completed').sort((a, b) => a.deadline.localeCompare(b.deadline));
  if (sorted.length === 0) { container.innerHTML = `<div class="empty-state"><div class="empty-sub">No upcoming deadlines. Breathe easy.</div></div>`; return; }
  container.innerHTML = sorted.slice(0, 5).map(a => {
    const days = Math.ceil((new Date(a.deadline) - new Date(todayKey())) / 86400000);
    const urgency = days <= 1 ? 'urgent' : days <= 3 ? 'soon' : 'later';
    const label = days <= 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days} days`;
    return `<div class="deadline-item">
      <span class="deadline-dot ${urgency}"></span>
      <div class="deadline-main">
        <div class="deadline-title">${escapeHTML(a.title)}</div>
        <div class="deadline-sub">${escapeHTML(a.subject)} · ${label}</div>
      </div>
    </div>`;
  }).join('');
}

/* ==========================================================================
   SCHEDULE
   ========================================================================== */
function renderSchedule() {
  const grid = document.getElementById('scheduleGrid');
  const todayName = DAYS[new Date().getDay()];
  grid.innerHTML = WEEK_ORDER.map(day => {
    const items = state.schedule.filter(s => s.day === day).sort((a, b) => a.time.localeCompare(b.time));
    return `<div class="sched-day ${day === todayName ? 'today' : ''}">
      <div class="sched-day-name">${day.slice(0, 3)}</div>
      ${items.length ? items.map(it => `
        <div class="sched-item" data-id="${it.id}">
          <div class="sched-time">${formatTime(it.time)}</div>
          <div class="sched-name">${escapeHTML(it.name)}</div>
          <button class="icon-btn sm sched-del" data-action="delete-sched" title="Remove">✕</button>
        </div>`).join('') : `<div class="sched-empty">Free day</div>`}
    </div>`;
  }).join('');
  grid.querySelectorAll('[data-action="delete-sched"]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.closest('.sched-item').dataset.id;
    state.schedule = state.schedule.filter(s => s.id !== id);
    saveState(); renderSchedule();
    toast('Class removed');
  }));
}
function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}
document.getElementById('scheduleForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('schedClassInput').value.trim();
  const day = document.getElementById('schedDayInput').value;
  const time = document.getElementById('schedTimeInput').value;
  if (!name || !time) return;
  state.schedule.push({ id: uid(), day, time, name });
  saveState(); renderSchedule(); e.target.reset(); closeAllModals();
  toast('Class added');
});

/* ==========================================================================
   SUBJECTS
   ========================================================================== */
function renderSubjects() {
  const grid = document.getElementById('subjectGrid');
  if (state.subjects.length === 0) { grid.innerHTML = emptyTasksHTML(); return; }
  grid.innerHTML = state.subjects.map(s => {
    const assignCount = state.assignments.filter(a => a.subject === s.name).length;
    return `<div class="subject-card" data-id="${s.id}">
      <div class="subject-name">${escapeHTML(s.name)}</div>
      <div class="subject-teacher">${escapeHTML(s.teacher || 'No teacher set')}</div>
      <div class="subject-progress-row"><span>Progress</span><span>${s.progress}%</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${s.progress}%"></div></div>
      <div class="subject-stats">
        <div class="subject-stat"><strong>${assignCount}</strong>Assignments</div>
        <div class="subject-stat"><strong>${s.studyHours}h</strong>Study time</div>
      </div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.subject-card').forEach(card => card.addEventListener('click', () => {
    const s = state.subjects.find(x => x.id === card.dataset.id);
    const np = prompt(`Update progress for ${s.name} (0-100):`, s.progress);
    if (np !== null && !isNaN(np)) {
      s.progress = Math.max(0, Math.min(100, Number(np)));
      saveState(); renderSubjects();
      toast('Subject updated');
    }
  }));
}
document.getElementById('subjectForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('subjNameInput').value.trim();
  if (!name) return;
  state.subjects.push({ id: uid(), name, teacher: document.getElementById('subjTeacherInput').value.trim(), progress: 0, studyHours: 0 });
  saveState(); renderSubjects(); e.target.reset(); closeAllModals();
  toast('Subject added');
});

/* ==========================================================================
   NOTES
   ========================================================================== */
let noteFilter = 'all';
let noteSearch = '';
function renderNotes() {
  const grid = document.getElementById('notesGrid');
  let list = [...state.notes].sort((a, b) => b.created - a.created);
  if (noteFilter !== 'all') list = list.filter(n => n.category === noteFilter);
  if (noteSearch) list = list.filter(n => (n.title + n.content).toLowerCase().includes(noteSearch.toLowerCase()));
  if (list.length === 0) { grid.innerHTML = `<div class="empty-state"><div class="empty-emoji">📝</div><div class="empty-title">No notes here.</div><div class="empty-sub">Capture your first idea.</div><button class="empty-cta" data-open-modal="noteModal">New note →</button></div>`; grid.querySelectorAll('[data-open-modal]').forEach(b => b.addEventListener('click', () => openModal(b.dataset.openModal))); return; }
  grid.innerHTML = list.map(n => `
    <div class="note-card" data-id="${n.id}">
      <div class="note-card-head">
        <div class="note-title">${escapeHTML(n.title)}</div>
        <span class="note-cat">${n.category}</span>
      </div>
      <div class="note-body">${escapeHTML(n.content)}</div>
      <div class="note-foot">
        <span class="note-date">${new Date(n.created).toLocaleDateString()}</span>
        <button class="note-del" data-action="delete">Delete</button>
      </div>
    </div>`).join('');
  grid.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.closest('.note-card').dataset.id;
    state.notes = state.notes.filter(n => n.id !== id);
    saveState(); renderNotes();
    toast('Note deleted');
  }));
}
document.getElementById('noteForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('noteTitleInput').value.trim();
  if (!title) return;
  state.notes.unshift({ id: uid(), title, category: document.getElementById('noteCategoryInput').value, content: document.getElementById('noteContentInput').value.trim(), created: Date.now() });
  saveState(); renderNotes(); e.target.reset(); closeAllModals();
  toast('Note saved');
});
document.getElementById('noteFilterChips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#noteFilterChips .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  noteFilter = chip.dataset.filter;
  renderNotes();
});
document.getElementById('noteSearchInput').addEventListener('input', (e) => { noteSearch = e.target.value; renderNotes(); });

/* ==========================================================================
   GOALS
   ========================================================================== */
function renderGoals() {
  const grid = document.getElementById('goalGrid');
  if (state.goals.length === 0) { grid.innerHTML = emptyTasksHTML(); return; }
  grid.innerHTML = state.goals.map(g => `
    <div class="goal-card" data-id="${g.id}">
      <div class="goal-card-head"><span class="goal-title">${escapeHTML(g.title)}</span><span class="goal-pct">${g.progress}%</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${g.progress}%"></div></div>
      <input type="range" class="goal-slider" min="0" max="100" value="${g.progress}" data-action="update" />
    </div>`).join('');
  grid.querySelectorAll('[data-action="update"]').forEach(slider => slider.addEventListener('input', () => {
    const id = slider.closest('.goal-card').dataset.id;
    const g = state.goals.find(x => x.id === id);
    g.progress = Number(slider.value);
    slider.closest('.goal-card').querySelector('.goal-pct').textContent = g.progress + '%';
    slider.closest('.goal-card').querySelector('.progress-fill').style.width = g.progress + '%';
    saveState();
  }));
}
document.getElementById('goalForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('goalTitleInput').value.trim();
  if (!title) return;
  state.goals.push({ id: uid(), title, progress: Number(document.getElementById('goalProgressInput').value) });
  saveState(); renderGoals(); e.target.reset(); closeAllModals();
  toast('Goal added');
});

/* ==========================================================================
   CODING HUB
   ========================================================================== */
function renderCoding() {
  document.getElementById('dashCodingStreak').textContent = state.streak.current;
  document.getElementById('codingStreakBig').textContent = state.streak.current;
  document.getElementById('codingStreakLongest').textContent = state.streak.longest;
  document.getElementById('dashCodingGoal').textContent = state.codingGoalText;
  document.getElementById('codingGoalText').textContent = state.codingGoalText;

  const skillList = document.getElementById('skillList');
  skillList.innerHTML = state.skills.map(s => `
    <div class="skill-row" data-id="${s.id}">
      <div class="skill-name">${escapeHTML(s.name)}</div>
      <div class="skill-track" data-action="scrub"><div class="skill-fill" style="width:${s.progress}%"></div></div>
      <div class="skill-pct">${s.progress}%</div>
    </div>`).join('');
  skillList.querySelectorAll('.skill-track').forEach(track => track.addEventListener('click', (e) => {
    const rect = track.getBoundingClientRect();
    const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const id = track.closest('.skill-row').dataset.id;
    const s = state.skills.find(x => x.id === id);
    s.progress = Math.max(0, Math.min(100, pct));
    saveState(); renderCoding();
  }));

  renderWeekChart('dashWeekChart', getWeekMinutes('studyMinutes'));
  renderWeekChart('codingWeekChart', getWeekMinutes('codingMinutes'));
}
document.getElementById('editCodingGoalBtn').addEventListener('click', () => {
  const val = prompt('Set today\'s coding goal:', state.codingGoalText);
  if (val) { state.codingGoalText = val; saveState(); renderCoding(); }
});
document.getElementById('learningForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('learningNameInput').value.trim();
  if (!name) return;
  state.skills.push({ id: uid(), name, progress: Number(document.getElementById('learningProgressInput').value) });
  saveState(); renderCoding(); e.target.reset(); closeAllModals();
  toast('Learning track added');
});
function startCodingSession() {
  toast('🎧 Coding playlist ready');
  setPlaylist('coding');
  if (!isPlaying) togglePlay();
  switchView('coding');
}
document.getElementById('startCodingBtn').addEventListener('click', startCodingSession);
document.getElementById('startCodingBtn2').addEventListener('click', startCodingSession);

function registerActivity() {
  const today = todayKey();
  if (state.streak.lastActiveDate === today) return;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (state.streak.lastActiveDate === todayKey(yesterday)) {
    state.streak.current += 1;
  } else {
    state.streak.current = 1;
  }
  state.streak.longest = Math.max(state.streak.longest, state.streak.current);
  state.streak.lastActiveDate = today;
  saveState();
}

/* ==========================================================================
   WEEK CHART (shared)
   ========================================================================== */
function getWeekMinutes(field) {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = todayKey(d);
    out.push({ label: DAYS[d.getDay()].slice(0, 1), minutes: state.dailyLog[key]?.[field] || 0, isToday: i === 0 });
  }
  return out;
}
function renderWeekChart(elId, data) {
  const el = document.getElementById(elId);
  if (!el) return;
  const max = Math.max(...data.map(d => d.minutes), 30);
  el.innerHTML = data.map(d => `
    <div class="bar-col ${d.isToday ? 'today' : ''}">
      <div class="bar" style="height:${Math.max(4, (d.minutes / max) * 100)}%" title="${d.minutes} min"></div>
      <div class="bar-label">${d.label}</div>
    </div>`).join('');
}

/* ==========================================================================
   ANALYTICS
   ========================================================================== */
function renderAnalytics() {
  const totalStudyMin = Object.values(state.dailyLog).reduce((sum, d) => sum + (d.studyMinutes || 0), 0);
  const totalCodingMin = Object.values(state.dailyLog).reduce((sum, d) => sum + (d.codingMinutes || 0), 0);
  document.getElementById('anaStudyHours').textContent = (totalStudyMin / 60).toFixed(1) + 'h';
  document.getElementById('anaCodingHours').textContent = (totalCodingMin / 60).toFixed(1) + 'h';
  document.getElementById('anaTasksDone').textContent = state.tasks.filter(t => t.done).length;
  document.getElementById('anaPomos').textContent = Object.values(state.dailyLog).reduce((s, d) => s + Math.round((d.studyMinutes || 0) / 25), 0);
  document.getElementById('anaStreak').textContent = state.streak.current;
  document.getElementById('anaLongest').textContent = state.streak.longest;

  const el = document.getElementById('anaWeekChart');
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    data.push({ label: DAYS[d.getDay()].slice(0, 1), minutes: state.dailyLog[todayKey(d)]?.tasksCompleted || 0, isToday: i === 0 });
  }
  const max = Math.max(...data.map(d => d.minutes), 3);
  el.innerHTML = data.map(d => `
    <div class="bar-col ${d.isToday ? 'today' : ''}">
      <div class="bar" style="height:${Math.max(4, (d.minutes / max) * 100)}%" title="${d.minutes} tasks"></div>
      <div class="bar-label">${d.label}</div>
    </div>`).join('');
}

/* ==========================================================================
   DASHBOARD STATS
   ========================================================================== */
function renderStats() {
  const done = state.tasks.filter(t => t.done).length;
  const total = state.tasks.length;
  const left = total - done;
  document.getElementById('statTasksDone').textContent = done;
  document.getElementById('statTasksBar').style.width = total ? `${(done / total) * 100}%` : '0%';
  document.getElementById('statTasksLeft').textContent = left;
  document.getElementById('statTasksLeftSub').textContent = left === 0 ? 'All clear' : `${left} task${left === 1 ? '' : 's'} to go`;

  const log = getLog();
  const h = Math.floor(log.studyMinutes / 60), m = log.studyMinutes % 60;
  document.getElementById('statStudyTime').textContent = `${h}h ${m}m`;
  document.getElementById('statStreak').textContent = state.streak.current;
  document.getElementById('sidebarStreak').textContent = state.streak.current;
}

/* ==========================================================================
   POMODORO
   ========================================================================== */
const POMO_WORK = 25 * 60, POMO_BREAK = 5 * 60;
let pomoState = { secondsLeft: POMO_WORK, running: false, onBreak: false, interval: null, taskLabel: 'No task selected' };

function pomoTick() {
  if (pomoState.secondsLeft <= 0) {
    pomoSessionEnd();
    return;
  }
  pomoState.secondsLeft--;
  renderPomo();
}
function pomoSessionEnd() {
  clearInterval(pomoState.interval);
  pomoState.running = false;
  if (!pomoState.onBreak) {
    // finished a focus session
    const log = getLog();
    log.studyMinutes += 25;
    log.codingMinutes += 25;
    registerActivity();
    const today = todayKey();
    if (state.pomo.lastDate !== today) { state.pomo.sessionsToday = 0; state.pomo.lastDate = today; }
    state.pomo.sessionsToday += 1;
    saveState();
    toast('🎉 Focus session complete!', 'success');
    pauseMusic();
    pomoState.onBreak = true;
    pomoState.secondsLeft = POMO_BREAK;
  } else {
    toast('Break\'s over — ready for another round?');
    pomoState.onBreak = false;
    pomoState.secondsLeft = POMO_WORK;
  }
  renderPomo();
  renderStats(); renderCoding(); renderAnalytics();
  if (focusOverlayActive) closeFocusMode();
}
function pomoStart() {
  if (pomoState.running) return;
  pomoState.running = true;
  pomoState.interval = setInterval(pomoTick, 1000);
  renderPomo();
}
function pomoPause() {
  pomoState.running = false;
  clearInterval(pomoState.interval);
  renderPomo();
}
function pomoReset() {
  pomoState.running = false;
  clearInterval(pomoState.interval);
  pomoState.onBreak = false;
  pomoState.secondsLeft = POMO_WORK;
  renderPomo();
}
function renderPomo() {
  const mm = String(Math.floor(pomoState.secondsLeft / 60)).padStart(2, '0');
  const ss = String(pomoState.secondsLeft % 60).padStart(2, '0');
  const timeStr = `${mm}:${ss}`;
  document.getElementById('pomoTime').textContent = timeStr;
  document.getElementById('pomoModeLabel').textContent = pomoState.onBreak ? 'BREAK' : 'FOCUS SESSION';
  document.getElementById('pomoTaskLabel').textContent = pomoState.taskLabel;
  document.getElementById('pomoSessionsToday').textContent = state.pomo.sessionsToday;
  if (focusOverlayActive) {
    document.getElementById('focusTime').textContent = timeStr;
  }
}
document.getElementById('pomoStartBtn').addEventListener('click', pomoStart);
document.getElementById('pomoPauseBtn').addEventListener('click', pomoPause);
document.getElementById('pomoResetBtn').addEventListener('click', pomoReset);

/* ==========================================================================
   MUSIC PLAYER
   ========================================================================== */
const audioEl = document.getElementById('audioEl');

const PLAYLISTS = {
  deepFocus: { label: '🎧 Deep Focus', tracks: [
    { title: 'Still Waters', artist: 'Deep Focus', art: '🎧', src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
    { title: 'Quiet Hours', artist: 'Deep Focus', art: '🎧', src: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8fbf68f0d.mp3' }
  ]},
  coding: { label: '💻 Coding Mode', tracks: [
    { title: 'Midnight Coding', artist: 'Study Beats', art: '💻', src: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1a4cc0640.mp3' },
    { title: 'Terminal Loop', artist: 'Study Beats', art: '💻', src: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_00fa5b41d5.mp3' }
  ]},
  lateNight: { label: '🌙 Late Night Study', tracks: [
    { title: 'After Hours', artist: 'Night Owl', art: '🌙', src: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_2dde668d05.mp3' }
  ]},
  chill: { label: '☕ Chill Study', tracks: [
    { title: 'Slow Mornings', artist: 'Chill Desk', art: '☕', src: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_dc39bde808.mp3' }
  ]},
  energy: { label: '⚡ Energy', tracks: [
    { title: 'Bright Momentum', artist: 'Energy Lab', art: '⚡', src: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946bc1a4d1.mp3' }
  ]},
  ambient: { label: '🌧️ Rain & Ambient', tracks: [
    { title: 'Soft Rain', artist: 'Ambient Room', art: '🌧️', src: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_e5d40c2d0c.mp3' }
  ]}
};

let isPlaying = false;
let focusOverlayActive = false;

function currentPlaylistTracks() {
  if (state.music.playlist === 'custom') return state.music.customTracks;
  return PLAYLISTS[state.music.playlist]?.tracks || [];
}
function currentTrack() {
  const tracks = currentPlaylistTracks();
  return tracks[state.music.trackIndex] || null;
}

function setPlaylist(key) {
  state.music.playlist = key;
  state.music.trackIndex = 0;
  saveState();
  loadTrack(false);
  renderMusicPanel();
}

function loadTrack(autoplay) {
  const track = currentTrack();
  if (!track) { updateNowPlayingUI(null); return; }
  audioEl.src = track.src;
  audioEl.volume = state.music.volume / 100;
  updateNowPlayingUI(track);
  if (autoplay) audioEl.play().catch(() => { toast('Audio preview unavailable — try Add Your Music for local files'); });
}

function updateNowPlayingUI(track) {
  const title = track ? track.title : 'Nothing playing';
  const artist = track ? track.artist : 'Pick a playlist';
  const art = track ? track.art || '🎵' : '🎵';
  document.getElementById('miniTitle').textContent = title;
  document.getElementById('miniArtist').textContent = artist;
  document.getElementById('miniArt').textContent = art;
  document.getElementById('mpTitle').textContent = title;
  document.getElementById('mpArtist').textContent = artist;
  document.getElementById('mpArt').textContent = art;
  document.getElementById('focusTrackLabel').textContent = track ? `🎵 ${track.title}` : '🎵 Nothing playing';
}

function togglePlay() {
  if (!currentTrack()) { toast('Choose a playlist first'); return; }
  if (isPlaying) { audioEl.pause(); } else { audioEl.play().catch(() => toast('Playback unavailable in this environment')); }
}
function pauseMusic() { audioEl.pause(); }

audioEl.addEventListener('play', () => {
  isPlaying = true;
  document.getElementById('miniPlayBtn').textContent = '⏸';
  document.getElementById('mpPlayBtn').textContent = '⏸';
  document.getElementById('miniArt').classList.add('playing');
  document.getElementById('mpArt').classList.add('playing');
  document.getElementById('miniEq').classList.add('playing');
  document.getElementById('mpEq').classList.add('playing');
});
audioEl.addEventListener('pause', () => {
  isPlaying = false;
  document.getElementById('miniPlayBtn').textContent = '▶';
  document.getElementById('mpPlayBtn').textContent = '▶';
  document.getElementById('miniArt').classList.remove('playing');
  document.getElementById('mpArt').classList.remove('playing');
  document.getElementById('miniEq').classList.remove('playing');
  document.getElementById('mpEq').classList.remove('playing');
});
audioEl.addEventListener('timeupdate', () => {
  if (!audioEl.duration) return;
  const pct = (audioEl.currentTime / audioEl.duration) * 100;
  document.getElementById('miniProgressFill').style.width = pct + '%';
  document.getElementById('mpProgressFill').style.width = pct + '%';
  document.getElementById('mpCurrentTime').textContent = formatSeconds(audioEl.currentTime);
  document.getElementById('mpDuration').textContent = formatSeconds(audioEl.duration);
});
audioEl.addEventListener('ended', () => {
  if (state.music.repeat) { audioEl.currentTime = 0; audioEl.play(); return; }
  nextTrack();
});
function formatSeconds(s) { if (!isFinite(s)) return '0:00'; const m = Math.floor(s / 60); const sec = String(Math.floor(s % 60)).padStart(2, '0'); return `${m}:${sec}`; }

function nextTrack() {
  const tracks = currentPlaylistTracks();
  if (tracks.length === 0) return;
  if (state.music.shuffle) {
    state.music.trackIndex = Math.floor(Math.random() * tracks.length);
  } else {
    state.music.trackIndex = (state.music.trackIndex + 1) % tracks.length;
  }
  saveState();
  loadTrack(isPlaying);
  renderMusicPanel();
}
function prevTrack() {
  const tracks = currentPlaylistTracks();
  if (tracks.length === 0) return;
  state.music.trackIndex = (state.music.trackIndex - 1 + tracks.length) % tracks.length;
  saveState();
  loadTrack(isPlaying);
  renderMusicPanel();
}

/* Mini player controls */
document.getElementById('miniPlayBtn').addEventListener('click', togglePlay);
document.getElementById('miniNextBtn').addEventListener('click', nextTrack);
document.getElementById('miniPrevBtn').addEventListener('click', prevTrack);
document.getElementById('miniProgressTrack').addEventListener('click', (e) => seekTo(e, 'miniProgressTrack'));
document.getElementById('miniExpandBtn').addEventListener('click', openMusicPanel);

/* Expanded panel controls */
document.getElementById('mpPlayBtn').addEventListener('click', togglePlay);
document.getElementById('mpNextBtn').addEventListener('click', nextTrack);
document.getElementById('mpPrevBtn').addEventListener('click', prevTrack);
document.getElementById('mpProgressTrack').addEventListener('click', (e) => seekTo(e, 'mpProgressTrack'));
document.getElementById('mpVolume').addEventListener('input', (e) => {
  state.music.volume = Number(e.target.value);
  audioEl.volume = state.music.volume / 100;
  saveState();
});
document.getElementById('mpShuffleBtn').addEventListener('click', () => {
  state.music.shuffle = !state.music.shuffle;
  document.getElementById('mpShuffleBtn').style.color = state.music.shuffle ? 'var(--teal)' : '';
  saveState();
  toast(state.music.shuffle ? 'Shuffle on' : 'Shuffle off');
});
document.getElementById('mpRepeatBtn').addEventListener('click', () => {
  state.music.repeat = !state.music.repeat;
  document.getElementById('mpRepeatBtn').style.color = state.music.repeat ? 'var(--teal)' : '';
  saveState();
  toast(state.music.repeat ? 'Repeat on' : 'Repeat off');
});

function seekTo(e, trackId) {
  if (!audioEl.duration) return;
  const rect = document.getElementById(trackId).getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  audioEl.currentTime = pct * audioEl.duration;
}

document.getElementById('closeMusicPanelBtn').addEventListener('click', closeMusicPanel);
document.getElementById('musicPanelOverlay').addEventListener('click', (e) => { if (e.target.id === 'musicPanelOverlay') closeMusicPanel(); });
function openMusicPanel() { document.getElementById('musicPanelOverlay').classList.add('active'); renderMusicPanel(); }
function closeMusicPanel() { document.getElementById('musicPanelOverlay').classList.remove('active'); }

function renderMusicPanel() {
  const playlistsEl = document.getElementById('mpPlaylists');
  const entries = Object.entries(PLAYLISTS);
  playlistsEl.innerHTML = entries.map(([key, pl]) => `
    <button class="mp-playlist-item ${state.music.playlist === key ? 'active' : ''}" data-key="${key}">${pl.label}</button>
  `).join('') + (state.music.customTracks.length ? `<button class="mp-playlist-item ${state.music.playlist === 'custom' ? 'active' : ''}" data-key="custom">📁 Your Music</button>` : '');
  playlistsEl.querySelectorAll('.mp-playlist-item').forEach(btn => btn.addEventListener('click', () => setPlaylist(btn.dataset.key)));

  const queueEl = document.getElementById('mpQueue');
  const tracks = currentPlaylistTracks();
  queueEl.innerHTML = tracks.length ? tracks.map((t, i) => `
    <div class="mp-queue-item ${i === state.music.trackIndex ? 'active' : ''}" data-idx="${i}">${i === state.music.trackIndex && isPlaying ? '▶' : '·'} ${escapeHTML(t.title)}</div>
  `).join('') : `<div class="mp-queue-item">No tracks in this playlist</div>`;
  queueEl.querySelectorAll('.mp-queue-item[data-idx]').forEach(item => item.addEventListener('click', () => {
    state.music.trackIndex = Number(item.dataset.idx);
    saveState(); loadTrack(true); renderMusicPanel();
  }));

  document.getElementById('mpVolume').value = state.music.volume;
  document.getElementById('mpShuffleBtn').style.color = state.music.shuffle ? 'var(--teal)' : '';
  document.getElementById('mpRepeatBtn').style.color = state.music.repeat ? 'var(--teal)' : '';
}

/* Local file upload */
document.getElementById('audioUploadInput').addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  files.forEach(file => {
    const url = URL.createObjectURL(file);
    state.music.customTracks.push({ title: file.name.replace(/\.[^/.]+$/, ''), artist: 'Your library', art: '🎶', src: url });
  });
  state.music.playlist = 'custom';
  state.music.trackIndex = state.music.customTracks.length - files.length;
  saveState();
  loadTrack(false);
  renderMusicPanel();
  toast(`Added ${files.length} track${files.length > 1 ? 's' : ''} to Your Music`);
});

/* ==========================================================================
   FOCUS MODE
   ========================================================================== */
function enterFocusMode() {
  focusOverlayActive = true;
  document.getElementById('focusOverlay').classList.add('active');
  const nextUndone = state.tasks.find(t => !t.done);
  pomoState.taskLabel = nextUndone ? nextUndone.title : 'Deep work session';
  document.getElementById('focusTaskLabel').textContent = pomoState.taskLabel;
  renderPomo();
  if (!currentTrack()) setPlaylist('coding');
  if (!isPlaying) togglePlay();
  if (!pomoState.running) pomoStart();
}
function closeFocusMode() {
  focusOverlayActive = false;
  document.getElementById('focusOverlay').classList.remove('active');
}
document.getElementById('focusLaunchBtn').addEventListener('click', enterFocusMode);
document.getElementById('focusExitBtn').addEventListener('click', closeFocusMode);
document.getElementById('focusPauseBtn').addEventListener('click', () => {
  if (pomoState.running) { pomoPause(); document.getElementById('focusPauseBtn').textContent = 'Resume'; }
  else { pomoStart(); document.getElementById('focusPauseBtn').textContent = 'Pause'; }
});

/* ==========================================================================
   SEARCH
   ========================================================================== */
const searchOverlay = document.getElementById('searchOverlay');
function openSearch() {
  searchOverlay.classList.add('active');
  document.getElementById('searchPanelInput').value = '';
  document.getElementById('searchResults').innerHTML = '';
  setTimeout(() => document.getElementById('searchPanelInput').focus(), 50);
}
function closeSearch() { searchOverlay.classList.remove('active'); }
document.getElementById('searchTriggerBtn').addEventListener('click', openSearch);
document.getElementById('mobileSearchBtn').addEventListener('click', openSearch);
document.getElementById('closeSearchBtn').addEventListener('click', closeSearch);
searchOverlay.addEventListener('click', (e) => { if (e.target === searchOverlay) closeSearch(); });

document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    openSearch();
  }
});

document.getElementById('searchPanelInput').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  const results = document.getElementById('searchResults');
  if (!q) { results.innerHTML = ''; return; }
  const items = [];
  state.tasks.forEach(t => { if (t.title.toLowerCase().includes(q)) items.push({ type: 'Task', label: t.title, view: 'tasks' }); });
  state.notes.forEach(n => { if ((n.title + n.content).toLowerCase().includes(q)) items.push({ type: 'Note', label: n.title, view: 'notes' }); });
  state.subjects.forEach(s => { if (s.name.toLowerCase().includes(q)) items.push({ type: 'Subject', label: s.name, view: 'subjects' }); });
  state.goals.forEach(g => { if (g.title.toLowerCase().includes(q)) items.push({ type: 'Goal', label: g.title, view: 'goals' }); });
  state.assignments.forEach(a => { if (a.title.toLowerCase().includes(q)) items.push({ type: 'Assignment', label: a.title, view: 'tasks' }); });

  if (items.length === 0) { results.innerHTML = `<div class="empty-state"><div class="empty-sub">No matches found.</div></div>`; return; }
  results.innerHTML = items.slice(0, 20).map(it => `
    <div class="search-result" data-view="${it.view}"><span class="search-result-type">${it.type}</span><span class="search-result-title">${escapeHTML(it.label)}</span></div>
  `).join('');
  results.querySelectorAll('.search-result').forEach(r => r.addEventListener('click', () => { switchView(r.dataset.view); closeSearch(); }));
});

/* ==========================================================================
   SETTINGS
   ========================================================================== */
function renderSettings() {
  document.getElementById('settingsUsername').value = state.settings.username;
  document.getElementById('settingsStartOfWeek').value = state.settings.startOfWeek;
  document.getElementById('themeToggle').classList.toggle('on', state.settings.theme === 'light');
  document.getElementById('notifToggle').classList.toggle('on', state.settings.notifications);
  document.body.classList.toggle('theme-light', state.settings.theme === 'light');
}
document.getElementById('themeToggle').addEventListener('click', () => {
  state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light';
  saveState(); renderSettings();
});
document.getElementById('notifToggle').addEventListener('click', () => {
  state.settings.notifications = !state.settings.notifications;
  saveState(); renderSettings();
  toast('Notifications ' + (state.settings.notifications ? 'enabled' : 'disabled'), 'force');
});
document.getElementById('settingsUsername').addEventListener('input', (e) => {
  state.settings.username = e.target.value || 'Student';
  saveState(); renderHeader();
});
document.getElementById('settingsStartOfWeek').addEventListener('change', (e) => {
  state.settings.startOfWeek = e.target.value; saveState();
});
document.getElementById('resetDataBtn').addEventListener('click', () => {
  askConfirm('Reset all data?', 'This will permanently erase every task, note, goal, and setting stored in this browser.', () => {
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    saveState();
    renderAll();
    toast('All data has been reset', 'force');
  });
});

/* ==========================================================================
   UTIL
   ========================================================================== */
function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ==========================================================================
   RENDER ALL
   ========================================================================== */
function renderAll() {
  renderHeader();
  renderStats();
  renderDashboardTasks();
  renderFullTasks();
  renderDeadlines();
  renderSchedule();
  renderSubjects();
  renderNotes();
  renderGoals();
  renderCoding();
  renderAnalytics();
  renderPomo();
  renderSettings();
  updateNowPlayingUI(currentTrack());
}

/* ==========================================================================
   INIT
   ========================================================================== */
function init() {
  loadTrack(false);
  renderAll();
  setInterval(renderHeader, 60000); // keep date/greeting fresh
}
init();
