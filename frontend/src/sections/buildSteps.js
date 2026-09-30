// Titles and texts are translated: build.steps.<key>.title / .text
export const BUILD_STEPS = [
  { key: 'sketch', image: '/media/build/sketch.webp' },
  { key: 'clay', image: '/media/build/clay.webp' },
  { key: 'paint', image: '/media/build/paint.webp' },
  { key: 'finish', image: '/media/build/finish.webp' },
];

/*
 * The part of the scroll (0..1) in which each step is drawn. The gaps
 * between the windows are pauses, so every stage stays on screen fully
 * built for a moment before the next one starts.
 */
export const STEP_WINDOWS = [
  [0.0, 0.16],
  [0.26, 0.42],
  [0.52, 0.68],
  [0.78, 0.94],
];

const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** How far each layer is revealed (0..1) for a scroll progress of 0..1. */
export function layerReveal(progress) {
  return STEP_WINDOWS.map(([start, end]) => clamp01((progress - start) / (end - start)));
}

/** The step being drawn or shown: the last one that has started. */
export function activeStep(progress) {
  let current = 0;
  STEP_WINDOWS.forEach(([start], index) => {
    if (progress >= start && index > 0) current = index;
  });
  return current;
}

// Shown when the car is finished. Manufacturer data for the 911 Carrera
// (992.2) coupé, from porsche.com; 0–100 km/h without Sport Chrono.
// Labels are translated: build.stats.<key>
export const FINISH_STATS = [
  { key: 'power', value: 394, decimals: 0, unit: 'PS' },
  { key: 'torque', value: 450, decimals: 0, unit: 'Nm' },
  { key: 'accel', value: 4.1, decimals: 1, unit: 's' },
  { key: 'top', value: 294, decimals: 0, unit: 'km/h' },
  { key: 'engine', value: 3.0, decimals: 1, unit: 'L' },
];

/** Numbers count up as the finish stage is revealed (ease-out). */
export function countUp(value, reveal) {
  const eased = 1 - (1 - Math.min(1, Math.max(0, reveal))) ** 3;
  return value * eased;
}
