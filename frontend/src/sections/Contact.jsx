import { useCallback, useState } from 'react';
import Turnstile from '../components/Turnstile';
import { useI18n } from '../i18n/context';
import { api, errorMessage } from '../lib/api';
import './Contact.css';

// Public site key (safe to ship in the browser). Empty = no captcha, e.g. locally.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';

const EMPTY = { name: '', email: '', message: '', website: '' };

export default function Contact() {
  const { t, lang } = useI18n();
  const [form, setForm] = useState(EMPTY);
  const [token, setToken] = useState(null);
  const [captchaRound, setCaptchaRound] = useState(0);
  // `key` is a translation key (re-translated if the language changes), `text` a fixed message.
  const [status, setStatus] = useState({ state: 'idle' });
  const onToken = useCallback((value) => setToken(value), []);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (SITE_KEY && !token) {
      setStatus({ state: 'error', key: 'contact.waitCaptcha' });
      return;
    }
    setStatus({ state: 'sending' });
    try {
      await api.contact({ ...form, turnstile_token: token });
      setForm(EMPTY);
      setStatus({ state: 'sent', key: 'contact.sent' });
    } catch (err) {
      if (err.status === 400) setStatus({ state: 'error', key: 'contact.captchaFailed' });
      else setStatus({ state: 'error', text: errorMessage(err, t) });
    } finally {
      // A Turnstile token can be used only once: get a fresh one.
      setToken(null);
      setCaptchaRound((n) => n + 1);
    }
  };

  const sending = status.state === 'sending';

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="container contact__layout">
        <header className="section-header">
          <p className="eyebrow">{t('contact.eyebrow')}</p>
          <h2 id="contact-title" className="section-title">
            {t('contact.title')}
          </h2>
          <p className="section-lead">{t('contact.lead')}</p>
        </header>

        <form className="contact-form" onSubmit={submit}>
          <div className="field">
            <label className="field__label" htmlFor="contact-name">
              {t('contact.name')}
            </label>
            <input id="contact-name" className="input" required minLength={2} maxLength={100} autoComplete="name" value={form.name} onChange={update('name')} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="contact-email">
              {t('contact.email')}
            </label>
            <input id="contact-email" className="input" type="email" required maxLength={254} autoComplete="email" value={form.email} onChange={update('email')} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="contact-message">
              {t('contact.message')}
            </label>
            <textarea id="contact-message" className="input" required minLength={10} maxLength={2000} value={form.message} onChange={update('message')} />
          </div>

          {/* Honeypot: invisible to people, tempting for bots. */}
          <div className="contact-form__trap" aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input id="contact-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update('website')} />
          </div>

          {SITE_KEY && <Turnstile siteKey={SITE_KEY} onToken={onToken} resetKey={captchaRound} language={lang} />}

          <button className="button" type="submit" disabled={sending}>
            {sending ? t('contact.sending') : t('contact.send')}
          </button>
          <p
            className={`status${status.state === 'error' ? ' status--error' : ''}${status.state === 'sent' ? ' status--success' : ''}`}
            role="status"
          >
            {status.key ? t(status.key) : status.text}
          </p>
        </form>
      </div>
    </section>
  );
}
