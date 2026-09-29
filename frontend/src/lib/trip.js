/*
 * Pure helpers for drawing a planned trip (easy to unit test).
 */

const toRad = (deg) => (deg * Math.PI) / 180;

/** Web Mercator: the projection web maps use. Returns unitless x, y (y grows down). */
export function mercator([lat, lon]) {
  return [toRad(lon), -Math.log(Math.tan(Math.PI / 4 + toRad(lat) / 2))];
}

/**
 * Project [lat, lon] points into a width x height box with padding,
 * keeping the aspect ratio, so the whole route fits and is centred.
 */
export function fitToBox(points, width, height, padding = 24) {
  if (points.length === 0) return () => [width / 2, height / 2];
  const projected = points.map(mercator);
  const xs = projected.map((p) => p[0]);
  const ys = projected.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1e-9);
  const spanY = Math.max(maxY - minY, 1e-9);
  const scale = Math.min((width - 2 * padding) / spanX, (height - 2 * padding) / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;
  return (point) => {
    const [x, y] = mercator(point);
    return [offsetX + (x - minX) * scale, offsetY + (y - minY) * scale];
  };
}

/** Battery level along the route: [{ km, soc }], including charging jumps. */
export function socProfile(trip) {
  const points = [{ km: 0, soc: trip.start_soc }];
  for (const stop of trip.stops) {
    points.push({ km: stop.at_km, soc: stop.arrive_soc });
    points.push({ km: stop.at_km, soc: stop.depart_soc });
  }
  points.push({ km: trip.distance_km, soc: trip.arrival_soc });
  return points;
}

export const osmDirectionsUrl = (trip) =>
  `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${trip.origin_lat}%2C${trip.origin_lon}%3B${trip.destination_lat}%2C${trip.destination_lon}`;
