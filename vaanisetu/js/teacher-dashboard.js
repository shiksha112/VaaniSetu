/* =========================================================
   VaaniSetu — teacher-dashboard.js
   Page-specific logic for the Teacher Dashboard.
   Depends on app.js (VaaniSetuData, showToast, openModal,
   closeModal, formatting helpers) being loaded first.
   ========================================================= */

// In-memory cache of the current render, refreshed after every write.
// Keeping this in module scope avoids re-reading storage inside every
// small helper (e.g. populating a <select>) during a single render pass.
let state = { subjects: [], lessons: [], activities: [], notes: [] };

// Icon chosen per subject name — a light heuristic so common school
// subjects get a recognizable glyph without asking the teacher to pick one.
function iconForSubject(name) {
  const key = name.trim().toLowerCase();
  if (/(math|maths|arithmetic)/.test(key)) return 'calculator';
  if (/(science|environ)/.test(key)) return 'flask-conical';
  if (/(hindi|english|language|santhali|sanskrit|urdu|bengali|tamil)/.test(key)) return 'languages';
  if (/(art|draw|craft)/.test(key)) return 'palette';
  if (/(music)/.test(key)) return 'music';
  if (/(social|history|geo|civics)/.test(key)) return 'globe';
  return 'book-open';
}

/* ---------------------------------------------------------
   Boot
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initNotifications();
  initModals();
  wireQuickActions();
  wireForms();
  refreshAll();
});

async function refreshAll() {
  const [subjects, lessons, activities, notes] = await Promise.all([
    VaaniSetuData.getSubjects(),
    VaaniSetuData.getLessons(),
    VaaniSetuData.getActivities(),
    VaaniSetuData.getNotes(),
  ]);
  state = { subjects, lessons, activities, notes };

  renderTodayLesson();
  renderSubjects();
  renderUpcomingLessons();
  renderRecentActivity();
  renderProgress();
  renderNotifications();
  renderNotes();

  if (window.lucide) lucide.createIcons();
}

/* ---------------------------------------------------------
   Sidebar (nav highlighting + mobile toggle)
   --------------------------------------------------------- */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const openBtn = document.getElementById('hamburgerBtn');
  const closeBtn = document.getElementById('sidebarCloseBtn');

  const openSidebar = () => { sidebar.classList.add('is-open'); overlay.classList.add('is-open'); };
  const closeSidebar = () => { sidebar.classList.remove('is-open'); overlay.classList.remove('is-open'); };

  openBtn?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach((i) => i.classList.remove('is-active'));
      item.classList.add('is-active');
      closeSidebar();

      const targetSelector = item.dataset.target;
      if (targetSelector) {
        document.querySelector(targetSelector)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const action = item.dataset.action;
      if (action === 'notes') openSidePanel('notesPanel', 'notesPanelOverlay');
      if (action === 'baatcheet') window.location.href = '../baatcheet.html';
      if (action === 'settings') showToast('Settings are coming soon.', { icon: 'settings' });
    });
  });
}

/* ---------------------------------------------------------
   Notification dropdown
   --------------------------------------------------------- */
function initNotifications() {
  const bellBtn = document.getElementById('notifBell');
  const dropdown = document.getElementById('notifDropdown');

  bellBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('is-open');
  });

  document.addEventListener('click', (e) => {
    if (dropdown && !dropdown.contains(e.target) && e.target !== bellBtn) {
      dropdown.classList.remove('is-open');
    }
  });
}

function renderNotifications() {
  const list = document.getElementById('notifList');
  const dot = document.getElementById('notifDot');
  if (!list) return;

  const items = [];

  // Most recently published lesson
  const publishedLessons = state.lessons
    .filter((l) => l.status === 'published')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (publishedLessons[0]) {
    items.push({ icon: 'upload', text: `Lesson published: ${publishedLessons[0].title}` });
  }

  // Tomorrow's lesson
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const tomorrowLesson = state.lessons.find((l) => l.date === tomorrowStr && l.status === 'published');
  if (tomorrowLesson) {
    items.push({ icon: 'calendar-clock', text: `Tomorrow: ${tomorrowLesson.subjectName} — ${tomorrowLesson.title}` });
  }

  // Most recent completion
  if (state.activities[0]) {
    items.push({ icon: 'check-circle-2', text: `Lesson "${state.activities[0].lessonTitle}" completed` });
  }

  if (items.length === 0) {
    list.innerHTML = '<li class="notif-empty">You\'re all caught up.</li>';
    dot.style.display = 'none';
  } else {
    list.innerHTML = items
      .slice(0, 4)
      .map((n) => `<li class="notif-item"><i data-lucide="${n.icon}" class="icon"></i><span>${escapeHtml(n.text)}</span></li>`)
      .join('');
    dot.style.display = '';
  }
  if (window.lucide) lucide.createIcons({ nodes: [list] });
}

/* ---------------------------------------------------------
   Today's Lesson (primary card)
   --------------------------------------------------------- */
function renderTodayLesson() {
  const container = document.getElementById('todayLessonCard');
  if (!container) return;

  const todaysLessons = state.lessons
    .filter((l) => isSameDate(l.date) && l.status === 'published' && !l.completed)
    .sort((a, b) => a.time.localeCompare(b.time));

  const lesson = todaysLessons[0];

  if (!lesson) {
    container.innerHTML = `
      <div class="today-card-eyebrow"><i data-lucide="sparkles" class="icon"></i><span>Today's Lesson</span></div>
      <div class="today-empty">
        <p>No lesson scheduled for today.</p>
        <button class="btn btn-primary" id="todayAddLessonBtn">
          <i data-lucide="plus" class="icon"></i> Add Lesson
        </button>
      </div>`;
    document.getElementById('todayAddLessonBtn')?.addEventListener('click', () => openAddLessonModal());
    if (window.lucide) lucide.createIcons({ nodes: [container] });
    return;
  }

  container.innerHTML = `
    <div class="today-card-eyebrow"><i data-lucide="sparkles" class="icon"></i><span>Today's Lesson</span></div>
    <div class="today-card-body">
      <div>
        <p class="today-card-subject">${escapeHtml(lesson.subjectName)} · ${escapeHtml(lesson.className)}</p>
        <h3 class="today-card-title">${escapeHtml(lesson.title)}</h3>
        <div class="today-card-meta">
          <span class="badge badge-blue"><i data-lucide="calendar-check" class="icon"></i> Scheduled</span>
          <span><i data-lucide="clock" class="icon"></i> ${formatTime12h(lesson.time)}</span>
          <span class="lang-bridge"><i data-lucide="languages" class="icon"></i> ${escapeHtml(lesson.teachingLanguage)} → ${escapeHtml(lesson.studentLanguage)}</span>
        </div>
      </div>
      <div class="today-card-cta">
        <button class="btn btn-primary" id="startLessonBtn">
          <i data-lucide="play" class="icon"></i> Start Lesson
        </button>
      </div>
    </div>`;

  document.getElementById('startLessonBtn')?.addEventListener('click', () => startConversationFlow(lesson.id));
  if (window.lucide) lucide.createIcons({ nodes: [container] });
}

/* ---------------------------------------------------------
   My Subjects
   --------------------------------------------------------- */
function renderSubjects() {
  const grid = document.getElementById('subjectsGrid');
  if (!grid) return;

  if (state.subjects.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon"><i data-lucide="book-open" class="icon"></i></div>
        <h4>No Subjects Yet</h4>
        <p>Start by adding your first subject.</p>
        <button class="btn btn-primary" id="emptySubjectsAddBtn"><i data-lucide="plus" class="icon"></i> Add Subject</button>
      </div>`;
    document.getElementById('emptySubjectsAddBtn')?.addEventListener('click', () => openModal('addSubjectModal'));
    if (window.lucide) lucide.createIcons({ nodes: [grid] });
    return;
  }

  const cards = state.subjects.map((s) => `
    <div class="subject-card" data-subject-id="${s.id}">
      <div class="subject-card-top">
        <div class="subject-icon" style="background:var(--color-primary-soft); color:var(--color-primary);">
          <i data-lucide="${iconForSubject(s.name)}" class="icon"></i>
        </div>
        <div>
          <h4>${escapeHtml(s.name)}</h4>
          <p>${s.lessonCount} Lesson${s.lessonCount === 1 ? '' : 's'} · ${escapeHtml(s.className)}</p>
        </div>
      </div>
      <div>
        <div class="progress-track"><div class="progress-fill" style="width:${s.progress}%;"></div></div>
        <div class="progress-label"><span>Progress</span><strong>${s.progress}% completed</strong></div>
      </div>
      <button class="btn btn-secondary btn-block view-subject-btn" data-subject-id="${s.id}">View Subject</button>
    </div>
  `).join('');

  grid.innerHTML = cards + `
    <button class="add-tile" id="subjectsAddTile">
      <i data-lucide="plus" class="icon"></i>
      <span>Add Subject</span>
    </button>`;

  document.getElementById('subjectsAddTile')?.addEventListener('click', () => openModal('addSubjectModal'));
  grid.querySelectorAll('.view-subject-btn').forEach((btn) => {
    btn.addEventListener('click', () => openSubjectDetail(btn.dataset.subjectId));
  });

  if (window.lucide) lucide.createIcons({ nodes: [grid] });
}

function openSubjectDetail(subjectId) {
  const subject = state.subjects.find((s) => s.id === subjectId);
  if (!subject) return;
  const lessons = state.lessons
    .filter((l) => l.subjectId === subjectId)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  document.getElementById('subjectDetailTitle').textContent = subject.name;
  const body = document.getElementById('subjectDetailBody');

  if (lessons.length === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i data-lucide="calendar-plus" class="icon"></i></div>
        <h4>No lessons yet</h4>
        <p>Add a lesson under ${escapeHtml(subject.name)} to see it here.</p>
      </div>`;
  } else {
    body.innerHTML = lessons.map((l) => `
      <div class="note-card">
        <h4>${escapeHtml(l.title)}</h4>
        <p class="note-meta">${escapeHtml(l.className)} · ${l.date} · ${formatTime12h(l.time)}</p>
        <span class="badge ${l.completed ? 'badge-green' : l.status === 'published' ? 'badge-blue' : 'badge-gray'}">
          ${l.completed ? 'Completed' : l.status === 'published' ? 'Published' : 'Draft'}
        </span>
      </div>
    `).join('');
  }
  if (window.lucide) lucide.createIcons({ nodes: [body] });
  openModal('subjectDetailModal');
}

/* ---------------------------------------------------------
   Recent Teaching Activity
   --------------------------------------------------------- */
function renderRecentActivity() {
  const list = document.getElementById('activityList');
  if (!list) return;

  if (state.activities.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i data-lucide="clipboard-list" class="icon"></i></div>
        <h4>No activity yet</h4>
        <p>Completed lessons will show up here.</p>
      </div>`;
    if (window.lucide) lucide.createIcons({ nodes: [list] });
    return;
  }

  list.innerHTML = state.activities.slice(0, 4).map((a) => `
    <div class="activity-item">
      <div class="activity-check"><i data-lucide="check" class="icon"></i></div>
      <div>
        <p class="activity-title">${escapeHtml(a.subject)} — ${escapeHtml(a.lessonTitle)}</p>
        <p class="activity-meta">${formatRelativeDate(a.date)}</p>
      </div>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons({ nodes: [list] });
}

/* ---------------------------------------------------------
   Upcoming Lessons
   --------------------------------------------------------- */
function renderUpcomingLessons() {
  const list = document.getElementById('upcomingList');
  if (!list) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = state.lessons
    .filter((l) => l.status === 'published' && !l.completed && l.date > todayStr)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 4);

  if (upcoming.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i data-lucide="calendar" class="icon"></i></div>
        <h4>Nothing scheduled</h4>
        <p>Publish a lesson to see it here.</p>
      </div>`;
    if (window.lucide) lucide.createIcons({ nodes: [list] });
    return;
  }

  list.innerHTML = upcoming.map((l) => `
    <div class="upcoming-item">
      <div class="upcoming-date"><span class="day">${formatFriendlyDate(l.date)}</span></div>
      <div>
        <p class="upcoming-title">${escapeHtml(l.subjectName)} — ${escapeHtml(l.title)}</p>
        <p class="upcoming-meta">${escapeHtml(l.className)} · ${formatTime12h(l.time)}</p>
      </div>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons({ nodes: [list] });
}

/* ---------------------------------------------------------
   Teaching Progress (this week)
   --------------------------------------------------------- */
function getWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0 Sun ... 6 Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + mondayOffset);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function renderProgress() {
  const completedEl = document.getElementById('statCompleted');
  const plannedEl = document.getElementById('statPlanned');
  const rateEl = document.getElementById('statRate');
  const ringFill = document.getElementById('progressRingFill');
  if (!completedEl) return;

  const { start, end } = getWeekRange();
  const inWeek = (dateStr) => {
    const d = new Date(`${dateStr}T00:00:00`);
    return d >= start && d <= end;
  };

  const plannedThisWeek = state.lessons.filter((l) => l.status === 'published' && inWeek(l.date));
  const completedThisWeek = plannedThisWeek.filter((l) => l.completed);

  const planned = plannedThisWeek.length;
  const completed = completedThisWeek.length;
  const rate = planned > 0 ? Math.round((completed / planned) * 100) : 0;

  completedEl.textContent = completed;
  plannedEl.textContent = planned;
  rateEl.textContent = `${rate}%`;
  if (ringFill) ringFill.style.width = `${rate}%`;
}

/* ---------------------------------------------------------
   Teaching Notes side panel
   --------------------------------------------------------- */
function renderNotes() {
  const list = document.getElementById('notesList');
  if (!list) return;

  if (state.notes.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i data-lucide="notebook-pen" class="icon"></i></div>
        <h4>No notes yet</h4>
        <p>Notes you add for your lessons will appear here.</p>
      </div>`;
    if (window.lucide) lucide.createIcons({ nodes: [list] });
    return;
  }

  list.innerHTML = state.notes.map((n) => `
    <div class="note-card">
      <h4>${escapeHtml(n.title)}</h4>
      <p class="note-meta">${n.subjectName ? escapeHtml(n.subjectName) + ' · ' : ''}${formatRelativeDate(n.createdAt)}</p>
      <p>${escapeHtml(n.content)}</p>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons({ nodes: [list] });
}

/* ---------------------------------------------------------
   Quick actions
   --------------------------------------------------------- */
function wireQuickActions() {
  document.getElementById('qaAddSubject')?.addEventListener('click', () => openModal('addSubjectModal'));

  document.getElementById('qaAddLesson')?.addEventListener('click', () => openAddLessonModal());

  document.getElementById('qaAddNote')?.addEventListener('click', () => openAddNoteModal());

  document.getElementById('qaStartConversation')?.addEventListener('click', () => startConversationFlow());
}

function openAddLessonModal() {
  if (state.subjects.length === 0) {
    showToast('Add a subject first, then add its lessons.', { icon: 'info' });
    openModal('addSubjectModal');
    return;
  }
  populateSubjectSelect('lessonSubjectSelect');
  document.getElementById('addLessonForm').reset();
  clearFormErrors('addLessonForm');
  openModal('addLessonModal');
}

function openAddNoteModal() {
  if (state.subjects.length === 0) {
    showToast('Add a subject first, then attach notes to it.', { icon: 'info' });
    openModal('addSubjectModal');
    return;
  }
  populateSubjectSelect('noteSubjectSelect');
  document.getElementById('addNoteForm').reset();
  clearFormErrors('addNoteForm');
  openModal('addNoteModal');
}

function populateSubjectSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = state.subjects
    .map((s) => `<option value="${s.id}">${escapeHtml(s.name)} — ${escapeHtml(s.className)}</option>`)
    .join('');
}

/* ---------------------------------------------------------
   Modal open/close wiring (close buttons, cancel buttons)
   --------------------------------------------------------- */
function initModals() {
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  document.getElementById('notesPanelCloseBtn')?.addEventListener('click', () => closeSidePanel('notesPanel'));
  document.getElementById('notesPanelAddBtn')?.addEventListener('click', () => {
    closeSidePanel('notesPanel');
    openAddNoteModal();
  });
}

/* ---------------------------------------------------------
   Add Subject form
   --------------------------------------------------------- */
function wireForms() {
  const subjectForm = document.getElementById('addSubjectForm');
  subjectForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors('addSubjectForm');

    const name = document.getElementById('subjectName').value.trim();
    const className = document.getElementById('subjectClass').value;
    const teachingLanguage = document.getElementById('subjectTeachingLang').value;
    const studentLanguage = document.getElementById('subjectStudentLang').value;

    let valid = true;
    if (!name) { setFieldError('subjectName', 'Subject name is required.'); valid = false; }
    if (!valid) return;

    await VaaniSetuData.addSubject({ name, className, teachingLanguage, studentLanguage });
    closeModal('addSubjectModal');
    subjectForm.reset();
    showToast(`"${name}" added to your subjects.`);
    await refreshAll();
  });

  // ---- Add Lesson form (Save Draft vs Publish) ----
  const lessonForm = document.getElementById('addLessonForm');
  lessonForm?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-lesson-status]');
    if (!btn) return;
    e.preventDefault();
    await submitLessonForm(btn.dataset.lessonStatus);
  });

  // ---- Add Note form ----
  const noteForm = document.getElementById('addNoteForm');
  noteForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors('addNoteForm');

    const subjectSelect = document.getElementById('noteSubjectSelect');
    const subject = state.subjects.find((s) => s.id === subjectSelect.value);
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();

    let valid = true;
    if (!title) { setFieldError('noteTitle', 'Give this note a title.'); valid = false; }
    if (!content) { setFieldError('noteContent', 'Write something to save.'); valid = false; }
    if (!valid) return;

    await VaaniSetuData.addNote({
      subjectId: subject?.id, subjectName: subject?.name, title, content,
    });
    closeModal('addNoteModal');
    noteForm.reset();
    showToast('Note saved.');
    await refreshAll();
  });
}

async function submitLessonForm(status) {
  clearFormErrors('addLessonForm');

  const subjectSelect = document.getElementById('lessonSubjectSelect');
  const subject = state.subjects.find((s) => s.id === subjectSelect.value);
  const title = document.getElementById('lessonTitle').value.trim();
  const className = document.getElementById('lessonClass').value;
  const description = document.getElementById('lessonDescription').value.trim();
  const teachingLanguage = document.getElementById('lessonTeachingLang').value;
  const studentLanguage = document.getElementById('lessonStudentLang').value;
  const date = document.getElementById('lessonDate').value;
  const time = document.getElementById('lessonTime').value;
  const notes = document.getElementById('lessonNotes').value.trim();

  let valid = true;
  if (!title) { setFieldError('lessonTitle', 'Lesson title is required.'); valid = false; }
  if (!date) { setFieldError('lessonDate', 'Pick a date.'); valid = false; }
  if (!time) { setFieldError('lessonTime', 'Pick a time.'); valid = false; }
  if (!subject) { setFieldError('lessonSubjectSelect', 'Choose a subject.'); valid = false; }
  if (!valid) return;

  const lesson = await VaaniSetuData.addLesson({
    subjectId: subject.id, subjectName: subject.name, title, className,
    description, teachingLanguage, studentLanguage, date, time, notes, status,
  });

  await recalcSubjectStats(subject.id);

  closeModal('addLessonModal');
  document.getElementById('addLessonForm').reset();
  showToast(status === 'published' ? `"${lesson.title}" published to the student dashboard.` : `"${lesson.title}" saved as a draft.`);
  await refreshAll();
}

async function recalcSubjectStats(subjectId) {
  const lessons = await VaaniSetuData.getLessons();
  const forSubject = lessons.filter((l) => l.subjectId === subjectId);
  const completed = forSubject.filter((l) => l.completed).length;
  const progress = forSubject.length > 0 ? Math.round((completed / forSubject.length) * 100) : 0;
  await VaaniSetuData.updateSubjectStats(subjectId, { lessonCount: forSubject.length, progress });
}

/* ---------------------------------------------------------
   Conversation flow (Start Lesson → simulated session → Complete)
   --------------------------------------------------------- */
let activeConversationLessonId = null;

function startConversationFlow(lessonId) {
  let lesson = lessonId ? state.lessons.find((l) => l.id === lessonId) : null;

  // "Start Conversation" quick action / nav item with no lesson pre-selected:
  // fall back to today's scheduled lesson, if any.
  if (!lesson) {
    lesson = state.lessons.find((l) => isSameDate(l.date) && l.status === 'published' && !l.completed);
  }

  if (!lesson) {
    showToast('No lesson is scheduled to start right now.', { icon: 'info' });
    return;
  }

  activeConversationLessonId = lesson.id;
  document.getElementById('convoLessonTitle').textContent = lesson.title;
  document.getElementById('convoLessonMeta').textContent = `${lesson.subjectName} · ${lesson.className}`;
  document.getElementById('convoLangRow').innerHTML =
    `<i data-lucide="languages" class="icon"></i><span>${escapeHtml(lesson.teachingLanguage)} → ${escapeHtml(lesson.studentLanguage)}</span>`;
  if (window.lucide) lucide.createIcons({ nodes: [document.getElementById('convoLangRow')] });

  openModal('conversationModal');
}

async function completeActiveLesson() {
  if (!activeConversationLessonId) return;
  const lesson = state.lessons.find((l) => l.id === activeConversationLessonId);
  if (!lesson) return;

  await VaaniSetuData.updateLesson(lesson.id, { completed: true });
  await VaaniSetuData.addActivity({
    lessonId: lesson.id, subject: lesson.subjectName, lessonTitle: lesson.title, status: 'completed',
  });
  await recalcSubjectStats(lesson.subjectId);

  closeModal('conversationModal');
  showToast(`"${lesson.title}" marked complete.`, { icon: 'check-circle-2' });
  activeConversationLessonId = null;
  await refreshAll();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('convoCompleteBtn')?.addEventListener('click', completeActiveLesson);
  document.getElementById('convoEndBtn')?.addEventListener('click', () => {
    closeModal('conversationModal');
    activeConversationLessonId = null;
  });
});

/* ---------------------------------------------------------
   Small form-validation helpers
   --------------------------------------------------------- */
function setFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const field = input.closest('.field');
  field?.classList.add('has-error');
  const errorEl = field?.querySelector('.field-error');
  if (errorEl) errorEl.textContent = message;
}

function clearFormErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('.field.has-error').forEach((f) => f.classList.remove('has-error'));
  form.querySelectorAll('.field-error').forEach((e) => { e.textContent = ''; });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
