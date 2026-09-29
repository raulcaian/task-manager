import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Showroom from './Showroom';

const MODELS = [
  { slug: '911-carrera', name: '911 Carrera', tagline: 'Coupé', image_url: '/a.webp', base_price_eur: 125900 },
  { slug: 'taycan', name: 'Taycan', tagline: 'Electric', image_url: '/b.webp', base_price_eur: 101500 },
];

describe('Showroom', () => {
  it('shows every model with its starting price', () => {
    render(<Showroom models={MODELS} onChoose={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByText(/from €125,900/)).toBeInTheDocument();
  });

  it('opens the chosen car in the configurator', () => {
    const onChoose = vi.fn();
    render(<Showroom models={MODELS} onChoose={onChoose} />);
    fireEvent.click(screen.getByRole('button', { name: /taycan/i }));
    expect(onChoose).toHaveBeenCalledWith('taycan');
  });
});
