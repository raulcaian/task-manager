import { describe, expect, it } from 'vitest';
import { computeProgress } from './useScrollProgress';

describe('computeProgress', () => {
  const viewport = 800;

  it('is 0 before the section reaches the top', () => {
    expect(computeProgress({ top: 300, height: 3200 }, viewport)).toBe(0);
  });

  it('is 0.5 halfway through the scrollable part', () => {
    expect(computeProgress({ top: -1200, height: 3200 }, viewport)).toBe(0.5);
  });

  it('is clamped to 1 after the section', () => {
    expect(computeProgress({ top: -5000, height: 3200 }, viewport)).toBe(1);
  });

  it('handles sections shorter than the viewport', () => {
    expect(computeProgress({ top: 10, height: 400 }, viewport)).toBe(0);
    expect(computeProgress({ top: -10, height: 400 }, viewport)).toBe(1);
  });
});
