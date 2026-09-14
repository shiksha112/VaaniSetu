/**
 * VaaniSetu — Student Dashboard page logic
 * Reads only from AppData / TranslationService. No lesson content
 * is ever hardcoded into this file — it always reflects whatever
 * the "teacher" (seed data / localStorage) has published.
 */

const SUBJECT_ICONS = {
  math: '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h4M8 17h6"/>',
  science: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/>',
  language: '<path d="M4 5h9M7 3v2M6 5c0 4.5 3 7 6 8M11 5c-.7 3-3 6-8 7.5"/><path d="M15 20l4-9 4 9M16.3 17h5.4"/>',
  default: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
};

function subjectIcon(subjectId) {
  return SUBJECT_ICONS[subjectId] || SUBJECT_ICONS.default;
}

function iconMarkup(path, cls) {
  return `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

const CHECK_PATH = '<path d="M20 6 9 17l-5-5"/>';
const PLAY_PATH = '<circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4z"/>';
const BOOK_PATH = '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5z"/>';

/* ---------------- greeting ---------------- */

function renderGreeting(student) {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greetingText').textContent = `${part}, ${student.name} 👋`;
}

/* ---------------- topbar: profile, language, notifications ---------------- */

function renderProfileChrome(student) {
  const initial = (student.name || 'S').charAt(0).toUpperCase();
  ['sidebarAvatar', 'topbarAvatar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = initial;
  });
  document.getElementById('sidebarName').textContent = student.name;
  document.getElementById('sidebarClass').textContent = student.className;
  document.getElementById('langPillLabel').textContent = TranslationService.getLanguageLabel(student.learningLanguage);
}

function renderLanguageDropdown(student) {
  const list = document.getElementById('langOptionsList');
  list.innerHTML = '';
  TranslationService.LANGUAGE_CATALOGUE.forEach(lang => {
    const btn = document.createElement('button');
    btn.className = 'lang-option';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(lang.code === student.learningLanguage));
    btn.disabled = !lang.active;
    btn.innerHTML = `<span class="radio"></span><span>${lang.label}</span>` + (!lang.active ? '<span class="soon">Coming soon</span>' : '');
    if (lang.active) {
      btn.addEventListener('click', () => {
        AppData.setStudentLanguage(lang.code);
        UIShell.showToast(`Learning language set to ${lang.label}`);
        renderAll();
        document.getElementById('langDropdown').classList.remove('is-open');
      });
    }
    list.appendChild(btn);
  });
}

function renderSettingsLangChoices(student) {
  const wrap = document.getElementById('settingsLangChoices');
  if (!wrap) return;
  wrap.innerHTML = '';
  TranslationService.LANGUAGE_CATALOGUE.forEach(lang => {
    const btn = document.createElement('button');
    btn.className = 'lang-choice' + (lang.code === student.learningLanguage ? ' is-active' : '');
    btn.textContent = lang.label + (!lang.active ? ' (soon)' : '');
    btn.disabled = !lang.active;
    if (lang.active) {
      btn.addEventListener('click', () => {
        AppData.setStudentLanguage(lang.code);
        UIShell.showToast(`Learning language set to ${lang.label}`);
        renderAll();
      });
    }
    wrap.appendChild(btn);
  });
  document.getElementById('settingsStudentName').textContent = student.name;
  document.getElementById('settingsStudentClass').textContent = student.className;
}

function renderNotifications() {
  const notifs = AppData.getNotifications();
  const list = document.getElementById('notifList');
  const dot = document.getElementById('notifDot');
  const navDot = document.getElementById('lessonsNavDot');

  if (notifs.length === 0) {
    list.innerHTML = '<div class="notif-empty">No notifications yet.</div>';
    dot.hidden = true;
    if (navDot) navDot.hidden = true;
    return;
  }

  dot.hidden = false;
  if (navDot) navDot.hidden = false;

  list.innerHTML = notifs.slice(0, 8).map(n => `
    <div class="notif-item">
      <span class="notif-dot ${n.type === 'done' ? 'done' : ''}"></span>
      <div>
        <p>${n.text}</p>
        <time>${UIShell.timeAgo(n.at)}</time>
      </div>
    </div>
  `).join('');
}

/* ---------------- Today's Lesson (hero) ---------------- */

function renderFeaturedLesson(student) {
  const slot = document.getElementById('featuredLessonSlot');
  const lesson = AppData.getFeaturedLesson();

  if (!lesson) {
    slot.innerHTML = `
      <div class="card empty-state">
        ${iconMarkup(BOOK_PATH)}
        <h3>No lessons available yet</h3>
        <p>Your teacher hasn't published a lesson yet. Check back soon!</p>
      </div>`;
    return;
  }

  const isNew = AppData.isLessonNew(lesson);
  const badge = lesson.progress > 0
    ? `<span class="badge badge-continue">Continue Learning</span>`
    : isNew ? `<span class="badge badge-new">✨ New Lesson</span>` : `<span class="badge badge-continue">New Lesson</span>`;

  slot.innerHTML = `
    <div class="card hero-lesson">
      <div class="hero-lesson-inner">
        <div>
          <div class="hero-eyebrow">
            ${iconMarkup(PLAY_PATH)}
            TODAY'S LESSON
          </div>
          <div class="hero-subject">${lesson.subject} · ${lesson.className}</div>
          <h2 class="hero-title">${lesson.title}</h2>
          <div class="hero-meta">
            ${badge}
            <span class="meta-chip lang-chip">${iconMarkup('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>')}${lesson.teachingLanguage} → ${lesson.studentLanguage}</span>
            <span class="meta-chip">Published by ${lesson.teacher}</span>
          </div>
          <div class="hero-actions">
            <a class="btn btn-primary" href="student-lesson.html?id=${lesson.id}">Start Learning</a>
          </div>
        </div>
        <div class="hero-visual">${iconMarkup(BOOK_PATH)}</div>
      </div>
    </div>`;
}

/* ---------------- Subjects ---------------- */

function subjectCardHTML(subject) {
  return `
    <a href="#lessons" data-view-link="lessons" class="card subject-card" style="display:flex;">
      <div class="subject-card-top">
        <div class="subject-icon">${iconMarkup(subjectIcon(subject.id))}</div>
        <span class="subject-percent">${subject.percent}%</span>
      </div>
      <div>
        <div class="subject-name">${subject.name}</div>
        <div class="subject-count">${subject.total} Lesson${subject.total === 1 ? '' : 's'}</div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${subject.percent}%"></div></div>
    </a>`;
}

function renderSubjects() {
  const subjects = AppData.getSubjects();
  const targets = ['subjectGridHome', 'subjectGridFull'];
  targets.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (subjects.length === 0) {
      el.innerHTML = `<div class="card empty-state" style="grid-column:1/-1;">
        ${iconMarkup(BOOK_PATH)}
        <h3>No subjects yet</h3>
        <p>Your subjects will appear here once your teacher adds lessons.</p>
      </div>`;
      return;
    }
    el.innerHTML = subjects.map(subjectCardHTML).join('');
  });
}

/* ---------------- Continue Learning ---------------- */

function renderContinueLearning() {
  const slot = document.getElementById('continueLearningSlot');
  const lesson = AppData.getContinueLearningLesson();

  if (!lesson) {
    slot.innerHTML = `
      <div class="card empty-state">
        ${iconMarkup(CHECK_PATH)}
        <h3>You're all caught up!</h3>
        <p>Start a new lesson to continue learning.</p>
      </div>`;
    return;
  }

  slot.innerHTML = `
    <div class="card continue-card">
      <div class="continue-card-top">
        <div>
          <div class="continue-subject">${lesson.subject}</div>
          <div class="continue-title">${lesson.title}</div>
          <div class="continue-progress-label">You are ${lesson.progress}% through this lesson.</div>
        </div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${lesson.progress}%"></div></div>
      <a class="btn btn-primary" href="student-lesson.html?id=${lesson.id}">Continue Learning</a>
    </div>`;
}

/* ---------------- Recent Activity ---------------- */

function renderActivity() {
  const el = document.getElementById('activityList');
  const items = AppData.getActivity();
  if (items.length === 0) {
    el.innerHTML = `<div class="empty-state" style="padding: var(--space-6) 0;"><p>No activity yet — start a lesson to see it here.</p></div>`;
    return;
  }
  el.innerHTML = items.map(item => `
    <div class="activity-item">
      <div class="activity-icon ${item.kind === 'started' ? 'in-progress' : ''}">
        ${iconMarkup(item.kind === 'started' ? PLAY_PATH : CHECK_PATH)}
      </div>
      <div>
        <div class="activity-text">${item.text}</div>
        <div class="activity-time">${UIShell.timeAgo(item.at)}</div>
      </div>
    </div>
  `).join('');
}

/* ---------------- My Lessons (full list + filters) ---------------- */

let activeLessonFilter = 'all';

function lessonMatchesFilter(lesson, filter) {
  if (filter === 'all') return true;
  if (filter === 'new') return AppData.isLessonNew(lesson);
  if (filter === 'in-progress') return !lesson.completed && lesson.progress > 0;
  if (filter === 'completed') return lesson.completed;
  return true;
}

function renderLessonList() {
  const el = document.getElementById('lessonListFull');
  if (!el) return;
  const lessons = AppData.getPublishedLessons()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .filter(l => lessonMatchesFilter(l, activeLessonFilter));

  if (lessons.length === 0) {
    el.innerHTML = `<div class="card empty-state">
      ${iconMarkup(BOOK_PATH)}
      <h3>No lessons here</h3>
      <p>${AppData.getPublishedLessons().length === 0 ? "Your teacher hasn't published a lesson yet. Check back soon!" : 'Nothing matches this filter yet.'}</p>
    </div>`;
    return;
  }

  el.innerHTML = lessons.map(lesson => {
    const done = lesson.completed;
    return `
    <div class="lesson-row">
      <div class="lesson-row-icon ${done ? 'is-done' : ''}">${iconMarkup(done ? CHECK_PATH : subjectIcon(lesson.subjectId))}</div>
      <div class="lesson-row-body">
        <div class="lesson-row-subject">${lesson.subject} · ${lesson.studentLanguage}</div>
        <div class="lesson-row-title">${lesson.title}</div>
        <div class="lesson-row-meta">
          ${done
            ? `<span class="badge badge-done">✓ Completed</span>`
            : `<div class="progress-track"><div class="progress-fill" style="width:${lesson.progress}%"></div></div><span>${lesson.progress}%</span>`}
        </div>
      </div>
      <div class="lesson-row-action">
        <a class="btn ${done ? 'btn-secondary' : 'btn-primary'} btn-sm" href="student-lesson.html?id=${lesson.id}">${done ? 'Review Lesson' : (lesson.progress > 0 ? 'Continue' : 'Start Learning')}</a>
      </div>
    </div>`;
  }).join('');
}

function initLessonFilters() {
  const bar = document.getElementById('lessonFilterBar');
  if (!bar) return;
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    bar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('is-active'));
    btn.classList.add('is-active');
    activeLessonFilter = btn.dataset.filter;
    renderLessonList();
  });
}

/* ---------------- My Notes ---------------- */

function renderNotesView(student) {
  const teacherNotesList = document.getElementById('teacherNotesList');
  if (!teacherNotesList) return;
  const lessons = AppData.getPublishedLessons().sort((a, b) => b.updatedAt - a.updatedAt);

  if (lessons.length === 0) {
    teacherNotesList.innerHTML = `<div class="card empty-state">
      ${iconMarkup(BOOK_PATH)}
      <h3>No teacher notes yet</h3>
      <p>Notes will appear here once your teacher publishes a lesson.</p>
    </div>`;
  } else {
    teacherNotesList.innerHTML = lessons.map(lesson => `
      <div class="card teacher-note-card">
        <div class="teacher-note-head">
          <div class="teacher-note-lesson">${lesson.subject} — ${lesson.title}</div>
          <span class="meta-chip lang-chip" style="font-size:11.5px;">${TranslationService.getLanguageLabel(student.learningLanguage)}</span>
        </div>
        <p class="teacher-note-text">${TranslationService.getTranslatedContent(lesson, student.learningLanguage)}</p>
      </div>
    `).join('');
  }

  const freeInput = document.getElementById('freeNoteInput');
  freeInput.value = AppData.getStudentNote('general');
  document.getElementById('saveFreeNoteBtn').onclick = () => {
    AppData.saveStudentNote('general', freeInput.value);
    UIShell.showToast('Note saved');
  };
}

/* ---------------- Progress ---------------- */

function renderProgressView() {
  const lessons = AppData.getPublishedLessons();
  const completed = lessons.filter(l => l.completed).length;
  const inProgress = lessons.filter(l => !l.completed && l.progress > 0).length;
  const statCompleted = document.getElementById('statCompleted');
  if (!statCompleted) return;

  statCompleted.textContent = completed;
  document.getElementById('statInProgress').textContent = inProgress;
  document.getElementById('statAvailable').textContent = lessons.length;

  const subjects = AppData.getSubjects();
  const list = document.getElementById('subjectProgressList');
  if (subjects.length === 0) {
    list.innerHTML = `<div class="empty-state" style="padding: var(--space-6) 0;"><p>Subject progress will show up once lessons are published.</p></div>`;
    return;
  }
  list.innerHTML = subjects.map(s => `
    <div class="subject-progress-row">
      <div class="subject-progress-name">${s.name}</div>
      <div class="progress-track"><div class="progress-fill" style="width:${s.percent}%"></div></div>
      <div class="subject-progress-percent">${s.percent}%</div>
    </div>
  `).join('');
}

/* ---------------- View routing ---------------- */

const VIEWS = ['home', 'lessons', 'subjects', 'notes', 'progress', 'settings'];

function showView(viewName) {
  if (!VIEWS.includes(viewName)) viewName = 'home';
  document.querySelectorAll('.view').forEach(v => {
    v.hidden = v.dataset.view !== viewName;
  });
  document.querySelectorAll('[data-view-link]').forEach(link => {
    link.classList.toggle('is-active', link.dataset.viewLink === viewName);
  });
  window.scrollTo(0, 0);
}

function initRouting() {
  function fromHash() {
    const view = (location.hash || '#home').replace('#', '');
    showView(view);
  }
  window.addEventListener('hashchange', fromHash);
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-view-link]');
    if (!link) return;
    // let the hash change drive routing; also close mobile drawer
    document.querySelector('.sidebar')?.classList.remove('is-open');
    document.querySelector('.sidebar-overlay')?.classList.remove('is-open');
  });
  fromHash();
}

/* ---------------- render everything ---------------- */

function renderAll() {
  const student = AppData.getStudent();
  renderGreeting(student);
  renderProfileChrome(student);
  renderLanguageDropdown(student);
  renderSettingsLangChoices(student);
  renderNotifications();
  renderFeaturedLesson(student);
  renderSubjects();
  renderContinueLearning();
  renderActivity();
  renderLessonList();
  renderNotesView(student);
  renderProgressView();
}

document.addEventListener('DOMContentLoaded', () => {
  AppData.seedIfEmpty();
  UIShell.init();
  initLessonFilters();
  renderAll();
  initRouting();
});
