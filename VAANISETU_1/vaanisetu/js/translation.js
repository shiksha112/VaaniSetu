/**
 * VaaniSetu — Translation Service
 * ---------------------------------------------------------------
 * This is the ONLY place lesson content is resolved into a
 * student's chosen language. For the prototype it reads the
 * pre-computed `translatedNotes` map that ships on each lesson
 * object (simulating a translation that already ran).
 *
 * Swap-out plan for the real product:
 *   Frontend -> FastAPI -> Translation Service (AI model) -> DB
 * The functions below are the seam: replace the body of
 * `getTranslatedField` with a fetch() to the translation API and
 * every screen that calls this module keeps working unchanged.
 * ---------------------------------------------------------------
 */

const TranslationService = (() => {

  // Languages the prototype can actually render content for.
  const SUPPORTED_LANGUAGES = ['hindi', 'santhali'];

  // Full language catalogue shown in the UI (future languages appear
  // as "coming soon" so the picker doesn't need to change shape later).
  const LANGUAGE_CATALOGUE = [
    { code: 'hindi', label: 'Hindi', active: true },
    { code: 'santhali', label: 'Santhali', active: true },
    { code: 'ho', label: 'Ho', active: false },
    { code: 'mundari', label: 'Mundari', active: false },
  ];

  function isSupported(languageCode) {
    return SUPPORTED_LANGUAGES.includes(languageCode);
  }

  function getLanguageLabel(languageCode) {
    const entry = LANGUAGE_CATALOGUE.find(l => l.code === languageCode);
    return entry ? entry.label : languageCode;
  }

  /**
   * Resolve a single translated field off a lesson's translatedNotes map.
   * Falls back to the teacher's original notes if a translation is
   * missing, so the UI never renders blank content.
   */
  function getTranslatedField(lesson, languageCode) {
    if (!lesson) return '';
    const map = lesson.translatedNotes || {};
    if (isSupported(languageCode) && map[languageCode]) {
      return map[languageCode];
    }
    return lesson.notes || '';
  }

  /**
   * Public entry point used by the dashboard/lesson pages.
   * `lesson` is a lesson record, `languageCode` is the student's
   * selected learning language (e.g. "santhali").
   */
  function getTranslatedContent(lesson, languageCode) {
    return getTranslatedField(lesson, languageCode);
  }

  /**
   * The teacher's original-language notes, used by the
   * "Show Hindi" bilingual toggle.
   */
  function getOriginalContent(lesson) {
    if (!lesson) return '';
    const teachingLang = (lesson.teachingLanguage || 'hindi').toLowerCase();
    return getTranslatedField(lesson, teachingLang) || lesson.notes || '';
  }

  return {
    SUPPORTED_LANGUAGES,
    LANGUAGE_CATALOGUE,
    isSupported,
    getLanguageLabel,
    getTranslatedContent,
    getOriginalContent,
  };
})();
