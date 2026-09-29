import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import './Hero.css';

const POSTER = '/media/intro/intro-poster.webp';

// Pick the file once, in JavaScript: <source media> is not supported everywhere.
function pickVideo() {
  const small = window.matchMedia?.('(max-width: 760px)').matches;
  return small ? '/media/intro/intro-720.mp4' : '/media/intro/intro-1280.mp4';
}

export default function Hero() {
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef(null);
  const [src] = useState(pickVideo);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // React sets `muted` only as a property, but Safari and iOS decide about
    // autoplay from the attribute, so set both before asking to play.
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    if (reducedMotion) {
      video.pause();
      return;
    }
    const attempt = video.play();
    // play() is blocked in e.g. Low Power Mode: the poster simply stays visible.
    attempt?.catch?.(() => setPlaying(false));
  }, [reducedMotion]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play()?.catch?.(() => {});
    else video.pause();
  };

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__media" aria-hidden="true">
        <video
          ref={videoRef}
          src={src}
          poster={POSTER}
          muted
          loop
          playsInline
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      </div>

      <div className="hero__content container">
        <p className="eyebrow">A Porsche Engineering portfolio</p>
        <h1 id="hero-title" className="hero__title">
          From sketch
          <br />
          to street.
        </h1>
        <p className="hero__lead">
          Scroll to watch a 911 take shape, configure your own in the garage and plan an
          electric road trip, all powered by a FastAPI backend on AWS.
        </p>
        <a className="button" href="#build">
          Start the build
        </a>
      </div>

      {/* Moving content longer than 5 s needs a pause control (WCAG 2.2.2). */}
      <button type="button" className="hero__playback" onClick={togglePlayback}>
        {playing ? 'Pause video' : 'Play video'}
      </button>

      <a className="hero__scroll" href="#build" aria-label="Scroll to the build section">
        <span aria-hidden="true" />
      </a>
    </section>
  );
}
