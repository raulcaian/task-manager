import { TRANSLATIONS } from './translations';

export const LANGUAGES = [
  { code: 'en', short: 'EN', name: 'English', locale: 'en-IE' },
  { code: 'de', short: 'DE', name: 'Deutsch', locale: 'de-DE' },
  { code: 'ro', short: 'RO', name: 'Română', locale: 'ro-RO' },
];

const STORAGE_KEY = 'showroom.lang';

const lookup = (dict, key) => key.split('.').reduce((node, part) => node?.[part], dict);

/** t('common.from', { price: '€1' }) in the given language, English as fallback. */
export function makeTranslator(lang) {
  const dict = TRANSLATIONS[lang] ?? TRANSLATIONS.en;
  return (key, vars = {}) => {
    const text = lookup(dict, key) ?? lookup(TRANSLATIONS.en, key) ?? key;
    return typeof text === 'string'
      ? text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
      : text;
  };
}

export const localeOf = (lang) => (LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]).locale;

/** The saved choice, else the browser's first supported language, else English. */
export function detectLanguage() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch {
    // storage can be blocked (private mode); fall through
  }
  const wanted = typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language];
  for (const code of wanted) {
    const short = String(code).slice(0, 2).toLowerCase();
    if (LANGUAGES.some((l) => l.code === short)) return short;
  }
  return 'en';
}

export function saveLanguage(lang) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // not important if it cannot be saved
  }
}
