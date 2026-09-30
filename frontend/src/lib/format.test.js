import { describe, expect, it } from 'vitest';
import { formatDuration, formatEuro, formatKm } from './format';

describe('format', () => {
  it('formats durations', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(120)).toBe('2 h');
    expect(formatDuration(205.4)).toBe('3 h 25 min');
  });

  it('formats euros without cents', () => {
    expect(formatEuro(125900)).toMatch(/125,900/);
    expect(formatEuro(125900)).toContain('€');
  });

  it('uses the visitor\'s locale', () => {
    expect(formatEuro(125900, 'de-DE')).toMatch(/125\.900/);
    expect(formatKm(1234.6, 'de-DE')).toBe('1.235 km');
  });

  it('formats kilometres', () => {
    expect(formatKm(1234.6)).toBe('1,235 km');
  });
});
