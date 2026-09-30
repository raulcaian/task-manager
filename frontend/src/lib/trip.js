/*
 * Pure helpers for showing a planned trip (easy to unit test).
 */

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
