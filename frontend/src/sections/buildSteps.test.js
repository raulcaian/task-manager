import { describe, expect, it } from 'vitest';
import { activeStep, layerReveal } from './buildSteps';

describe('build steps', () => {
  it('starts with nothing drawn', () => {
    expect(layerReveal(0)).toEqual([0, 0, 0, 0]);
    expect(activeStep(0)).toBe(0);
  });

  it('draws the sketch first, then pauses before the clay', () => {
    expect(layerReveal(0.08)[0]).toBeCloseTo(0.5);
    expect(layerReveal(0.2)).toEqual([1, 0, 0, 0]);
    expect(activeStep(0.2)).toBe(0);
  });

  it('wipes in the clay during its own window', () => {
    const [, clay, paint] = layerReveal(0.34);
    expect(clay).toBeCloseTo(0.5);
    expect(paint).toBe(0);
    expect(activeStep(0.34)).toBe(1);
  });

  it('shows every layer at the end', () => {
    expect(layerReveal(1)).toEqual([1, 1, 1, 1]);
    expect(activeStep(1)).toBe(3);
  });
});
