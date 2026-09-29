import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { formatEuro } from '../lib/format';
import './Showroom.css';

// On, off, on, off, on: a fluorescent tube starting up.
const FLICKER_MS = [0, 90, 170, 300, 380];

/*
 * The line-up: every model parked in its own bay, dark at first. When a bay
 * scrolls into view its light flickers on, one bay after the other.
 * Choosing a car opens it in the configurator below.
 */
export default function Showroom({ models, onChoose }) {
  return (
    <ul className="showroom">
      {models.map((model, index) => (
        <li key={model.slug}>
          <Bay model={model} index={index} onChoose={onChoose} />
        </li>
      ))}
    </ul>
  );
}

function Bay({ model, index, onChoose }) {
  const ref = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const noObserver = typeof IntersectionObserver === 'undefined';
  const [lit, setLit] = useState(false);
  const isLit = lit || reducedMotion || noObserver;

  useEffect(() => {
    if (reducedMotion || noObserver) return undefined;
    const timers = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const wide = window.innerWidth > 700;
        const delay = wide ? index * 450 : 120; // one after another on wide screens
        FLICKER_MS.forEach((t, step) =>
          timers.push(setTimeout(() => setLit(step % 2 === 0), delay + t))
        );
      },
      { threshold: 0.45 }
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [index, reducedMotion, noObserver]);

  return (
    <button
      ref={ref}
      type="button"
      className={`bay${isLit ? ' is-lit' : ''}`}
      onClick={() => onChoose(model.slug)}
      aria-label={`${model.name}: open in the configurator`}
    >
      <span className="bay__tube" aria-hidden="true" />
      <span className="bay__cone" aria-hidden="true" />
      <span className="bay__pool" aria-hidden="true" />
      <img className="bay__car" src={model.image_url} alt="" loading="lazy" />
      <span className="bay__meta">
        <span>
          <span className="bay__tagline">{model.tagline}</span>
          <span className="bay__name">{model.name}</span>
        </span>
        <span className="bay__cta">
          <span className="bay__price">from {formatEuro(model.base_price_eur)}</span>
          Configure →
        </span>
      </span>
    </button>
  );
}
