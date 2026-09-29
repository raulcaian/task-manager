import { describe, expect, it } from 'vitest';
import { activeStep, layerReveal } from './buildSteps';

describe('build steps', () => {
  it('shows only the sketch at the start', () => {
    expect(layerReveal(0)).toEqual([1, 0, 0, 0]);
    expect(activeStep(0)).toBe(0);
  });

  it('wipes in the clay during the first third', () => {
    const [, clay, paint] = layerReveal(1 / 6);
    expect(clay).toBeCloseTo(0.5);
    expect(paint).toBe(0);
  });

  it('shows every layer at the end', () => {
    expect(layerReveal(1)).toEqual([1, 1, 1, 1]);
    expect(activeStep(1)).toBe(3);
  });
});
