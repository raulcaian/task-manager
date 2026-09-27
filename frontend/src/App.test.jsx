import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('shows the site title', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /porsche showroom/i })
    ).toBeInTheDocument();
  });
});
