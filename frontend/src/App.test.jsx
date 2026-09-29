import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { NAV_LINKS } from './components/navLinks';

describe('App', () => {
  // No backend in unit tests: every API call fails fast.
  beforeEach(() => vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline'))));
  afterEach(() => vi.unstubAllGlobals());

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

  it('explains when the API cannot be reached', async () => {
    render(<App />);
    expect(await screen.findByText(/the garage could not be loaded/i)).toBeInTheDocument();
  });
});
