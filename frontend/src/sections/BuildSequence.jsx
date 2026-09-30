import { useRef } from 'react';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { activeStep, BUILD_STEPS, countUp, FINISH_STATS, layerReveal } from './buildSteps';
import './BuildSequence.css';

/*
 * A tall section with a sticky stage. While you scroll, the car is built in
 * four stages, each with its own setting: a blueprint on a drawing board,
 * clay in the modelling studio, the paint booth and the showroom. Each layer
 * wipes in behind a scan line, then pauses so the stage can be seen whole.
 */
export default function BuildSequence() {
  const sectionRef = useRef(null);
  const progress = useScrollProgress(sectionRef);
  const reveal = layerReveal(progress);
  const current = activeStep(progress);
  const drawing = reveal.findIndex((value) => value > 0 && value < 1);

  return (
    <section id="build" ref={sectionRef} className="build" aria-labelledby="build-title">
      <div className={`build__stage is-${BUILD_STEPS[current].key}`}>
        {BUILD_STEPS.map((step, index) => (
          <div
            key={step.key}
            className={`build__backdrop build__backdrop--${step.key}`}
            style={{ opacity: index === 0 ? 1 : reveal[index] }}
            aria-hidden="true"
          />
        ))}

        <div className="container build__header">
          <p className="eyebrow">01 · Build</p>
          <h2 id="build-title" className="build__title">
            Built in four steps
          </h2>
        </div>

        <div className="build__car-area">
          <span className="build__watermark" aria-hidden="true">
            {BUILD_STEPS[current].title}
          </span>
          <div
            className="build__car"
            role="img"
            aria-label={`Porsche 911, ${BUILD_STEPS[current].title.toLowerCase()} stage`}
          >
            {BUILD_STEPS.map((step, index) => (
              <img
                key={step.key}
                src={step.image}
                alt=""
                className="build__layer"
                loading={index === 0 ? 'eager' : 'lazy'}
                style={{ clipPath: `inset(0 ${(1 - reveal[index]) * 100}% 0 0)` }}
              />
            ))}
            <Dimensions reveal={reveal[0]} fade={1 - reveal[1]} />
            {drawing >= 0 && (
              <span
                className="build__scanline"
                aria-hidden="true"
                style={{ left: `${reveal[drawing] * 100}%` }}
              />
            )}
          </div>
        </div>

        <div
          className="container build__stats"
          style={{ opacity: reveal[3], transform: `translateY(${(1 - reveal[3]) * 24}px)` }}
          aria-hidden={reveal[3] < 1}
        >
          <dl>
            {FINISH_STATS.map((stat) => (
              <div key={stat.label} className="build__stat">
                <dt>{stat.label}</dt>
                <dd>
                  {countUp(stat.value, reveal[3]).toFixed(stat.decimals)}
                  <span>{stat.unit}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="build__stats-source">911 Carrera (992.2) · manufacturer data</p>
        </div>

        <ol className="container build__steps">
          {BUILD_STEPS.map((step, index) => (
            <li
              key={step.key}
              className={`build__step${index === current ? ' is-active' : ''}${reveal[index] === 1 ? ' is-done' : ''}`}
              aria-current={index === current ? 'step' : undefined}
            >
              <span className="build__step-number">0{index + 1}</span>
              <span className="build__step-title">{step.title}</span>
              <span className="build__step-text">{step.text}</span>
              <span className="build__step-bar" aria-hidden="true">
                <span style={{ transform: `scaleX(${reveal[index]})` }} />
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Blueprint dimension lines (wheelbase and overall length) that draw
// themselves with the sketch and fade out when the clay arrives.
function Dimensions({ reveal, fade }) {
  const draw = (length, delay) => {
    const t = Math.min(1, Math.max(0, (reveal - delay) / (1 - delay)));
    return { strokeDasharray: length, strokeDashoffset: length * (1 - t) };
  };
  return (
    <svg className="build__dims" viewBox="0 0 1000 316" style={{ opacity: fade }} aria-hidden="true">
      <line x1="30" y1="300" x2="970" y2="300" style={draw(940, 0.1)} />
      <line x1="236" y1="190" x2="236" y2="312" style={draw(122, 0.3)} />
      <line x1="768" y1="190" x2="768" y2="312" style={draw(122, 0.3)} />
      <line x1="236" y1="305" x2="768" y2="305" style={draw(532, 0.45)} />
      <text x="502" y="296" textAnchor="middle" style={{ opacity: reveal > 0.8 ? 1 : 0 }}>
        WHEELBASE 2,450 mm
      </text>
      <line x1="30" y1="12" x2="970" y2="12" style={draw(940, 0.55)} />
      <text x="500" y="8" textAnchor="middle" style={{ opacity: reveal > 0.9 ? 1 : 0 }}>
        LENGTH 4,519 mm
      </text>
    </svg>
  );
}
