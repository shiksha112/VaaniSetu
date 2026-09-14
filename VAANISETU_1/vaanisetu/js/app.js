/**
 * VaaniSetu — App / Data Layer
 * ---------------------------------------------------------------
 * Shared across student-dashboard.js and student-lesson.js.
 *
 * Everything here talks to localStorage today, but every function
 * is written as if it already hit a network boundary (returns
 * plain data, no DOM). Swap-out plan for the real product:
 *
 *   Teacher Dashboard --\
 *                        > FastAPI -> Database -> Translation Service
 *   Student Dashboard --/
 *
 * Only the bodies of the functions below would change (fetch()
 * calls instead of localStorage.getItem/setItem) — every screen
 * that calls AppData keeps working unchanged.
 * ---------------------------------------------------------------
 */

const STORAGE_KEYS = {
  lessons: 'vaanisetu_lessons',
  student: 'vaanisetu_student',
  notifications: 'vaanisetu_notifications',
  studentNotes: 'vaanisetu_student_notes',
  activity: 'vaanisetu_activity',
};

const AppData = (() => {

  /* ---------------- seed data (stands in for a Teacher Dashboard) ---------------- */

  function seedIfEmpty() {
    if (!localStorage.getItem(STORAGE_KEYS.lessons)) {
      const now = Date.now();
      const lessons = [
        {
          id: 'lesson-001',
          subjectId: 'math',
          subject: 'Mathematics',
          title: 'Addition of Two-Digit Numbers',
          className: 'Class 5',
          teacher: 'Mrs. Kavita Soren',
          teachingLanguage: 'Hindi',
          studentLanguage: 'Santhali',
          notes: 'Jod ka matlab hai do ya zyada sankhyaon ko milana. Udaharan ke liye: 25 + 13 = 38. Pehle ikai ko jodo, phir dahai ko jodo.',
          translatedNotes: {
            hindi: 'Jod ka matlab hai do ya zyada sankhyaon ko milana. Udaharan ke liye: 25 + 13 = 38. Pehle ikai ko jodo, phir dahai ko jodo.',
            santhali: 'Sereng ge kanay bar the ea ta\'ayen sankhya ko mihu lekha. Namuna: 25 + 13 = 38. Ayurem ikai ko sereng me, ar dahai ko sereng me.',
          },
          status: 'published',
          date: '2026-09-11',
          time: '09:00',
          progress: 100,
          completed: true,
          lastOpenedAt: now - 1000 * 60 * 60 * 26,
          createdAt: now - 1000 * 60 * 60 * 48,
          updatedAt: now - 1000 * 60 * 60 * 26,
        },
        {
          id: 'lesson-002',
          subjectId: 'science',
          subject: 'Science',
          title: 'Parts of a Plant',
          className: 'Class 5',
          teacher: 'Mrs. Kavita Soren',
          teachingLanguage: 'Hindi',
          studentLanguage: 'Santhali',
          notes: 'Paudhe ke mukhya bhaag hain: jad, tana, patti, phool aur phal. Jad paudhe ko zameen mein pakadti hai aur paani sokhti hai.',
          translatedNotes: {
            hindi: 'Paudhe ke mukhya bhaag hain: jad, tana, patti, phool aur phal. Jad paudhe ko zameen mein pakadti hai aur paani sokhti hai.',
            santhali: 'Baha\'re mararang bhag kan ge: reya, dandi, dauri, baha ar sirjom. Reya ge baha\'re otare atkao a\'ar da\' hum.',
          },
          status: 'published',
          date: '2026-09-11',
          time: '10:30',
          progress: 60,
          completed: false,
          lastOpenedAt: now - 1000 * 60 * 45,
          createdAt: now - 1000 * 60 * 60 * 20,
          updatedAt: now - 1000 * 60 * 60 * 2,
        },
        {
          id: 'lesson-003',
          subjectId: 'math',
          subject: 'Mathematics',
          title: 'Numbers up to 1000',
          className: 'Class 5',
          teacher: 'Mrs. Kavita Soren',
          teachingLanguage: 'Hindi',
          studentLanguage: 'Santhali',
          notes: 'Hum 1000 tak ki sankhyaon ko saikadon, dahaiyon aur ikaiyon mein baant sakte hain.',
          translatedNotes: {
            hindi: 'Hum 1000 tak ki sankhyaon ko saikadon, dahaiyon aur ikaiyon mein baant sakte hain.',
            santhali: 'Ale 1000 hoyo sankhya ko saikada, dahai ar ikai re bhag da\'e daya\'g me.',
          },
          status: 'published',
          date: '2026-09-09',
          time: '09:00',
          progress: 100,
          completed: true,
          lastOpenedAt: now - 1000 * 60 * 60 * 50,
          createdAt: now - 1000 * 60 * 60 * 72,
          updatedAt: now - 1000 * 60 * 60 * 50,
        },
        {
          id: 'lesson-004',
          subjectId: 'language',
          subject: 'Language',
          title: 'Simple Sentences',
          className: 'Class 5',
          teacher: 'Mr. Birsa Hembrom',
          teachingLanguage: 'Hindi',
          studentLanguage: 'Santhali',
          notes: 'Ek saral vaakya mein karta, kriya aur karm hota hai. Udaharan: "Raju khelta hai."',
          translatedNotes: {
            hindi: 'Ek saral vaakya mein karta, kriya aur karm hota hai. Udaharan: "Raju khelta hai."',
            santhali: 'Mit\'the harhaw katha re karta, kriya ar karam menaga. Namuna: "Raju sengel kana."',
          },
          status: 'published',
          date: '2026-09-08',
          time: '11:00',
          progress: 20,
          completed: false,
          lastOpenedAt: now - 1000 * 60 * 60 * 70,
          createdAt: now - 1000 * 60 * 60 * 96,
          updatedAt: now - 1000 * 60 * 60 * 70,
        },
        {
          id: 'lesson-005',
          subjectId: 'science',
          subject: 'Science',
          title: 'Animals Around Us',
          className: 'Class 5',
          teacher: 'Mrs. Kavita Soren',
          teachingLanguage: 'Hindi',
          studentLanguage: 'Santhali',
          notes: 'Jaanwar do prakar ke hote hain: paltu aur jangli.',
          translatedNotes: {
            hindi: 'Jaanwar do prakar ke hote hain: paltu aur jangli.',
            santhali: 'Jantu bar lekha\'n tahenkana: bhatiya ar bir\'reng.',
          },
          status: 'draft',
          date: '2026-09-11',
          time: '14:00',
          progress: 0,
          completed: false,
          lastOpenedAt: null,
          createdAt: now - 1000 * 60 * 30,
          updatedAt: now - 1000 * 60 * 30,
        },
      ];
      localStorage.setItem(STORAGE_KEYS.lessons, JSON.stringify(lessons));
    }

    if (!localStorage.getItem(STORAGE_KEYS.student)) {
      localStorage.setItem(STORAGE_KEYS.student, JSON.stringify({
        name: 'Ramesh',
        className: 'Class 5',
        learningLanguage: 'santhali',
      }));
    }

    if (!localStorage.getItem(STORAGE_KEYS.notifications)) {
      const now = Date.now();
      localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify([
        { id: 'n1', text: 'New Science lesson published: Parts of a Plant', at: now - 1000 * 60 * 45, type: 'lesson' },
        { id: 'n2', text: 'Mathematics lesson updated: Addition of Two-Digit Numbers', at: now - 1000 * 60 * 60 * 26, type: 'lesson' },
        { id: 'n3', text: 'You completed Numbers up to 1000', at: now - 1000 * 60 * 60 * 50, type: 'done' },
      ]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.studentNotes)) {
      localStorage.setItem(STORAGE_KEYS.studentNotes, JSON.stringify({}));
    }
  }

  /* ---------------- lessons ---------------- */

  function getAllLessons() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.lessons)) || [];
  }

  function saveLessons(lessons) {
    localStorage.setItem(STORAGE_KEYS.lessons, JSON.stringify(lessons));
  }

  // Lessons a teacher has published — the only ones a student may see.
  function getPublishedLessons() {
    return getAllLessons().filter(l => l.status === 'published');
  }

  function getLessonById(id) {
    return getAllLessons().find(l => l.id === id) || null;
  }

  function updateLesson(id, patch) {
    const lessons = getAllLessons();
    const idx = lessons.findIndex(l => l.id === id);
    if (idx === -1) return null;
    lessons[idx] = { ...lessons[idx], ...patch, updatedAt: Date.now() };
    saveLessons(lessons);
    return lessons[idx];
  }

  function markLessonOpened(id) {
    return updateLesson(id, { lastOpenedAt: Date.now() });
  }

  function markLessonComplete(id) {
    return updateLesson(id, { completed: true, progress: 100 });
  }

  function setLessonProgress(id, progress) {
    return updateLesson(id, { progress, completed: progress >= 100 });
  }

  // Most relevant lesson for "Today's Lesson": most recently
  // published/updated lesson that isn't already completed, else the
  // most recently published lesson overall.
  function getFeaturedLesson() {
    const published = getPublishedLessons();
    if (published.length === 0) return null;
    const incomplete = published.filter(l => !l.completed)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    if (incomplete.length > 0) return incomplete[0];
    return [...published].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  }

  // Most recently opened, incomplete lesson — for "Continue Learning".
  function getContinueLearningLesson() {
    const published = getPublishedLessons();
    const inProgress = published.filter(l => !l.completed && l.progress > 0 && l.lastOpenedAt);
    if (inProgress.length === 0) return null;
    return inProgress.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)[0];
  }

  function isLessonNew(lesson) {
    const THIRTY_SIX_HOURS = 1000 * 60 * 60 * 36;
    return (Date.now() - lesson.createdAt) < THIRTY_SIX_HOURS && lesson.progress === 0;
  }

  /* ---------------- subjects (derived from lesson data — never hardcoded) ---------------- */

  function getSubjects() {
    const published = getPublishedLessons();
    const bySubject = {};
    published.forEach(lesson => {
      if (!bySubject[lesson.subjectId]) {
        bySubject[lesson.subjectId] = {
          id: lesson.subjectId,
          name: lesson.subject,
          lessons: [],
        };
      }
      bySubject[lesson.subjectId].lessons.push(lesson);
    });
    return Object.values(bySubject).map(subj => {
      const total = subj.lessons.length;
      const completed = subj.lessons.filter(l => l.completed).length;
      const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
      return { ...subj, total, completed, percent };
    });
  }

  /* ---------------- student profile ---------------- */

  function getStudent() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.student)) || {
      name: 'Student', className: '', learningLanguage: 'santhali',
    };
  }

  function setStudentLanguage(languageCode) {
    const student = getStudent();
    student.learningLanguage = languageCode;
    localStorage.setItem(STORAGE_KEYS.student, JSON.stringify(student));
    return student;
  }

  /* ---------------- notifications ---------------- */

  function getNotifications() {
    return (JSON.parse(localStorage.getItem(STORAGE_KEYS.notifications)) || [])
      .sort((a, b) => b.at - a.at);
  }

  function addNotification(text, type) {
    const list = getNotifications();
    list.unshift({ id: 'n' + Date.now(), text, at: Date.now(), type });
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(list));
  }

  /* ---------------- recent activity ---------------- */

  function getActivity() {
    return (JSON.parse(localStorage.getItem(STORAGE_KEYS.activity)) || [])
      .sort((a, b) => b.at - a.at)
      .slice(0, 6);
  }

  function logActivity(text, kind) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.activity)) || [];
    list.unshift({ id: 'a' + Date.now(), text, kind, at: Date.now() });
    localStorage.setItem(STORAGE_KEYS.activity, JSON.stringify(list.slice(0, 20)));
  }

  /* ---------------- student-authored notes (kept separate from teacher notes) ---------------- */

  function getStudentNote(lessonId) {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.studentNotes)) || {};
    return all[lessonId] || '';
  }

  function saveStudentNote(lessonId, text) {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.studentNotes)) || {};
    all[lessonId] = text;
    localStorage.setItem(STORAGE_KEYS.studentNotes, JSON.stringify(all));
  }

  function getAllStudentNotes() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.studentNotes)) || {};
  }

  return {
    seedIfEmpty,
    getAllLessons, saveLessons, getPublishedLessons, getLessonById,
    updateLesson, markLessonOpened, markLessonComplete, setLessonProgress,
    getFeaturedLesson, getContinueLearningLesson, isLessonNew,
    getSubjects,
    getStudent, setStudentLanguage,
    getNotifications, addNotification,
    getActivity, logActivity,
    getStudentNote, saveStudentNote, getAllStudentNotes,
  };
})();

/* ---------------------------------------------------------------
 * Shared UI wiring — sidebar drawer, language dropdown, notif
 * dropdown, toast. Both pages call UIShell.init() on load.
 * --------------------------------------------------------------- */

const UIShell = (() => {

  function initMobileDrawer() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const openBtn = document.querySelector('[data-action="open-sidebar"]');
    const closeBtn = document.querySelector('[data-action="close-sidebar"]');
    if (!sidebar || !overlay) return;

    function open() {
      sidebar.classList.add('is-open');
      overlay.classList.add('is-open');
      openBtn && openBtn.setAttribute('aria-expanded', 'true');
    }
    function close() {
      sidebar.classList.remove('is-open');
      overlay.classList.remove('is-open');
      openBtn && openBtn.setAttribute('aria-expanded', 'false');
    }
    openBtn && openBtn.addEventListener('click', open);
    closeBtn && closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  function initDropdown(triggerSelector, panelSelector) {
    const trigger = document.querySelector(triggerSelector);
    const panel = document.querySelector(panelSelector);
    if (!trigger || !panel) return;

    function toggle(e) {
      e.stopPropagation();
      const isOpen = panel.classList.contains('is-open');
      document.querySelectorAll('.dropdown-panel.is-open').forEach(p => p.classList.remove('is-open'));
      if (!isOpen) panel.classList.add('is-open');
    }
    trigger.addEventListener('click', toggle);
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !trigger.contains(e.target)) {
        panel.classList.remove('is-open');
      }
    });
  }

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg><span class="toast-text"></span>`;
      document.body.appendChild(toast);
    }
    toast.querySelector('.toast-text').textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function timeAgo(timestamp) {
    if (!timestamp) return '';
    const diff = Date.now() - timestamp;
    const min = Math.round(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min} min ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return hr === 1 ? '1 hour ago' : `${hr} hours ago`;
    const day = Math.round(hr / 24);
    if (day === 1) return 'Yesterday';
    return `${day} days ago`;
  }

  function init() {
    initMobileDrawer();
    initDropdown('[data-action="toggle-lang"]', '#langDropdown');
    initDropdown('[data-action="toggle-notif"]', '#notifDropdown');
  }

  return { init, showToast, timeAgo };
})();

document.addEventListener('DOMContentLoaded', () => {
  AppData.seedIfEmpty();
});
