import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import './Timeline.css';

const loadEras = ({ signal }) => api.eras({ signal });

export default function Timeline() {
  const { data: eras, error, loading } = useApi(loadEras);

  return (
    <section id="timeline" className="section timeline" aria-labelledby="timeline-title">
      <div className="container">
        <header className="section-header">
          <p className="eyebrow">03 · Heritage</p>
          <h2 id="timeline-title" className="section-title">
            Nine decades of engineering
          </h2>
          <p className="section-lead">
            From a design office in Stuttgart to the software-defined car. The eras are
            stored in PostgreSQL and served by the API.
          </p>
        </header>

        {loading && <p className="status">Loading the timeline…</p>}
        {error && (
          <p className="status status--error" role="alert">
            The timeline could not be loaded: {error.message}
          </p>
        )}

        {eras && (
          <ol className="timeline__list">
            {eras.map((era) => (
              <li
                key={era.id}
                className="era"
                style={{ '--era-accent': era.accent_color, '--era-bg': era.bg_color }}
              >
                <div className="era__text">
                  <p className="era__year">{era.year_label}</p>
                  <h3 className="era__title">{era.title}</h3>
                  <p className="era__description">{era.description}</p>
                </div>
                <figure className="era__figure">
                  <img src={era.photo_url} alt={era.photo_caption || era.title} loading="lazy" />
                  {era.photo_caption && <figcaption>{era.photo_caption}</figcaption>}
                </figure>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
