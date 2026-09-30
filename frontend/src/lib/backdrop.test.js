import { describe, expect, it } from 'vitest';
import { mix, ridge, seeded } from './backdrop';

describe('backdrop helpers', () => {
  it('mixes two colours', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#102030', '#102030', 0.7)).toBe('#102030');
  });

  it('gives the same random numbers for the same seed', () => {
    const a = seeded(42);
    const b = seeded(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('draws a closed ridge above the baseline', () => {
    const path = ridge(seeded(1), { width: 100, base: 50, height: 20, peaks: 4 });
    expect(path.startsWith('M0,50')).toBe(true);
    expect(path.endsWith('L100,50 Z')).toBe(true);
  });
});
