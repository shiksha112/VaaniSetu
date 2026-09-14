/* =========================================================
   VaaniSetu — app.js
   Shared, page-agnostic utilities:
     - VaaniSetuData: the data access layer. Every function
       returns a Promise so that swapping the localStorage
       implementation for real `fetch()` calls to the future
       FastAPI backend requires no changes in calling code.
     - Toast notifications
     - Generic modal open/close helpers
   ========================================================= */

/* ---------------------------------------------------------
   Data layer
   Storage keys are namespaced so this can coexist with other
   data VaaniSetu might store in the browser later.
   --------------------------------------------------------- */
const VaaniSetuData = (() => {
  const KEYS = {
    subjects: 'vaanisetu.subjects',
    lessons: 'vaanisetu.lessons',
    activities: 'vaanisetu.activities',
    notes: 'vaanisetu.notes',
  };

  // ---- low-level storage helpers (the only place that touches localStorage) ----
  function readAll(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error(`VaaniSetuData: failed to read ${key}`, err);
      return [];
    }
  }

  function writeAll(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  }

  function generateId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  // ---- Subjects -------------------------------------------------
  // Later: replace body with `return fetch('/api/subjects').then(r => r.json());`
  function getSubjects() {
    return Promise.resolve(readAll(KEYS.subjects));
  }

  function addSubject(subject) {
    const subjects = readAll(KEYS.subjects);
    const record = {
      id: generateId('subj'),
      name: subject.name,
      className: subject.className,
      teachingLanguage: subject.teachingLanguage,
      studentLanguage: subject.studentLanguage,
      lessonCount: 0,
      progress: 0,
      createdAt: new Date().toISOString(),
    };
    subjects.push(record);
    writeAll(KEYS.subjects, subjects);
    return Promise.resolve(record);
  }

  function updateSubjectStats(subjectId, { lessonCount, progress }) {
    const subjects = readAll(KEYS.subjects);
    const idx = subjects.findIndex((s) => s.id === subjectId);
    if (idx === -1) return Promise.resolve(null);
    if (lessonCount !== undefined) subjects[idx].lessonCount = lessonCount;
    if (progress !== undefined) subjects[idx].progress = progress;
    writeAll(KEYS.subjects, subjects);
    return Promise.resolve(subjects[idx]);
  }

  // ---- Lessons ----------------------------------------------------
  function getLessons() {
    return Promise.resolve(readAll(KEYS.lessons));
  }

  function addLesson(lesson) {
    const lessons = readAll(KEYS.lessons);
    const record = {
      id: generateId('lsn'),
      subjectId: lesson.subjectId,
      subjectName: lesson.subjectName,
      title: lesson.title,
      className: lesson.className,
      description: lesson.description || '',
      teachingLanguage: lesson.teachingLanguage,
      studentLanguage: lesson.studentLanguage,
      date: lesson.date,
      time: lesson.time,
      notes: lesson.notes || '',
      status: lesson.status || 'draft', // 'draft' | 'published'
      completed: false,
      createdAt: new Date().toISOString(),
    };
    lessons.push(record);
    writeAll(KEYS.lessons, lessons);
    return Promise.resolve(record);
  }

  function updateLesson(lessonId, changes) {
    const lessons = readAll(KEYS.lessons);
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx === -1) return Promise.resolve(null);
    lessons[idx] = { ...lessons[idx], ...changes };
    writeAll(KEYS.lessons, lessons);
    return Promise.resolve(lessons[idx]);
  }

  // ---- Activity feed ------------------------------------------------
  function getActivities() {
    return Promise.resolve(readAll(KEYS.activities));
  }

  function addActivity(activity) {
    const activities = readAll(KEYS.activities);
    const record = {
      id: generateId('act'),
      lessonId: activity.lessonId,
      subject: activity.subject,
      lessonTitle: activity.lessonTitle,
      date: activity.date || new Date().toISOString(),
      status: activity.status || 'completed',
    };
    activities.unshift(record); // newest first
    writeAll(KEYS.activities, activities);
    return Promise.resolve(record);
  }

  // ---- Notes ----------------------------------------------------
  function getNotes() {
    return Promise.resolve(readAll(KEYS.notes));
  }

  function addNote(note) {
    const notes = readAll(KEYS.notes);
    const record = {
      id: generateId('note'),
      subjectId: note.subjectId || null,
      subjectName: note.subjectName || '',
      title: note.title,
      content: note.content,
      createdAt: new Date().toISOString(),
    };
    notes.unshift(record);
    writeAll(KEYS.notes, notes);
    return Promise.resolve(record);
  }

  return {
    getSubjects, addSubject, updateSubjectStats,
    getLessons, addLesson, updateLesson,
    getActivities, addActivity,
    getNotes, addNote,
  };
})();

/* ---------------------------------------------------------
   Toast notifications
   --------------------------------------------------------- */
function showToast(message, { icon = 'check-circle' } = {}) {
  const stack = document.getElementById('toastStack');
  if (!stack) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<i data-lucide="${icon}" class="icon"></i><span></span>`;
  toast.querySelector('span').textContent = message;
  stack.appendChild(toast);

  if (window.lucide) lucide.createIcons({ nodes: [toast] });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'opacity 160ms ease, transform 160ms ease';
    setTimeout(() => toast.remove(), 180);
  }, 2600);
}

/* ---------------------------------------------------------
   Generic modal helpers
   Any element with class "modal-overlay" and an id can be
   opened/closed through these. Handles Escape key, backdrop
   click, and returning focus to the trigger element.
   --------------------------------------------------------- */
let lastFocusedEl = null;

function openModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  lastFocusedEl = document.activeElement;
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  const firstField = overlay.querySelector('input, select, textarea, button');
  if (firstField) firstField.focus();
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocusedEl) lastFocusedEl.focus();
}

// Close any open modal on Escape, and on backdrop click
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.modal-overlay.is-open').forEach((overlay) => {
    closeModal(overlay.id);
  });
  const openPanel = document.querySelector('.side-panel.is-open');
  if (openPanel) closeSidePanel(openPanel.id);
});

document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    closeModal(e.target.id);
  }
});

/* ---------------------------------------------------------
   Side panel helpers (used by Teaching Notes panel)
   --------------------------------------------------------- */
function openSidePanel(panelId, overlayId) {
  document.getElementById(panelId)?.classList.add('is-open');
  document.getElementById(overlayId)?.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeSidePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  panel.classList.remove('is-open');
  document.getElementById(panel.dataset.overlay)?.classList.remove('is-open');
  document.body.style.overflow = '';
}

/* ---------------------------------------------------------
   Small formatting helpers shared across pages
   --------------------------------------------------------- */
function formatFriendlyDate(dateStr) {
  // dateStr expected as 'YYYY-MM-DD'
  if (!dateStr) return '';
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const diffDays = Math.round((target - today) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays < 7) {
    return target.toLocaleDateString('en-IN', { weekday: 'long' });
  }
  return target.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatRelativeDate(isoStr) {
  const date = new Date(isoStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - dateOnly) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function isSameDate(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  return dateStr === todayStr;
}

function formatTime12h(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}
