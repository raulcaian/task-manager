import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Header from './Header';
import { NAV_LINKS } from './navLinks';

describe('Header', () => {
  it('links to every section', () => {
    render(<Header />);
    for (const link of NAV_LINKS) {
      expect(screen.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);
    }
  });

  it('opens and closes the mobile menu', () => {
    render(<Header />);
    const toggle = screen.getByRole('button', { name: /open menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAccessibleName(/close menu/i);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the menu after choosing a link', () => {
    render(<Header />);
    const toggle = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('link', { name: 'Garage' }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
