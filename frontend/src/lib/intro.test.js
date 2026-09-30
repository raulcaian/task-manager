import { describe, expect, it } from 'vitest';
import { introFrame, segment, SMOKE_END, VIDEO_END } from './intro';

describe('segment', () => {
  it('maps a range to 0..1 and clamps outside it', () => {
    expect(segment(0.5, 0, 1)).toBe(0.5);
    expect(segment(-1, 0, 1)).toBe(0);
    expect(segment(2, 0, 1)).toBe(1);
    expect(segment(0.3, 0.2, 0.4)).toBeCloseTo(0.5);
  });

  it('acts as a step when the range is empty', () => {
    expect(segment(0.4, 0.5, 0.5)).toBe(0);
    expect(segment(0.5, 0.5, 0.5)).toBe(1);
  });
});

describe('introFrame', () => {
  it('starts in thick smoke with the title hidden and the hint shown', () => {
    const frame = introFrame(0);
    expect(frame.clear).toBe(0);
    expect(frame.text).toBe(0);
    expect(frame.hint).toBe(1);
    expect(frame.video).toBe(0);
    expect(frame.brightness).toBeCloseTo(0.3);
  });

  it('shows the title once the smoke has cleared', () => {
    const frame = introFrame(SMOKE_END);
    expect(frame.clear).toBe(1);
    expect(frame.text).toBe(1);
    expect(frame.textShift).toBe(0);
    expect(frame.hint).toBe(0);
  });

  it('turns the camera while the title leaves', () => {
    const frame = introFrame((SMOKE_END + VIDEO_END) / 2);
    expect(frame.text).toBe(0);
    expect(frame.video).toBeCloseTo(0.5);
    expect(frame.caption).toBe(0);
  });

  it('holds the last frame with a caption at the end', () => {
    const frame = introFrame(1);
    expect(frame.video).toBe(1);
    expect(frame.caption).toBe(1);
    expect(frame.scale).toBeCloseTo(1.04);
  });
});
