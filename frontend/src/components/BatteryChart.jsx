import { useState } from 'react';
import { socProfile } from '../lib/trip';
import { formatKm, formatPercent } from '../lib/format';

const WIDTH = 640;
const HEIGHT = 200;
const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

/*
 * Battery level along the route: one series, so no legend; the reserve line
 * (10 %) is labelled directly. Hovering a point shows its value, and a
 * visually hidden table gives the same data to screen readers.
 */
export default function BatteryChart({ trip }) {
  const [hover, setHover] = useState(null);
  const points = socProfile(trip);
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (km) => PAD.left + (km / Math.max(trip.distance_km, 1)) * innerW;
  const y = (soc) => PAD.top + (1 - soc / 100) * innerH;
  const line = points.map((p) => `${x(p.km).toFixed(1)},${y(p.soc).toFixed(1)}`).join(' ');

  return (
    <figure className="battery-chart">
      <figcaption className="battery-chart__title">Battery along the route</figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true" onMouseLeave={() => setHover(null)}>
        {[0, 50, 100].map((soc) => (
          <g key={soc}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(soc)} y2={y(soc)} className="battery-chart__grid" />
            <text x={PAD.left - 8} y={y(soc)} dy="0.35em" textAnchor="end" className="battery-chart__axis">
              {soc}%
            </text>
          </g>
        ))}
        <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(10)} y2={y(10)} className="battery-chart__reserve" />
        <text x={WIDTH - PAD.right} y={y(10) - 6} textAnchor="end" className="battery-chart__axis">
          10% reserve
        </text>
        <text x={PAD.left} y={HEIGHT - 6} className="battery-chart__axis">
          0 km
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end" className="battery-chart__axis">
          {formatKm(trip.distance_km)}
        </text>

        <polyline points={line} className="battery-chart__line" />
        {points.map((p, index) => (
          <g key={index} onMouseEnter={() => setHover(index)}>
            {/* Invisible, larger hit area so small points are easy to hover. */}
            <circle cx={x(p.km)} cy={y(p.soc)} r="14" fill="transparent" />
            <circle cx={x(p.km)} cy={y(p.soc)} r={hover === index ? 6 : 4} className="battery-chart__point" />
          </g>
        ))}
        {hover !== null && (
          <text
            x={Math.min(x(points[hover].km) + 10, WIDTH - 120)}
            y={Math.max(y(points[hover].soc) - 10, 14)}
            className="battery-chart__tooltip"
          >
            {formatKm(points[hover].km)} · {formatPercent(points[hover].soc)}
          </text>
        )}
      </svg>
      <table className="visually-hidden">
        <caption>Battery level along the route</caption>
        <thead>
          <tr>
            <th scope="col">Distance</th>
            <th scope="col">Battery</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, index) => (
            <tr key={index}>
              <td>{formatKm(p.km)}</td>
              <td>{formatPercent(p.soc)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
