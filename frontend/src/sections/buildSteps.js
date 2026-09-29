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

/**
 * How far each layer is revealed (0..1) for a scroll progress of 0..1.
 * The first layer is always visible; each later layer wipes in over its
 * own share of the scroll.
 */
export function layerReveal(progress, count = BUILD_STEPS.length) {
  const position = progress * (count - 1);
  return Array.from({ length: count }, (_, index) =>
    index === 0 ? 1 : Math.min(1, Math.max(0, position - (index - 1)))
  );
}

/** Index of the step that is currently (mostly) on screen. */
export const activeStep = (progress, count = BUILD_STEPS.length) =>
  Math.min(count - 1, Math.round(progress * (count - 1)));
