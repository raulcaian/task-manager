import { describe, expect, it } from 'vitest';
import { socProfile } from './trip';

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
