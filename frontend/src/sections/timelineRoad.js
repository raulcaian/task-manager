// Photos where the car faces left; they are mirrored so every car drives
// the same way along the road.
export const FACES_LEFT = new Set(['1931', '1948', '1963', 'Today']);

/** Which era is on screen, and how far the road has moved, for 0..1 progress. */
export function roadPosition(progress, eraCount) {
  const position = progress * (eraCount - 1);
  return { index: Math.round(position), position };
}
