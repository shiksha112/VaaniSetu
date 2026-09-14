/* ==========================================================
   VaaniSetu — Baatcheet
   Frontend prototype logic. No real backend / AI model.
   All translations below are DEMO DATA for UI preview only.
   ========================================================== */
(function () {
  "use strict";

  /* ---------------- Mock role state ---------------- */
  // In the real app this comes from the logged-in session.
  let currentRole = "teacher"; // "teacher" | "student"

  const ROLE_META = {
    teacher: {
      name: "Rekha Soren",
      roleLabel: "Teacher",
      avatar: "RS",
      speakLang: "Hindi",
      micAria: "Tap to speak in Hindi",
    },
    student: {
      name: "Somai Murmu",
      roleLabel: "Student",
      avatar: "SM",
      speakLang: "Santhali",
      micAria: "Tap to speak in Santhali",
    },
  };

  /* ---------------- Demo conversation seed data ----------------
     Clearly marked as demo/sample content — not real AI output. */
  const SEED_MESSAGES = [
    {
      speaker: "teacher",
      originalLang: "Hindi",
      original: "बच्चों, आज हम भिन्न के बारे में पढ़ेंगे।",
      translationLang: "Santhali",
      translation: "Gidra’ko, tehen’ age bhinna reyag’ re parhaw’a.",
      ttsLang: "hi-IN",
    },
    {
      speaker: "student",
      originalLang: "Santhali",
      original: " Okoe, alom sen’ok’ bhinna kanae?",
      translationLang: "Hindi",
      translation: "जी शिक्षक, भिन्न क्या होता है?",
      ttsLang: "hi-IN",
    },
    {
      speaker: "teacher",
      originalLang: "Hindi",
      original: "बहुत अच्छा प्रश्न। अब बताओ, एक आधा क्या होता है?",
      translationLang: "Santhali",
      translation: "Bugin kuli sawal. Nitok’ metan’, mit’ ada’ chetan kanae?",
      ttsLang: "hi-IN",
    },
    {
      speaker: "student",
      originalLang: "Santhali",
      original: "Mit’ ada’ lekhan do, mit’ bar hisa reak’ mit’ hisa kanae.",
      translationLang: "Hindi",
      translation: "एक आधा यानी दो हिस्सों में से एक हिस्सा होता है।",
      ttsLang: "hi-IN",
    },
  ];

  // Additional lines used when the mic is tapped during the demo,
  // cycling per role so the interaction keeps feeling alive.
  const TEACHER_DEMO_QUEUE = [
    {
      originalLang: "Hindi",
      original: "शाबाश! अब एक चौथाई के बारे में सोचो।",
      translationLang: "Santhali",
      translation: "Sabas! Nitok’ mit’ sereng reyag’ bhabna mcorrect.",
      ttsLang: "hi-IN",
    },
    {
      originalLang: "Hindi",
      original: "एक रोटी को चार बराबर हिस्सों में बाँटो।",
      translationLang: "Santhali",
      translation: "Mit’ roti’ do punya’ barabar hisa’ re bat’ me.",
      ttsLang: "hi-IN",
    },
    {
      originalLang: "Hindi",
      original: "क्या सबको समझ आया?",
      translationLang: "Santhali",
      translation: "Sabko’ bujha’ akata’ kanae?",
      ttsLang: "hi-IN",
    },
  ];

  const STUDENT_DEMO_QUEUE = [
    {
      originalLang: "Santhali",
      original: "Chetan, alag alag hisa’ do barabar kanae?",
      translationLang: "Hindi",
      translation: "शिक्षक, क्या सारे हिस्से बराबर होते हैं?",
      ttsLang: "hi-IN",
    },
    {
      originalLang: "Santhali",
      original: "Ae samjhau lekhante, dohoy jotot’.",
      translationLang: "Hindi",
      translation: "अब समझ आ गया, धन्यवाद।",
      ttsLang: "hi-IN",
    },
  ];

  let teacherQueueIndex = 0;
  let studentQueueIndex = 0;

  /* ---------------- DOM refs ---------------- */
  const conversationScroll = document.getElementById("conversationScroll");
  const micButton = document.getElementById("micButton");
  const micWaveform = document.getElementById("micWaveform");
  const micStateLabel = document.getElementById("micStateLabel");
  const micLangLabel = document.getElementById("micLangLabel");
  const autoPlayToggle = document.getElementById("autoPlayToggle");
  const showTranslationToggle = document.getElementById("showTranslationToggle");
  const clearBtn = document.getElementById("clearConversationBtn");
  const endBtn = document.getElementById("endConversationBtn");
  const toast = document.getElementById("toast");
  const connectionStatus = document.getElementById("connectionStatus");
  const latencyValue = document.getElementById("latencyValue");
  const roleTeacherBtn = document.getElementById("roleTeacherBtn");
  const roleStudentBtn = document.getElementById("roleStudentBtn");
  const userAvatar = document.getElementById("userAvatar");
  const userName = document.getElementById("userName");
  const userRole = document.getElementById("userRole");
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  let autoPlayOn = true;
  let showTranslationOn = true;
  let micState = "idle"; // idle | listening | processing | success
  let messageCounter = 0;

  /* ---------------- Toast ---------------- */
  let toastTimer = null;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  /* ---------------- Message rendering ---------------- */
  function timeNow() {
    const d = new Date();
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  function speakerMeta(speaker) {
    return speaker === "teacher"
      ? { label: "Teacher", avatar: "👨‍🏫" }
      : { label: "Student", avatar: "👧" };
  }

  function renderMessage(msg) {
    messageCounter += 1;
    const id = `msg-${messageCounter}`;
    const meta = speakerMeta(msg.speaker);
    const side = msg.speaker === "teacher" ? "from-teacher" : "from-student";

    const row = document.createElement("div");
    row.className = `message-row ${side}`;
    row.id = id;

    const translationBlock = showTranslationOn
      ? `
        <div class="bubble-translation">
          <span class="translation-label">${msg.translationLang} Translation</span>
          <p class="translation-text">${escapeHtml(msg.translation)}</p>
        </div>`
      : "";

    row.innerHTML = `
      <div class="message-bubble">
        <div class="bubble-speaker">
          <span class="speaker-avatar" aria-hidden="true">${meta.avatar}</span>
          <span class="speaker-name">${meta.label}</span>
          <span class="speaker-lang-tag">${msg.originalLang}</span>
        </div>
        <p class="bubble-original">${escapeHtml(msg.original)}</p>
        ${translationBlock}
        <div class="bubble-actions">
          <button class="play-btn" type="button" aria-label="Play ${msg.translationLang} translation audio">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>
            Play Translation
          </button>
          <span class="msg-timestamp">${timeNow()}</span>
        </div>
      </div>
    `;

    const playBtn = row.querySelector(".play-btn");
    playBtn.addEventListener("click", () => playAudio(msg.translation, msg.ttsLang, playBtn));

    conversationScroll.appendChild(row);
    scrollToLatest();

    if (autoPlayOn) {
      // Slight delay so the bubble is visible before audio starts.
      setTimeout(() => playAudio(msg.translation, msg.ttsLang, playBtn), 350);
    }

    return row;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function scrollToLatest() {
    conversationScroll.scrollTop = conversationScroll.scrollHeight;
  }

  function renderPendingBubble(speaker, label) {
    messageCounter += 1;
    const id = `pending-${messageCounter}`;
    const side = speaker === "teacher" ? "from-teacher" : "from-student";
    const row = document.createElement("div");
    row.className = `message-row ${side} is-pending`;
    row.id = id;
    row.innerHTML = `
      <div class="message-bubble">
        <span class="pending-label">${label}</span>
        <span class="pending-dots" aria-hidden="true"><span></span><span></span><span></span></span>
      </div>
    `;
    conversationScroll.appendChild(row);
    scrollToLatest();
    return row;
  }

  /* ---------------- Text-to-speech ---------------- */
  function playAudio(text, lang, btnEl) {
    if (!("speechSynthesis" in window)) {
      showToast("Audio playback isn't supported in this browser.");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang || "hi-IN";
      utterance.rate = 0.95;

      if (btnEl) {
        btnEl.classList.add("is-playing");
        utterance.onend = () => btnEl.classList.remove("is-playing");
        utterance.onerror = () => {
          btnEl.classList.remove("is-playing");
          showToast("This language isn't available in your browser's voice list — showing text instead.");
        };
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      showToast("Audio playback isn't available right now.");
    }
  }

  /* ---------------- Mic state machine ---------------- */
  function setMicState(state) {
    micState = state;
    micButton.classList.remove("state-listening", "state-processing", "state-success");
    micStateLabel.classList.remove("is-listening", "is-processing", "is-success");

    if (state === "idle") {
      micButton.disabled = false;
      micStateLabel.textContent = "Tap to Speak";
      micLangLabel.textContent = `Speak in ${ROLE_META[currentRole].speakLang}`;
      micLangLabel.style.display = "block";
    } else if (state === "listening") {
      micButton.classList.add("state-listening");
      micStateLabel.classList.add("is-listening");
      micStateLabel.textContent = "● Listening...";
      micLangLabel.textContent = "Speak now";
    } else if (state === "transcribing") {
      micButton.classList.add("state-processing");
      micStateLabel.classList.add("is-processing");
      micStateLabel.textContent = "Transcribing...";
      micLangLabel.textContent = "Converting speech to text";
    } else if (state === "translating") {
      micButton.classList.add("state-processing");
      micStateLabel.classList.add("is-processing");
      micStateLabel.textContent = "Translating...";
      micLangLabel.textContent = "Finding the best match";
    } else if (state === "success") {
      micButton.classList.add("state-success");
      micStateLabel.classList.add("is-success");
      micStateLabel.textContent = "✓ Translation Ready";
      micLangLabel.textContent = "Added to conversation";
    }
  }

  function setConnectionTranslating(isTranslating) {
    if (isTranslating) {
      connectionStatus.classList.add("is-translating");
      connectionStatus.innerHTML = `<span class="status-dot" aria-hidden="true"></span>Translating...`;
    } else {
      connectionStatus.classList.remove("is-translating");
      connectionStatus.innerHTML = `<span class="status-dot" aria-hidden="true"></span>Connected`;
    }
  }

  function nextDemoLine() {
    if (currentRole === "teacher") {
      const line = TEACHER_DEMO_QUEUE[teacherQueueIndex % TEACHER_DEMO_QUEUE.length];
      teacherQueueIndex += 1;
      return { speaker: "teacher", ...line };
    }
    const line = STUDENT_DEMO_QUEUE[studentQueueIndex % STUDENT_DEMO_QUEUE.length];
    studentQueueIndex += 1;
    return { speaker: "student", ...line };
  }

  function handleMicTap() {
    if (micState !== "idle") return; // ignore taps mid-flow

    micButton.disabled = true;
    setMicState("listening");

    // 1. Listening (simulate speech capture)
    setTimeout(() => {
      const speaker = currentRole;
      const pendingListening = renderPendingBubble(speaker, "Transcribing");
      setMicState("transcribing");

      // 2. Transcribing
      setTimeout(() => {
        pendingListening.querySelector(".pending-label").textContent = "Translating";
        setMicState("translating");
        setConnectionTranslating(true);

        // 3. Translating
        setTimeout(() => {
          pendingListening.remove();
          setConnectionTranslating(false);
          setMicState("success");

          const demoLine = nextDemoLine();
          renderMessage(demoLine);
          bumpLatency();

          // 4. Back to idle shortly after showing success
          setTimeout(() => {
            setMicState("idle");
            micButton.disabled = false;
          }, 1100);
        }, 1000);
      }, 900);
    }, 1400);
  }

  function bumpLatency() {
    const val = (1.2 + Math.random() * 1.1).toFixed(1);
    latencyValue.textContent = `${val}s`;
  }

  /* ---------------- Toggles ---------------- */
  function wireToggle(el, onChange) {
    el.addEventListener("click", () => {
      const sw = el.querySelector(".toggle-switch");
      const isOn = sw.dataset.state === "on";
      const nextState = !isOn;
      sw.dataset.state = nextState ? "on" : "off";
      el.setAttribute("aria-pressed", String(nextState));
      onChange(nextState);
    });
  }

  wireToggle(autoPlayToggle, (on) => {
    autoPlayOn = on;
    showToast(on ? "Auto play translation turned on." : "Auto play translation turned off.");
  });

  wireToggle(showTranslationToggle, (on) => {
    showTranslationOn = on;
    showToast(on ? "Showing translations." : "Translations hidden — original text only.");
  });

  /* ---------------- Clear / End conversation ---------------- */
  clearBtn.addEventListener("click", () => {
    conversationScroll.querySelectorAll(".message-row").forEach((row) => row.remove());
    showToast("Conversation cleared.");
  });

  endBtn.addEventListener("click", () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    showToast("Conversation ended. Session summary will appear on the dashboard.");
    setMicState("idle");
  });

  /* ---------------- Mic button ---------------- */
  micButton.addEventListener("click", handleMicTap);

  /* ---------------- Role switcher (demo only) ---------------- */
  function applyRole(role) {
    currentRole = role;
    const meta = ROLE_META[role];
    userAvatar.textContent = meta.avatar;
    userName.textContent = meta.name;
    userRole.textContent = meta.roleLabel;
    micLangLabel.textContent = `Speak in ${meta.speakLang}`;
    micButton.setAttribute("aria-label", meta.micAria);

    roleTeacherBtn.classList.toggle("role-btn-active", role === "teacher");
    roleStudentBtn.classList.toggle("role-btn-active", role === "student");
  }

  roleTeacherBtn.addEventListener("click", () => applyRole("teacher"));
  roleStudentBtn.addEventListener("click", () => applyRole("student"));

  /* ---------------- Mobile sidebar ---------------- */
  function openSidebar() {
    sidebar.classList.add("is-open");
    sidebarOverlay.classList.add("is-visible");
    hamburgerBtn.setAttribute("aria-expanded", "true");
  }
  function closeSidebar() {
    sidebar.classList.remove("is-open");
    sidebarOverlay.classList.remove("is-visible");
    hamburgerBtn.setAttribute("aria-expanded", "false");
  }
  hamburgerBtn.addEventListener("click", () => {
    if (sidebar.classList.contains("is-open")) closeSidebar();
    else openSidebar();
  });
  sidebarOverlay.addEventListener("click", closeSidebar);

  /* ---------------- Init ---------------- */
  function init() {
    applyRole(currentRole);
    setMicState("idle");
    SEED_MESSAGES.forEach((m) => renderMessage({ ...m, speaker: m.speaker }));
    // Disable autoplay for the seeded history so the page doesn't
    // speak four lines immediately on load.
  }

  // Prevent seed messages from auto-playing on load by temporarily
  // disabling autoplay, then restoring the user's default (on).
  autoPlayOn = false;
  init();
  autoPlayOn = true;
})();
