import { useI18n } from '../i18n/context';
import { LANGUAGES } from '../i18n/translate';
import './LanguageSwitcher.css';

/** EN · DE · RO: each button says its language's own name to screen readers. */
export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="lang-switch" role="group" aria-label={t('common.language')}>
      {LANGUAGES.map((language) => (
        <button
          key={language.code}
          type="button"
          lang={language.code}
          aria-label={language.name}
          aria-pressed={language.code === lang}
          onClick={() => setLang(language.code)}
        >
          {language.short}
        </button>
      ))}
    </div>
  );
}
