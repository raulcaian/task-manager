import { useI18n } from '../i18n/context';
import { OWNER } from '../siteConfig';
import { NAV_LINKS } from './navLinks';
import './Footer.css';

export default function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <p className="site-footer__wordmark">
            Porsche <span>Showroom</span>
          </p>
          <p className="site-footer__muted">
            {t('footer.about', { name: OWNER.name })}
          </p>
        </div>

        <nav aria-label={t('footer.explore')}>
          <h2 className="site-footer__heading">{t('footer.explore')}</h2>
          <ul className="site-footer__list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{t(link.key)}</a>
              </li>
            ))}
          </ul>
        </nav>

        <address className="site-footer__contact">
          <h2 className="site-footer__heading">{t('footer.contact')}</h2>
          <ul className="site-footer__list">
            <li>
              <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>
            </li>
            <li className="site-footer__muted">{OWNER.location}</li>
            <li>
              <a href={OWNER.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </li>
            {OWNER.linkedin && (
              <li>
                <a href={OWNER.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              </li>
            )}
          </ul>
          <a className="site-footer__cta" href="#contact">
            {t('footer.write')}
          </a>
        </address>
      </div>

      <div className="container site-footer__legal">
        <p>
          {t('footer.legal', { year, name: OWNER.name })}
        </p>
      </div>
    </footer>
  );
}
