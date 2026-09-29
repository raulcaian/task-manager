import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import './Hero.css';

const POSTER = '/media/intro/intro-poster.webp';

export default function Hero() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__media" aria-hidden="true">
        {reducedMotion ? (
          <img src={POSTER} alt="" />
        ) : (
          <video autoPlay muted loop playsInline preload="auto" poster={POSTER}>
            {/* The browser picks the first source it can play: small file on phones. */}
            <source src="/media/intro/intro-720.mp4" type="video/mp4" media="(max-width: 760px)" />
            <source src="/media/intro/intro-1280.webm" type="video/webm" />
            <source src="/media/intro/intro-1280.mp4" type="video/mp4" />
          </video>
        )}
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

      <a className="hero__scroll" href="#build" aria-label="Scroll to the build section">
        <span aria-hidden="true" />
      </a>
    </section>
  );
}
