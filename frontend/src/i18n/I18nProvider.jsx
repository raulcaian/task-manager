import { useEffect, useMemo, useState } from 'react';
import { I18nContext } from './context';
import { detectLanguage, localeOf, makeTranslator, saveLanguage } from './translate';

export default function I18nProvider({ children }) {
  const [lang, setLang] = useState(detectLanguage);

  // <html lang> tells screen readers and browsers which language to use.
  useEffect(() => {
    document.documentElement.lang = lang;
    saveLanguage(lang);
  }, [lang]);

  const value = useMemo(
    () => ({ lang, locale: localeOf(lang), t: makeTranslator(lang), setLang }),
    [lang]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
