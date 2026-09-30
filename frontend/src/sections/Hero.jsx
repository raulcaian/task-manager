import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';
import { useEffect, useRef } from 'react';
import { computeProgress } from '../hooks/useScrollProgress';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useI18n } from '../i18n/context';
import { introFrame, segment } from '../lib/intro';
import { createSmokeRenderer } from '../lib/smokeRenderer';
import './Hero.css';

const VIDEO = '/media/intro/studio.mp4';
const POSTER = '/media/intro/studio-poster.jpg';

// Calls back with true/false as the element enters and leaves the screen.
// Without IntersectionObserver (old browsers, tests) it counts as always visible.
function watchVisibility(element, callback) {
  if (typeof IntersectionObserver === 'undefined') {
    callback(true);
    return () => {};
  }
  const observer = new IntersectionObserver(([entry]) => callback(entry.isIntersecting));
  observer.observe(element);
  return () => observer.disconnect();
}

/*
 * The opening scene. A tall section with a sticky stage: the page starts in
 * thick smoke, scrolling blows it away to reveal the title, then scrolling on
 * turns the camera around the car (the video follows the scroll position) and
 * the last frame holds with a caption. Styles are written straight to the DOM
 * once per frame so React does not re-render 60 times a second.
 */
export default function Hero() {
  const reducedMotion = usePrefersReducedMotion();
  const { t } = useI18n();
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const textRef = useRef(null);
  const titleRef = useRef(null);
  const captionRef = useRef(null);
  const barRef = useRef(null);
  const canvasRef = useRef(null);
  const fallbackRef = useRef(null);
  const hintRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    const text = textRef.current;
    const title = titleRef.current;
    const caption = captionRef.current;
    const bar = barRef.current;
    const canvas = canvasRef.current;
    const fallback = fallbackRef.current;
    const hint = hintRef.current;
    if (!section || !stage || !video || !canvas) return undefined;

    const renderer = createSmokeRenderer(canvas);
    fallback.hidden = Boolean(renderer);
    const resize = () => renderer?.resize(stage.clientWidth, stage.clientHeight);
    resize();

    let target = 0;
    let current = 0;
    const mouse = [-9999, -9999];
    const mouseTarget = [-9999, -9999];
    const start = performance.now();
    let frameId = 0;
    let running = false;

    const readScroll = () => {
      target = computeProgress(section.getBoundingClientRect(), window.innerHeight);
    };
    const onPointer = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouseTarget[0] = event.clientX - rect.left;
      mouseTarget[1] = event.clientY - rect.top;
    };
    // iOS / Safari only let a script move through a video after it has been
    // "started" once by a touch, so play and pause it on the first touch.
    const unlock = () => {
      video.play()?.then(() => video.pause()).catch(() => {});
    };

    const render = (now) => {
      current += (target - current) * 0.08;
      if (Math.abs(target - current) < 1e-4) current = target;
      const frame = introFrame(current);
      const time = (now - start) / 1000;

      if (renderer && frame.clear < 0.999) {
        mouse[0] += (mouseTarget[0] - mouse[0]) * 0.1;
        mouse[1] += (mouseTarget[1] - mouse[1]) * 0.1;
        // The red glow behind the smoke switches on after about half a second.
        renderer.draw({
          time: reducedMotion ? 0 : time,
          clear: frame.clear,
          light: segment(time, 0.6, 2.2),
          mouse,
        });
      }
      canvas.style.opacity = frame.clear >= 0.999 ? '0' : '1';
      fallback.style.opacity = String(1 - frame.clear);

      text.style.opacity = String(frame.text);
      text.style.transform = `translateY(${frame.textShift}px)`;
      title.style.letterSpacing = `${frame.titleSpacing}em`;

      video.style.filter = `brightness(${frame.brightness})`;
      video.style.transform = `scale(${frame.scale})`;
      if (video.duration && !video.seeking) {
        const wanted = frame.video * (video.duration - 0.05);
        if (Math.abs(video.currentTime - wanted) > 0.02) video.currentTime = wanted;
      }
      bar.style.width = `${frame.video * 100}%`;

      caption.style.opacity = String(frame.caption);
      caption.style.transform = `translateY(${frame.captionShift}px)`;
      hint.style.opacity = String(frame.hint);

      frameId = running ? requestAnimationFrame(render) : 0;
    };

    const setRunning = (value) => {
      if (value === running) return;
      running = value;
      if (running) frameId = requestAnimationFrame(render);
      else cancelAnimationFrame(frameId);
    };

    readScroll();
    current = target;
    render(start);
    // Only animate while the intro is on screen, to save battery.
    const stopWatching = watchVisibility(section, setRunning);
    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });

    return () => {
      stopWatching();
      setRunning(false);
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchstart', unlock);
      renderer?.dispose();
    };
  }, [reducedMotion]);

  return (
    <section ref={sectionRef} className="intro" aria-labelledby="hero-title">
      <div ref={stageRef} className="intro__stage">
        <div className="intro__scene">
          <video
            ref={videoRef}
            className="intro__video"
            src={VIDEO}
            poster={POSTER}
            muted
            playsInline
            preload="auto"
            aria-label={t('hero.videoLabel')}
          />
          <div className="intro__shade" aria-hidden="true" />

          <div ref={textRef} className="intro__text">
            <p className="intro__kicker">{t('hero.kicker')}</p>
            <h1 ref={titleRef} id="hero-title" className="intro__title">
              {t('hero.title1')}
              <br />
              <em>{t('hero.title2')}</em>
            </h1>
            <p className="intro__lead">{t('hero.lead')}</p>
          </div>

          <div ref={captionRef} className="intro__caption">
            <small>{t('hero.captionTag')}</small>
            <h2>{t('hero.captionTitle')}</h2>
            <p>{t('hero.captionText')}</p>
          </div>

          <div ref={barRef} className="intro__bar" aria-hidden="true" />
        </div>

        <canvas ref={canvasRef} className="intro__smoke" aria-hidden="true" />
        <div ref={fallbackRef} className="intro__smoke-fallback" aria-hidden="true" hidden />
        <p ref={hintRef} className="intro__hint" aria-hidden="true">
          {t('hero.hint')}
          <span />
        </p>
      </div>
    </section>
  );
}
