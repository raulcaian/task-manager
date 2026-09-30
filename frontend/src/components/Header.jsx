import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/context';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';
import { NAV_LINKS } from './navLinks';
import './Header.css';

export default function Header() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Solid background once the page is scrolled, transparent over the intro.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Escape closes the mobile menu (expected keyboard behaviour).
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`site-header${scrolled || menuOpen ? ' is-solid' : ''}`}>
      <div className="site-header__inner container">
        <a className="site-header__home" href="#top" onClick={closeMenu}>
          <Logo />
        </a>

        <nav
          id="site-nav"
          className={`site-nav${menuOpen ? ' is-open' : ''}`}
          aria-label={t('header.mainNav')}
        >
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={closeMenu}>
                  {t(link.key)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__tools">
          <LanguageSwitcher />
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="visually-hidden">{menuOpen ? t('header.closeMenu') : t('header.openMenu')}</span>
            <span className="menu-toggle__bar" aria-hidden="true" />
            <span className="menu-toggle__bar" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
