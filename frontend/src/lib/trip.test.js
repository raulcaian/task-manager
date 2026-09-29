import { describe, expect, it } from 'vitest';
import { fitToBox, socProfile } from './trip';

describe('fitToBox', () => {
  const route = [
    [44.43, 26.1], // Bucharest
    [46.77, 23.62], // Cluj-Napoca
  ];

  it('keeps every point inside the box', () => {
    const project = fitToBox(route, 600, 400, 20);
    for (const point of route) {
      const [x, y] = project(point);
      expect(x).toBeGreaterThanOrEqual(20 - 1e-6);
      expect(x).toBeLessThanOrEqual(580 + 1e-6);
      expect(y).toBeGreaterThanOrEqual(20 - 1e-6);
      expect(y).toBeLessThanOrEqual(380 + 1e-6);
    }
  });

  it('puts the northern city higher (smaller y) and the western city left', () => {
    const project = fitToBox(route, 600, 400);
    const [bx, by] = project(route[0]);
    const [cx, cy] = project(route[1]);
    expect(cy).toBeLessThan(by);
    expect(cx).toBeLessThan(bx);
  });
});

describe('socProfile', () => {
  it('includes the jump at each charging stop', () => {
    const trip = {
      start_soc: 80,
      distance_km: 450,
      arrival_soc: 22,
      stops: [{ at_km: 250, arrive_soc: 12, depart_soc: 60 }],
    };
    expect(socProfile(trip)).toEqual([
      { km: 0, soc: 80 },
      { km: 250, soc: 12 },
      { km: 250, soc: 60 },
      { km: 450, soc: 22 },
    ]);
  });
});
