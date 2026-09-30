import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/context';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Dark map tiles from CARTO, drawn from OpenStreetMap data (free for light use
// with attribution). They match the dark design of the site.
const TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const ACCENT = '#c9895b';

/*
 * An interactive map (Leaflet) with the road route stored with the trip,
 * the start and destination, and numbered charging stops with details.
 * Leaflet works directly on the DOM, so React only gives it an empty <div>
 * and the map is created, updated and removed in an effect.
 */
export default function RouteMap({ trip }) {
  const { t } = useI18n();
  const containerRef = useRef(null);

  useEffect(() => {
    const map = L.map(containerRef.current, { scrollWheelZoom: false, attributionControl: true });
    L.tileLayer(TILES, { attribution: ATTRIBUTION, subdomains: 'abcd', maxZoom: 19 }).addTo(map);

    // Set the view first: Leaflet only draws layers once the map has one.
    // No animation, so removing the map right away never hits a half-done zoom.
    map.fitBounds(L.latLngBounds(trip.route), { padding: [32, 32], animate: false });

    // A dark casing under the line keeps it readable over roads and labels.
    L.polyline(trip.route, { color: '#0b0b0d', weight: 8, opacity: 0.6 }).addTo(map);
    L.polyline(trip.route, { color: ACCENT, weight: 4, opacity: 0.95 }).addTo(map);

    const endPoint = (lat, lon, label, fill) =>
      L.circleMarker([lat, lon], { radius: 7, color: '#0b0b0d', weight: 2, fillColor: fill, fillOpacity: 1 })
        .bindTooltip(label, { direction: 'top', offset: [0, -6] })
        .addTo(map);
    endPoint(trip.origin_lat, trip.origin_lon, `${t('trip.start')}: ${trip.origin_label}`, '#f3f1ee');
    endPoint(trip.destination_lat, trip.destination_lon, `${t('trip.destination')}: ${trip.destination_label}`, ACCENT);

    trip.stops.forEach((stop, index) => {
      const icon = L.divIcon({
        className: 'route-map__stop-icon',
        html: `<span>${index + 1}</span>`,
        iconSize: [26, 26],
      });
      L.marker([stop.lat, stop.lon], { icon, keyboard: true, title: t('trip.stopNumber', { n: index + 1 }) })
        .bindPopup(
          `<strong>${t('trip.stopNumber', { n: index + 1 })}</strong><br>km ${Math.round(stop.at_km)} · ` +
            `${Math.round(stop.arrive_soc)} % → ${Math.round(stop.depart_soc)} %<br>` +
            `${Math.round(stop.charge_minutes)} min`
        )
        .addTo(map);
    });

    return () => map.remove();
  }, [trip, t]);

  return (
    <div
      ref={containerRef}
      className="route-map"
      role="region"
      aria-label={t('trip.mapLabel', { from: trip.origin_label, to: trip.destination_label, count: trip.stops.length })}
    />
  );
}
