/**
 * VaaniSetu — Lesson detail page logic
 */

function iconMarkup(path) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function getLessonIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/* ---------------- speech synthesis wrapper ---------------- */

const SpeechController = (() => {
  const synth = window.speechSynthesis;
  let currentUtterance = null;
  let currentBtn = null;

  // Rough BCP-47 mapping. Santhali has no standard browser voice yet —
  // this is exactly the gap the "coming soon" message covers.
  const LANG_TAGS = {
    hindi: 'hi-IN',
    santhali: 'sat-IN',
  };

  function voiceExistsFor(langTag) {
    if (!synth) return false;
    const voices = synth.getVoices();
    return voices.some(v => v.lang && v.lang.toLowerCase().startsWith(langTag.split('-')[0].toLowerCase()));
  }

  function resetButton(btn) {
    btn.classList.remove('is-playing');
    btn.querySelector('span').textContent = btn.dataset.hasPlayed === 'true' ? 'Play Again' : 'Listen';
    btn.querySelector('svg').outerHTML = iconMarkup(
      '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>'
    );
  }

  function setPlayingButton(btn) {
    btn.classList.add('is-playing');
    btn.querySelector('span').textContent = 'Playing';
    btn.querySelector('svg').outerHTML = iconMarkup('<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>');
  }

  function stop() {
    if (synth) synth.cancel();
    if (currentBtn) resetButton(currentBtn);
    currentUtterance = null;
    currentBtn = null;
  }

  function speak(text, languageCode, btn, unavailableEl) {
    if (!synth) {
      unavailableEl.hidden = false;
      return;
    }

    const langTag = LANG_TAGS[languageCode] || 'en-US';
    const supported = languageCode === 'hindi' ? true : voiceExistsFor(langTag);

    if (!supported) {
      unavailableEl.hidden = false;
      return;
    }
    unavailableEl.hidden = true;

    // Toggle: if this button is already playing, stop it.
    if (currentBtn === btn && synth.speaking) {
      stop();
      return;
    }

    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langTag;
    utterance.rate = 0.95;
    utterance.onend = () => { resetButton(btn); btn.dataset.hasPlayed = 'true'; currentUtterance = null; currentBtn = null; };
    utterance.onerror = () => { unavailableEl.hidden = false; resetButton(btn); currentUtterance = null; currentBtn = null; };

    currentUtterance = utterance;
    currentBtn = btn;
    setPlayingButton(btn);
    synth.speak(utterance);
  }

  return { speak, stop };
})();

/* ---------------- rendering ---------------- */

function renderBreadcrumb(lesson) {
  const el = document.getElementById('lessonBreadcrumb');
  el.innerHTML = `
    <a href="student-dashboard.html#home">Home</a>
    <span class="sep">/</span>
    <a href="student-dashboard.html#lessons" data-view-link="lessons">${lesson.subject}</a>
    <span class="sep">/</span>
    <span class="current">${lesson.title}</span>
  `;
}

function renderHeader(lesson) {
  document.getElementById('lhSubject').textContent = lesson.subject;
  document.getElementById('lhTitle').textContent = lesson.title;
  document.getElementById('lhMeta').innerHTML = `
    <span class="meta-chip">${lesson.className}</span>
    <span class="meta-chip">Teacher: ${lesson.teacher}</span>
    <span class="meta-chip lang-chip">${iconMarkup('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>')}${TranslationService.getLanguageLabel(lesson.studentLanguage.toLowerCase())}</span>
  `;
}

function renderReadingContent(lesson, student) {
  const translated = TranslationService.getTranslatedContent(lesson, student.learningLanguage);
  document.getElementById('mainReadingContent').textContent = translated;
  document.getElementById('notesReadingContent').textContent = translated;

  const original = TranslationService.getOriginalContent(lesson);
  document.getElementById('originalContentText').textContent = original;
  document.getElementById('originalContentLabel').textContent = `Original Teacher Content — ${lesson.teachingLanguage}`;
  document.getElementById('bilingualLangLabel').textContent = `Local Language: ${TranslationService.getLanguageLabel(student.learningLanguage)}`;
  document.getElementById('toggleOriginalBtn').textContent = `Show ${lesson.teachingLanguage}`;
}

function renderCompletionState(lesson) {
  const prompt = document.getElementById('completePrompt');
  const done = document.getElementById('completeDone');
  if (lesson.completed) {
    prompt.classList.add('is-hidden');
    done.classList.add('is-visible');
  } else {
    prompt.classList.remove('is-hidden');
    done.classList.remove('is-visible');
  }
}

function wireTts(lesson, student) {
  const content = TranslationService.getTranslatedContent(lesson, student.learningLanguage);
  ['ttsMainBtn', 'ttsNotesBtn'].forEach((id, i) => {
    const btn = document.getElementById(id);
    const unavailableEl = document.getElementById(i === 0 ? 'ttsUnavailableMain' : 'ttsUnavailableNotes');
    btn.addEventListener('click', () => SpeechController.speak(content, student.learningLanguage, btn, unavailableEl));
  });
}

function wireBilingualToggle() {
  const btn = document.getElementById('toggleOriginalBtn');
  const panel = document.getElementById('originalContentPanel');
  btn.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('is-open');
    btn.textContent = isOpen ? 'Hide' : btn.dataset.showLabel;
  });
  btn.dataset.showLabel = btn.textContent;
}

function wireStudentNote(lesson) {
  const input = document.getElementById('lessonNoteInput');
  input.value = AppData.getStudentNote(lesson.id);
  document.getElementById('saveLessonNoteBtn').addEventListener('click', () => {
    AppData.saveStudentNote(lesson.id, input.value);
    UIShell.showToast('Note saved');
  });
}

function wireMarkComplete(lesson) {
  document.getElementById('markCompleteBtn').addEventListener('click', () => {
    const updated = AppData.markLessonComplete(lesson.id);
    AppData.logActivity(`Completed ${updated.title}`, 'completed');
    AppData.addNotification(`You completed ${updated.title}`, 'done');
    renderCompletionState(updated);
    UIShell.showToast('Lesson marked as complete');
  });
}

function renderSidebarProfile(student) {
  const initial = (student.name || 'S').charAt(0).toUpperCase();
  document.getElementById('sidebarAvatar').textContent = initial;
  document.getElementById('sidebarName').textContent = student.name;
  document.getElementById('sidebarClass').textContent = student.className;
}

/* ---------------- init ---------------- */

document.addEventListener('DOMContentLoaded', () => {
  AppData.seedIfEmpty();
  UIShell.init();

  const student = AppData.getStudent();
  renderSidebarProfile(student);

  const lessonId = getLessonIdFromUrl();
  const lesson = lessonId ? AppData.getLessonById(lessonId) : null;

  if (!lesson || lesson.status !== 'published') {
    document.getElementById('lessonNotFound').hidden = false;
    document.getElementById('lessonContent').hidden = true;
    return;
  }

  const wasFirstOpen = !lesson.lastOpenedAt;
  AppData.markLessonOpened(lesson.id);
  if (lesson.progress === 0 && !lesson.completed) {
    AppData.setLessonProgress(lesson.id, 10);
  }
  if (wasFirstOpen) {
    AppData.logActivity(`Started ${lesson.title}`, 'started');
  }

  const freshLesson = AppData.getLessonById(lesson.id);

  renderBreadcrumb(freshLesson);
  renderHeader(freshLesson);
  renderReadingContent(freshLesson, student);
  renderCompletionState(freshLesson);
  wireTts(freshLesson, student);
  wireBilingualToggle();
  wireStudentNote(freshLesson);
  wireMarkComplete(freshLesson);

  document.getElementById('lessonContent').hidden = false;
});
