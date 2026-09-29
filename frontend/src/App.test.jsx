import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { NAV_LINKS } from './components/navLinks';

describe('App', () => {
  it('shows the hero heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /from sketch\s*to street/i })).toBeInTheDocument();
  });

  it('has a skip link to the main content', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main');
  });

  it('renders a section for every navigation link', () => {
    const { container } = render(<App />);
    for (const link of NAV_LINKS) {
      expect(container.querySelector(link.href)).not.toBeNull();
    }
  });
});
