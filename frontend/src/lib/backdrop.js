/*
 * Small helpers for the illustrated era backdrops: colour mixing and a
 * seeded random generator, so every backdrop is the same on every visit.
 */

export function mix(hexA, hexB, t) {
  const a = hexA.match(/\w\w/g).map((x) => parseInt(x, 16));
  const b = hexB.match(/\w\w/g).map((x) => parseInt(x, 16));
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** mulberry32: tiny deterministic random numbers in [0, 1). */
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A jagged ridge from x=0 to x=width, closed down to the baseline. */
export function ridge(random, { width, base, height, peaks, jitter = 0.35 }) {
  const points = [];
  for (let i = 0; i <= peaks; i += 1) {
    const x = (i / peaks) * width;
    const up = i % 2 === 1 ? 1 : 0.35 + random() * 0.3;
    const y = base - height * up * (1 - jitter + random() * jitter);
    points.push(`${x.toFixed(0)},${y.toFixed(0)}`);
  }
  return `M0,${base} L${points.join(' L')} L${width},${base} Z`;
}
