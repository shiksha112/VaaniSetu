/* ==========================================================================
   Vaani Setu — Flashcards
   Behavior (vanilla JS, no frameworks)
   ========================================================================== */

// --------------------------------------------------------------------------
// Demo data — replace with an API call later. Each object matches the
// shape a backend endpoint would return for a set of flashcards.
// --------------------------------------------------------------------------
const flashcards = [
  {
    id: 1,
    subject: "Mathematics",
    topic: "Numbers up to 1000",
    questionHindi: "250 + 50 कितना होता है?",
    answerHindi: "300",
    translationSanthali: "Demo translation"
  },
  {
    id: 2,
    subject: "Hindi",
    topic: "Varnamala",
    questionHindi: "हिंदी वर्णमाला में कुल कितने स्वर होते हैं?",
    answerHindi: "11",
    translationSanthali: "Demo translation"
  },
  {
    id: 3,
    subject: "English",
    topic: "Basic Vocabulary",
    questionHindi: "\"Apple\" का हिंदी में क्या अर्थ है?",
    answerHindi: "सेब",
    translationSanthali: "Demo translation"
  },
  {
    id: 4,
    subject: "Science",
    topic: "Living World",
    questionHindi: "पौधे अपना भोजन किस प्रक्रिया से बनाते हैं?",
    answerHindi: "प्रकाश संश्लेषण",
    translationSanthali: "Demo translation"
  },
  {
    id: 5,
    subject: "Social Studies",
    topic: "Our Country",
    questionHindi: "भारत की राजधानी कौन सी है?",
    answerHindi: "नई दिल्ली",
    translationSanthali: "Demo translation"
  },
  {
    id: 6,
    subject: "Mathematics",
    topic: "Numbers up to 1000",
    questionHindi: "9 का 8 गुना कितना होता है?",
    answerHindi: "72",
    translationSanthali: "Demo translation"
  },
  {
    id: 7,
    subject: "Hindi",
    topic: "Vyakaran",
    questionHindi: "\"सुंदर\" शब्द किस प्रकार का शब्द है — विशेषण या क्रिया?",
    answerHindi: "विशेषण",
    translationSanthali: "Demo translation"
  },
  {
    id: 8,
    subject: "English",
    topic: "Basic Vocabulary",
    questionHindi: "\"Water\" का हिंदी में क्या अर्थ है?",
    answerHindi: "पानी",
    translationSanthali: "Demo translation"
  },
  {
    id: 9,
    subject: "Science",
    topic: "Our Body",
    questionHindi: "मनुष्य के शरीर में हृदय कितने कक्षों (chambers) का बना होता है?",
    answerHindi: "4",
    translationSanthali: "Demo translation"
  },
  {
    id: 10,
    subject: "Social Studies",
    topic: "Our Country",
    questionHindi: "भारत का राष्ट्रीय पशु कौन सा है?",
    answerHindi: "बाघ",
    translationSanthali: "Demo translation"
  }
];

// --------------------------------------------------------------------------
// State
// --------------------------------------------------------------------------
let currentCardIndex = 0;
let isRevealed = false;
let knownCount = 0;
let needsPracticeCount = 0;
// answeredCards maps card index -> "known" | "practice", so a card can't be
// counted twice even if the student revisits it.
let answeredCards = {};

// --------------------------------------------------------------------------
// DOM references
// --------------------------------------------------------------------------
const els = {
  subjectName: document.getElementById("subjectName"),
  topicName: document.getElementById("topicName"),

  progressLabel: document.getElementById("progressLabel"),
  progressPercent: document.getElementById("progressPercent"),
  progressFill: document.getElementById("progressFill"),
  progressBarTrack: document.getElementById("progressBarTrack"),

  stage: document.getElementById("stage"),
  flashcard: document.getElementById("flashcard"),
  faceQuestion: document.getElementById("faceQuestion"),
  faceAnswer: document.getElementById("faceAnswer"),
  subjectBadge: document.getElementById("subjectBadge"),
  questionText: document.getElementById("questionText"),
  answerText: document.getElementById("answerText"),
  translationText: document.getElementById("translationText"),
  listenBtn: document.getElementById("listenBtn"),

  assessment: document.getElementById("assessment"),
  knownBtn: document.getElementById("knownBtn"),
  practiceBtn: document.getElementById("practiceBtn"),

  navRow: document.getElementById("navRow"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),

  completionScreen: document.getElementById("completionScreen"),
  statTotal: document.getElementById("statTotal"),
  statKnown: document.getElementById("statKnown"),
  statPractice: document.getElementById("statPractice"),
  completionNote: document.getElementById("completionNote"),
  reviewAgainBtn: document.getElementById("reviewAgainBtn"),

  toast: document.getElementById("toast")
};

let toastTimer = null;

// --------------------------------------------------------------------------
// Initialization
// --------------------------------------------------------------------------
function initializeFlashcards() {
  currentCardIndex = 0;
  isRevealed = false;
  knownCount = 0;
  needsPracticeCount = 0;
  answeredCards = {};

  els.stage.hidden = false;
  els.completionScreen.hidden = true;

  bindEvents();
  renderFlashcard();
}

function bindEvents() {
  els.flashcard.addEventListener("click", handleCardActivate);
  els.flashcard.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardActivate();
    }
  });

  els.listenBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const card = flashcards[currentCardIndex];
    speakText(card.answerHindi || card.questionHindi);
  });

  els.knownBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    handleKnown();
  });

  els.practiceBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    handleNeedsPractice();
  });

  els.prevBtn.addEventListener("click", previousCard);
  els.nextBtn.addEventListener("click", nextCard);

  els.reviewAgainBtn.addEventListener("click", restartFlashcards);
}

function handleCardActivate() {
  if (!isRevealed) {
    revealCard();
  }
}

// --------------------------------------------------------------------------
// Rendering
// --------------------------------------------------------------------------
function renderFlashcard() {
  const card = flashcards[currentCardIndex];
  isRevealed = false;

  // Header reflects the current card's subject/topic since the deck now
  // mixes subjects instead of belonging to a single one.
  els.subjectName.textContent = card.subject;
  els.topicName.textContent = card.topic;

  els.subjectBadge.textContent = card.subject;
  els.questionText.textContent = card.questionHindi;
  els.answerText.textContent = card.answerHindi;
  els.translationText.textContent = card.translationSanthali;

  els.faceQuestion.hidden = false;
  els.faceAnswer.hidden = true;
  els.assessment.hidden = true;
  els.flashcard.classList.remove("is-answered");
  els.flashcard.setAttribute("aria-label", "Flashcard, tap to reveal answer");

  // Restore selection state if this card was already answered.
  els.knownBtn.classList.remove("is-selected");
  els.practiceBtn.classList.remove("is-selected");
  els.knownBtn.disabled = false;
  els.practiceBtn.disabled = false;

  const previousAnswer = answeredCards[currentCardIndex];
  if (previousAnswer) {
    revealCard(true);
    if (previousAnswer === "known") {
      els.knownBtn.classList.add("is-selected");
    } else {
      els.practiceBtn.classList.add("is-selected");
    }
  }

  updateProgress();
  updateNavButtons();
}

function updateProgress() {
  const total = flashcards.length;
  const current = currentCardIndex + 1;
  const percent = Math.round((current / total) * 100);

  els.progressLabel.textContent = `Card ${current} of ${total}`;
  els.progressPercent.textContent = `${percent}%`;
  els.progressFill.style.width = `${percent}%`;
  els.progressBarTrack.setAttribute("aria-valuenow", String(percent));
}

function updateNavButtons() {
  els.prevBtn.disabled = currentCardIndex === 0;

  const isLastCard = currentCardIndex === flashcards.length - 1;
  els.nextBtn.textContent = "";

  const label = document.createTextNode(isLastCard ? "Finish" : "Next");
  els.nextBtn.appendChild(label);

  if (!isLastCard) {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("width", "14");
    icon.setAttribute("height", "14");
    icon.setAttribute("viewBox", "0 0 16 16");
    icon.setAttribute("fill", "none");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = '<path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
    els.nextBtn.appendChild(icon);
  }
}

// --------------------------------------------------------------------------
// Card reveal
// --------------------------------------------------------------------------
function revealCard(silent) {
  isRevealed = true;
  els.faceQuestion.hidden = true;
  els.faceAnswer.hidden = false;
  els.assessment.hidden = false;
  els.flashcard.classList.add("is-answered");
  els.flashcard.setAttribute("aria-label", "Flashcard answer revealed");

  if (!silent) {
    // no-op placeholder for future analytics/telemetry hook
  }
}

// --------------------------------------------------------------------------
// Navigation
// --------------------------------------------------------------------------
function nextCard() {
  const isLastCard = currentCardIndex === flashcards.length - 1;

  if (isLastCard) {
    finishFlashcards();
    return;
  }

  currentCardIndex += 1;
  renderFlashcard();
}

function previousCard() {
  if (currentCardIndex === 0) return;
  currentCardIndex -= 1;
  renderFlashcard();
}

// --------------------------------------------------------------------------
// Self-assessment
// --------------------------------------------------------------------------
function handleKnown() {
  if (!isRevealed) return;
  setAssessment("known");
}

function handleNeedsPractice() {
  if (!isRevealed) return;
  setAssessment("practice");
}

function setAssessment(type) {
  const existing = answeredCards[currentCardIndex];

  // Undo the previous tally for this card if the student changes their mind,
  // so the same card is never counted twice.
  if (existing === "known") knownCount -= 1;
  if (existing === "practice") needsPracticeCount -= 1;

  answeredCards[currentCardIndex] = type;

  if (type === "known") {
    knownCount += 1;
  } else {
    needsPracticeCount += 1;
  }

  els.knownBtn.classList.toggle("is-selected", type === "known");
  els.practiceBtn.classList.toggle("is-selected", type === "practice");
}

// --------------------------------------------------------------------------
// Audio (SpeechSynthesis)
// --------------------------------------------------------------------------
function speakText(text) {
  if (!("speechSynthesis" in window)) {
    showToast("Audio isn't supported on this device.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const hindiVoice = voices.find((voice) => voice.lang === "hi-IN");

  utterance.lang = "hi-IN";
  if (hindiVoice) {
    utterance.voice = hindiVoice;
  }

  utterance.onstart = () => els.listenBtn.classList.add("is-speaking");
  utterance.onend = () => els.listenBtn.classList.remove("is-speaking");
  utterance.onerror = () => {
    els.listenBtn.classList.remove("is-speaking");
    showToast("Couldn't play audio right now.");
  };

  window.speechSynthesis.speak(utterance);
}

// --------------------------------------------------------------------------
// Toast (non-blocking message)
// --------------------------------------------------------------------------
function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 2600);
}

// --------------------------------------------------------------------------
// Completion
// --------------------------------------------------------------------------
function finishFlashcards() {
  els.stage.hidden = true;
  els.completionScreen.hidden = false;

  els.statTotal.textContent = String(flashcards.length);
  els.statKnown.textContent = String(knownCount);
  els.statPractice.textContent = String(needsPracticeCount);

  els.completionNote.hidden = needsPracticeCount === 0;
}

function restartFlashcards() {
  initializeFlashcards();
}

// --------------------------------------------------------------------------
// Boot
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", initializeFlashcards);

// Some browsers load voice lists asynchronously; warm them up so the first
// "Listen" tap can find an hi-IN voice.
if ("speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}
