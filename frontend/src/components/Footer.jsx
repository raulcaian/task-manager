import { OWNER } from '../siteConfig';
import { NAV_LINKS } from './navLinks';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <p className="site-footer__wordmark">
            Porsche <span>Showroom</span>
          </p>
          <p className="site-footer__muted">
            A portfolio project by {OWNER.name}. React, FastAPI, PostgreSQL, Docker and AWS.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="site-footer__heading">Explore</h2>
          <ul className="site-footer__list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <address className="site-footer__contact">
          <h2 className="site-footer__heading">Contact</h2>
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
            Send a message →
          </a>
        </address>
      </div>

      <div className="container site-footer__legal">
        <p>
          © {year} {OWNER.name}. Not affiliated with Porsche AG. Car names and photos belong to
          their respective owners. Prices are illustrative.
        </p>
      </div>
    </footer>
  );
}
