import { createContext, useContext } from 'react';
import { localeOf, makeTranslator } from './translate';

// English by default, so components also work (and test) without the provider.
export const I18nContext = createContext({
  lang: 'en',
  locale: localeOf('en'),
  t: makeTranslator('en'),
  setLang: () => {},
});

export const useI18n = () => useContext(I18nContext);
