import { fitToBox } from '../lib/trip';

const WIDTH = 640;
const HEIGHT = 420;

/*
 * A lightweight route drawing in SVG (no map library): the road geometry
 * stored with the trip, the start, the destination and numbered charging
 * stops. A link below opens the same route on OpenStreetMap.
 */
export default function RouteMap({ trip }) {
  const origin = [trip.origin_lat, trip.origin_lon];
  const destination = [trip.destination_lat, trip.destination_lon];
  const project = fitToBox([...trip.route, origin, destination], WIDTH, HEIGHT, 36);
  const path = trip.route.map((point) => project(point).map((n) => n.toFixed(1)).join(',')).join(' ');
  const [ox, oy] = project(origin);
  const [dx, dy] = project(destination);

  return (
    <svg
      className="route-map"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Route from ${trip.origin_label} to ${trip.destination_label} with ${trip.stops.length} charging stops`}
    >
      <defs>
        <pattern id="route-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" className="route-map__grid" />
        </pattern>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="url(#route-grid)" />
      <polyline points={path} className="route-map__casing" />
      <polyline points={path} className="route-map__line" />

      {trip.stops.map((stop, index) => {
        const [x, y] = project([stop.lat, stop.lon]);
        return (
          <g key={index} className="route-map__stop">
            <circle cx={x} cy={y} r="11" />
            <text x={x} y={y} dy="0.35em" textAnchor="middle">
              {index + 1}
            </text>
          </g>
        );
      })}

      <EndPoint x={ox} y={oy} label={trip.origin_label} />
      <EndPoint x={dx} y={dy} label={trip.destination_label} destination />
    </svg>
  );
}

// Label to the right of the point, or to the left near the right edge.
function EndPoint({ x, y, label, destination = false }) {
  const flip = x > WIDTH * 0.7;
  return (
    <g className={`route-map__end${destination ? ' route-map__end--destination' : ''}`}>
      <circle cx={x} cy={y} r="7" />
      <text x={flip ? x - 12 : x + 12} y={y} dy="0.35em" textAnchor={flip ? 'end' : 'start'}>
        {label.split(',')[0]}
      </text>
    </g>
  );
}
