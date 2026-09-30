import { useCallback, useEffect, useRef, useState } from 'react';
import EraBackdrop from '../components/EraBackdrop';
import { useI18n } from '../i18n/context';
import { api, errorMessage } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { FACES_LEFT, roadPosition } from './timelineRoad';
import './Timeline.css';


export default function Timeline() {
  const { t, lang } = useI18n();
  const loadEras = useCallback(({ signal }) => api.eras({ signal, lang }), [lang]);
  const { data: eras, error, loading } = useApi(loadEras);

  return (
    <section id="timeline" className="timeline" aria-labelledby="timeline-title">
      {(loading || error) && (
        <div className="container timeline__status">
          <p className="eyebrow">{t('timeline.eyebrow')}</p>
          <h2 id="timeline-title" className="section-title">
            {t('timeline.title')}
          </h2>
          {loading && <p className="status">{t('timeline.loading')}</p>}
          {error && (
            <p className="status status--error" role="alert">
              {t('timeline.error', { message: errorMessage(error, t) })}
            </p>
          )}
        </div>
      )}
      {eras && <Road eras={eras} />}
    </section>
  );
}

/*
 * History on the road: a tall section with a sticky stage. Scrolling moves
 * the eras sideways like a road trip, the lane markings slide under the car,
 * and the car on the road changes to the model of each era.
 */
function Road({ eras }) {
  const { t } = useI18n();
  // The API keeps "Today" as a stable key (it also picks the scenery); show it translated.
  const yearLabel = (era) => (era.year_label === 'Today' ? t('timeline.today') : era.year_label);
  const sectionRef = useRef(null);
  const progress = useScrollProgress(sectionRef);
  const { index, position } = roadPosition(progress, eras.length);
  const era = eras[index];

  // Swap the car with a short fade when the era changes: the old car fades
  // out while `swapping` is true, then the new one is shown.
  const [shownIndex, setShownIndex] = useState(index);
  const swapping = index !== shownIndex;
  useEffect(() => {
    if (!swapping) return undefined;
    const timer = setTimeout(() => setShownIndex(index), 220);
    return () => clearTimeout(timer);
  }, [index, swapping]);
  const shown = eras[shownIndex];

  const jumpTo = (i) => {
    const section = sectionRef.current;
    const scrollable = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: section.offsetTop + (scrollable * i) / (eras.length - 1), behavior: 'smooth' });
  };

  return (
    <div ref={sectionRef} className="road-section" style={{ height: `${eras.length * 100}vh` }}>
      <div className="road-stage" style={{ backgroundColor: era.bg_color }}>
        <div
          className="road-backdrops"
          style={{ transform: `translateX(${(index - position) * 60}px)` }}
        >
          {eras.map((e, i) => (
            <EraBackdrop key={e.id} era={e} visible={i === index} />
          ))}
        </div>
        <div className="road-shade" aria-hidden="true" />
        <div className="road-stage__header container">
          <p className="eyebrow">{t('timeline.eyebrow')}</p>
          <h2 id="timeline-title" className="road-stage__title">
            {t('timeline.title')}
          </h2>
        </div>

        <nav className="road-nav" aria-label={t('timeline.years')}>
          {eras.map((e, i) => (
            <button
              key={e.id}
              type="button"
              className={i === index ? 'is-active' : ''}
              aria-current={i === index ? 'step' : undefined}
              onClick={() => jumpTo(i)}
            >
              {yearLabel(e)}
            </button>
          ))}
        </nav>

        <ol className="road-track" style={{ transform: `translateX(${-position * 100}vw)` }}>
          {eras.map((e, i) => (
            <li key={e.id} className="road-era" aria-hidden={i !== index}>
              <span className="road-era__year" style={{ color: e.accent_color }} aria-hidden="true">
                {yearLabel(e)}
              </span>
              <p className="road-era__label" style={{ color: e.accent_color }}>
                {yearLabel(e)}
              </p>
              <h3 className="road-era__title">{e.title}</h3>
              <p className="road-era__text">{e.description}</p>
            </li>
          ))}
        </ol>

        <div className="road" aria-hidden="true">
          <span className="road__edge" />
          <span className="road__dash" style={{ backgroundPositionX: `${-position * 1.6 * 100}vw` }} />
        </div>

        <figure className={`road-car${swapping ? ' is-swapping' : ''}`}>
          <img
            src={shown.photo_url}
            alt={shown.photo_caption || shown.title}
            className={FACES_LEFT.has(shown.year_label) ? 'is-mirrored' : ''}
          />
          {shown.photo_caption && <figcaption>{shown.photo_caption}</figcaption>}
        </figure>
      </div>
    </div>
  );
}
