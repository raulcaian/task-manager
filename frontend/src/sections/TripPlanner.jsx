import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/context';
import BatteryChart from '../components/BatteryChart';
import PlaceInput from '../components/PlaceInput';
import RouteMap from '../components/RouteMap';
import { api, errorMessage } from '../lib/api';
import { formatDuration, formatKm, formatNumber, formatPercent } from '../lib/format';
import { osmDirectionsUrl } from '../lib/trip';
import { useApi } from '../hooks/useApi';
import './TripPlanner.css';

const loadEvModels = ({ signal }) => api.evModels({ signal });

export default function TripPlanner() {
  const { t, locale } = useI18n();
  const { data: evModels, error: modelsError } = useApi(loadEvModels);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [evModel, setEvModel] = useState('taycan');
  const [startSoc, setStartSoc] = useState(80);
  const [speed, setSpeed] = useState(120);
  const [temperature, setTemperature] = useState('');
  const [trip, setTrip] = useState(null);
  const [recent, setRecent] = useState([]);
  const [status, setStatus] = useState({ busy: false, error: null });

  // The trips other visitors planned, newest first (stored in PostgreSQL).
  useEffect(() => {
    const controller = new AbortController();
    api
      .trips(8, { signal: controller.signal })
      .then(setRecent)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!origin || !destination) {
      setStatus({ busy: false, error: t('trip.pickPlaces') });
      return;
    }
    setStatus({ busy: true, error: null });
    try {
      const planned = await api.planTrip({
        origin,
        destination,
        ev_model: evModel,
        start_soc: startSoc,
        cruise_speed_kmh: speed,
        temperature_c: temperature === '' ? null : Number(temperature),
      });
      setTrip(planned);
      setRecent((list) => [planned, ...list.filter((t) => t.id !== planned.id)].slice(0, 8));
      setStatus({ busy: false, error: null });
    } catch (err) {
      setStatus({ busy: false, error: errorMessage(err, t) });
    }
  };

  const openTrip = async (id) => {
    setStatus({ busy: true, error: null });
    try {
      setTrip(await api.trip(id));
      setStatus({ busy: false, error: null });
    } catch (err) {
      setStatus({ busy: false, error: errorMessage(err, t) });
    }
  };

  return (
    <section id="trip-planner" className="section trip-planner" aria-labelledby="trip-title">
      <div className="container">
        <header className="section-header">
          <p className="eyebrow">{t('trip.eyebrow')}</p>
          <h2 id="trip-title" className="section-title">
            {t('trip.title')}
          </h2>
          <p className="section-lead">{t('trip.lead')}</p>
        </header>

        <div className="trip-planner__layout">
          <form className="trip-form" onSubmit={submit} noValidate>
            <PlaceInput label={t('trip.from')} value={origin} onChange={setOrigin} placeholder={t('trip.fromPlaceholder')} />
            <PlaceInput label={t('trip.to')} value={destination} onChange={setDestination} placeholder={t('trip.toPlaceholder')} />

            <div className="field">
              <label className="field__label" htmlFor="trip-car">
                {t('trip.car')}
              </label>
              <select id="trip-car" className="input" value={evModel} onChange={(e) => setEvModel(e.target.value)}>
                {(evModels ?? [{ slug: 'taycan', name: 'Taycan' }]).map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.name}
                  </option>
                ))}
              </select>
              {modelsError && <span className="field__hint status--error">{errorMessage(modelsError, t)}</span>}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="trip-soc">
                {t('trip.battery')} <strong>{startSoc} %</strong>
              </label>
              <input id="trip-soc" type="range" min="15" max="100" step="5" value={startSoc} onChange={(e) => setStartSoc(Number(e.target.value))} />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="trip-speed">
                {t('trip.speed')} <strong>{speed} km/h</strong>
              </label>
              <input id="trip-speed" type="range" min="80" max="180" step="10" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="trip-temp">
                {t('trip.temperature')}
              </label>
              <input
                id="trip-temp"
                className="input"
                type="number"
                min="-30"
                max="50"
                placeholder={t('trip.temperaturePlaceholder')}
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
              <span className="field__hint">{t('trip.temperatureHint')}</span>
            </div>

            <button className="button" type="submit" disabled={status.busy}>
              {status.busy ? t('trip.planning') : t('trip.submit')}
            </button>
            <p className="status status--error" role="alert">
              {status.error}
            </p>
          </form>

          <div className="trip-result" aria-live="polite">
            {trip ? <TripResult trip={trip} /> : <p className="trip-result__empty">{t('trip.empty')}</p>}
          </div>
        </div>

        {recent.length > 0 && (
          <div className="recent-trips">
            <h3 className="recent-trips__title">{t('trip.recent')}</h3>
            <ul>
              {recent.map((r) => (
                <li key={r.id}>
                  <button type="button" className="recent-trip" onClick={() => openTrip(r.id)}>
                    <span className="recent-trip__route">
                      {r.origin_label.split(',')[0]} → {r.destination_label.split(',')[0]}
                    </span>
                    <span className="recent-trip__meta">
                      {r.ev_model.name} · {formatKm(r.distance_km, locale)} · {formatDuration(r.total_minutes)} ·{' '}
                      {r.stop_count} {r.stop_count === 1 ? t('trip.stop') : t('trip.stops')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function TripResult({ trip }) {
  const { t, locale } = useI18n();
  const stats = [
    [t('trip.distance'), formatKm(trip.distance_km, locale)],
    [t('trip.totalTime'), formatDuration(trip.total_minutes)],
    [t('trip.charging'), formatDuration(trip.charging_minutes)],
    [t('trip.consumption'), formatNumber(trip.consumption_kwh_per_100km, 1, locale), 'kWh/100 km'],
    [t('trip.energy'), formatNumber(trip.energy_kwh, 0, locale), 'kWh'],
    [t('trip.arrival'), formatPercent(trip.arrival_soc)],
  ];

  return (
    <article className="trip">
      <h3 className="trip__title">
        {trip.origin_label.split(',')[0]} → {trip.destination_label.split(',')[0]}
      </h3>
      <p className="trip__meta">
        {trip.ev_model.name} · {trip.cruise_speed_kmh} km/h · {Math.round(trip.temperature_c)} °C · ↑{' '}
        {Math.round(trip.ascent_m)} m
      </p>

      <dl className="trip__stats">
        {stats.map(([label, value, unit]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {value}
              {unit && <span className="trip__unit"> {unit}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <RouteMap trip={trip} />
      <a className="trip__osm" href={osmDirectionsUrl(trip)} target="_blank" rel="noreferrer">
        {t('trip.openMap')}
      </a>

      <BatteryChart trip={trip} />

      {trip.stops.length > 0 ? (
        <ol className="trip__stops">
          {trip.stops.map((stop, index) => (
            <li key={index}>
              <span className="trip__stop-number">{index + 1}</span>
              <span>
                {t('trip.chargeAt', {
                  km: Math.round(stop.at_km),
                  from: formatPercent(stop.arrive_soc),
                  to: formatPercent(stop.depart_soc),
                  time: formatDuration(stop.charge_minutes),
                })}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="status">{t('trip.noCharging')}</p>
      )}
    </article>
  );
}
