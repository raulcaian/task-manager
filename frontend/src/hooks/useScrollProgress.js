import { useEffect, useState } from 'react';

/**
 * How far the page has scrolled through an element, from 0 to 1.
 *
 * 0 = the element's top has just reached the top of the viewport,
 * 1 = its bottom has reached the bottom of the viewport.
 * This is the progress we need for "sticky" scroll scenes: a tall section
 * with a sticky stage inside it, where the stage changes as you scroll.
 */
export function computeProgress(rect, viewportHeight) {
  const scrollable = rect.height - viewportHeight;
  if (scrollable <= 0) return rect.top <= 0 ? 1 : 0;
  return Math.min(1, Math.max(0, -rect.top / scrollable));
}

export function useScrollProgress(ref) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    let frame = 0;
    const update = () => {
      frame = 0;
      setProgress(computeProgress(element.getBoundingClientRect(), window.innerHeight));
    };
    // Scroll events can fire many times per frame; only measure once per frame.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref]);

  return progress;
}
