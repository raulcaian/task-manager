export const BUILD_STEPS = [
  {
    key: 'sketch',
    title: 'Sketch',
    image: '/media/build/sketch.webp',
    text: 'Every Porsche starts as lines on paper: proportions, the roofline, the stance.',
  },
  {
    key: 'clay',
    title: 'Clay',
    image: '/media/build/clay.webp',
    text: 'A full-size clay model turns the drawing into surfaces you can walk around.',
  },
  {
    key: 'paint',
    title: 'Paint',
    image: '/media/build/paint.webp',
    text: 'Colour and materials are chosen and tested on the body.',
  },
  {
    key: 'finish',
    title: 'Finish',
    image: '/media/build/finish.webp',
    text: 'Glass, lights and wheels: the car is ready for the road.',
  },
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
