/*
 * The opening scene, driven by scroll (0 → 1 through the tall hero section):
 *
 *   0.00 – 0.30  the smoke is blown away and the title fades in
 *   0.30 – 0.84  the title leaves and scrolling turns the camera around the car
 *                (the video is scrubbed, not played)
 *   0.84 – 1.00  the last frame holds with a slow zoom and a caption
 *
 * Everything here is a pure function of that progress, so it is testable.
 */

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/** 0 before `from`, 1 after `to`, a straight line in between. */
export function segment(value, from, to) {
  if (to <= from) return value >= to ? 1 : 0;
  return clamp((value - from) / (to - from));
}

export const easeOut = (value) => 1 - (1 - value) ** 3;

export const SMOKE_END = 0.3;
export const VIDEO_END = 0.84;

export function introFrame(progress) {
  const clear = segment(progress, 0, SMOKE_END);
  const textIn = segment(clear, 0.35, 0.8);
  const text = textIn * (1 - segment(progress, 0.36, 0.46));
  const hold = segment(progress, VIDEO_END, 1);
  const caption = segment(progress, 0.85, 0.92);
  return {
    clear,
    text,
    textShift: (1 - textIn) * 30,
    titleSpacing: (1 - textIn) * 0.12,
    brightness: (0.3 + 0.7 * segment(clear, 0.15, 0.85)) * (1 - 0.4 * text),
    scale: clear >= 1 ? 1 + 0.04 * hold : 1.08 - 0.08 * easeOut(clear),
    video: segment(progress, SMOKE_END, VIDEO_END),
    caption,
    captionShift: (1 - caption) * 24,
    hint: 1 - segment(progress, 0, 0.08),
  };
}
