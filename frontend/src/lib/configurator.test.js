import { describe, expect, it } from 'vitest';
import { isAvailable, paintedImageUrl, ruleHint, selectionForModel, toggleOption } from './configurator';

const OPTIONS = [
  { code: 'wheels-standard', category: 'wheels', name: 'Standard', available_for: null, requires: [], excludes: [] },
  { code: 'wheels-aero', category: 'wheels', name: 'Aero', available_for: ['taycan'], requires: [], excludes: [] },
  { code: 'wheels-sport', category: 'wheels', name: 'Sport', available_for: null, requires: [], excludes: [] },
  { code: 'brakes', category: 'performance', name: 'Brakes', available_for: null, requires: ['wheels-sport'], excludes: [] },
  { code: 'hitch', category: 'practical', name: 'Hitch', available_for: ['cayenne'], requires: [], excludes: ['brakes'] },
];

describe('configurator helpers', () => {
  it('checks availability per model', () => {
    expect(isAvailable(OPTIONS[0], '911-carrera')).toBe(true);
    expect(isAvailable(OPTIONS[1], '911-carrera')).toBe(false);
  });

  it('keeps exactly one wheel choice', () => {
    const next = toggleOption(['wheels-standard', 'brakes'], OPTIONS[2], OPTIONS);
    expect(next).toEqual(['brakes', 'wheels-sport']);
  });

  it('toggles normal options on and off', () => {
    expect(toggleOption(['wheels-standard'], OPTIONS[3], OPTIONS)).toContain('brakes');
    expect(toggleOption(['brakes'], OPTIONS[3], OPTIONS)).toEqual([]);
  });

  it('drops options the new model cannot have and restores default wheels', () => {
    expect(selectionForModel(['wheels-aero', 'brakes'], OPTIONS, '911-carrera')).toEqual([
      'wheels-standard',
      'brakes',
    ]);
  });

  it('describes the rules of an option', () => {
    expect(ruleHint(OPTIONS[3], OPTIONS)).toBe('Requires Sport');
    expect(ruleHint(OPTIONS[4], OPTIONS)).toBe('Not with Brakes');
  });

  it('points to the pre-rendered photo of each paint', () => {
    expect(paintedImageUrl('/media/cars/taycan.webp', 'Blue')).toBe('/media/cars/taycan-blue.webp');
    expect(paintedImageUrl('/media/cars/taycan.webp', 'Original')).toBe('/media/cars/taycan.webp');
  });
});
