import { useEffect, useState } from 'react';
import BatteryChart from '../components/BatteryChart';
import PlaceInput from '../components/PlaceInput';
import RouteMap from '../components/RouteMap';
import { api } from '../lib/api';
import { formatDuration, formatKm, formatPercent } from '../lib/format';
import { osmDirectionsUrl } from '../lib/trip';
import { useApi } from '../hooks/useApi';
import './TripPlanner.css';

const loadEvModels = ({ signal }) => api.evModels({ signal });

export default function TripPlanner() {
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
      setStatus({ busy: false, error: 'Choose a start and a destination from the suggestions.' });
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
      setStatus({ busy: false, error: err.message });
    }
  };

  const openTrip = async (id) => {
    setStatus({ busy: true, error: null });
    try {
      setTrip(await api.trip(id));
      setStatus({ busy: false, error: null });
    } catch (err) {
      setStatus({ busy: false, error: err.message });
    }
  };

  return (
    <section id="trip-planner" className="section trip-planner" aria-labelledby="trip-title">
      <div className="container">
        <header className="section-header">
          <p className="eyebrow">04 · EV Trip Planner</p>
          <h2 id="trip-title" className="section-title">
            Plan an electric road trip
          </h2>
          <p className="section-lead">
            The backend fetches the real road and its elevation, models the car&apos;s energy
            use (speed, climbs, temperature, charging curve) and plans the charging stops.
            Every trip is saved.
          </p>
        </header>

        <div className="trip-planner__layout">
          <form className="trip-form" onSubmit={submit} noValidate>
            <PlaceInput label="From" value={origin} onChange={setOrigin} placeholder="e.g. Stuttgart" />
            <PlaceInput label="To" value={destination} onChange={setDestination} placeholder="e.g. Munich" />

            <div className="field">
              <label className="field__label" htmlFor="trip-car">
                Car
              </label>
              <select id="trip-car" className="input" value={evModel} onChange={(e) => setEvModel(e.target.value)}>
                {(evModels ?? [{ slug: 'taycan', name: 'Taycan' }]).map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.name}
                  </option>
                ))}
              </select>
              {modelsError && <span className="field__hint status--error">{modelsError.message}</span>}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="trip-soc">
                Battery at departure: <strong>{startSoc} %</strong>
              </label>
              <input id="trip-soc" type="range" min="15" max="100" step="5" value={startSoc} onChange={(e) => setStartSoc(Number(e.target.value))} />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="trip-speed">
                Motorway speed: <strong>{speed} km/h</strong>
              </label>
              <input id="trip-speed" type="range" min="80" max="180" step="10" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="trip-temp">
                Outside temperature (°C)
              </label>
              <input
                id="trip-temp"
                className="input"
                type="number"
                min="-30"
                max="50"
                placeholder="Current weather"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
              <span className="field__hint">Leave empty to use the current weather at the start.</span>
            </div>

            <button className="button" type="submit" disabled={status.busy}>
              {status.busy ? 'Planning…' : 'Plan the trip'}
            </button>
            <p className="status status--error" role="alert">
              {status.error}
            </p>
          </form>

          <div className="trip-result" aria-live="polite">
            {trip ? <TripResult trip={trip} /> : <p className="trip-result__empty">Your route will appear here.</p>}
          </div>
        </div>

        {recent.length > 0 && (
          <div className="recent-trips">
            <h3 className="recent-trips__title">Recently planned</h3>
            <ul>
              {recent.map((t) => (
                <li key={t.id}>
                  <button type="button" className="recent-trip" onClick={() => openTrip(t.id)}>
                    <span className="recent-trip__route">
                      {t.origin_label.split(',')[0]} → {t.destination_label.split(',')[0]}
                    </span>
                    <span className="recent-trip__meta">
                      {t.ev_model.name} · {formatKm(t.distance_km)} · {formatDuration(t.total_minutes)} ·{' '}
                      {t.stop_count} {t.stop_count === 1 ? 'stop' : 'stops'}
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
  const stats = [
    ['Distance', formatKm(trip.distance_km)],
    ['Total time', formatDuration(trip.total_minutes)],
    ['Charging', formatDuration(trip.charging_minutes)],
    ['Consumption', `${trip.consumption_kwh_per_100km.toFixed(1)} kWh/100 km`],
    ['Energy', `${trip.energy_kwh.toFixed(0)} kWh`],
    ['Arrival battery', formatPercent(trip.arrival_soc)],
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
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <RouteMap trip={trip} />
      <a className="trip__osm" href={osmDirectionsUrl(trip)} target="_blank" rel="noreferrer">
        Open the route on OpenStreetMap
      </a>

      <BatteryChart trip={trip} />

      {trip.stops.length > 0 ? (
        <ol className="trip__stops">
          {trip.stops.map((stop, index) => (
            <li key={index}>
              <span className="trip__stop-number">{index + 1}</span>
              <span>
                Charge at km {Math.round(stop.at_km)}: {formatPercent(stop.arrive_soc)} →{' '}
                {formatPercent(stop.depart_soc)} in {formatDuration(stop.charge_minutes)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="status">No charging needed on the way.</p>
      )}
    </article>
  );
}
