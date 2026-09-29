import { useRef } from 'react';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { activeStep, BUILD_STEPS, layerReveal } from './buildSteps';
import './BuildSequence.css';

/*
 * A tall section with a sticky "stage". While you scroll through the section
 * the stage stays in view and each layer (sketch -> clay -> paint -> finish)
 * wipes in from left to right, like a scanner passing over the car.
 */
export default function BuildSequence() {
  const sectionRef = useRef(null);
  const progress = useScrollProgress(sectionRef);
  const reveal = layerReveal(progress);
  const current = activeStep(progress);

  return (
    <section id="build" ref={sectionRef} className="build" aria-labelledby="build-title">
      <div className="build__stage">
        <div className="container build__header">
          <p className="eyebrow">01 · Build</p>
          <h2 id="build-title" className="build__title">
            Built in four steps
          </h2>
        </div>

        <div className="build__car" role="img" aria-label={`Porsche 911, ${BUILD_STEPS[current].title.toLowerCase()} stage`}>
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
          {reveal.map((value, index) =>
            index > 0 && value > 0 && value < 1 ? (
              <span
                key={index}
                className="build__scanline"
                aria-hidden="true"
                style={{ left: `${value * 100}%` }}
              />
            ) : null
          )}
        </div>

        <ol className="container build__steps">
          {BUILD_STEPS.map((step, index) => (
            <li
              key={step.key}
              className={`build__step${index === current ? ' is-active' : ''}`}
              aria-current={index === current ? 'step' : undefined}
            >
              <span className="build__step-number">0{index + 1}</span>
              <span className="build__step-title">{step.title}</span>
              <span className="build__step-text">{step.text}</span>
            </li>
          ))}
        </ol>

        <div className="build__progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
    </section>
  );
}
