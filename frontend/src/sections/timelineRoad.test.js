import { describe, expect, it } from 'vitest';
import { roadPosition } from './timelineRoad';

describe('roadPosition', () => {
  it('starts at the first era and ends at the last', () => {
    expect(roadPosition(0, 8).index).toBe(0);
    expect(roadPosition(1, 8).index).toBe(7);
  });

  it('switches to the next era halfway between two', () => {
    expect(roadPosition(0.5 / 7, 8).index).toBe(1);
    expect(roadPosition(0.49 / 7, 8).index).toBe(0);
  });
});
