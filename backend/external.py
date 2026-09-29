"""Clients for the external services used by the trip planner.

Photon turns place names into coordinates, OSRM computes the road route and
Open-Meteo adds the elevation and the current temperature. They are wrapped
behind small classes so tests can replace them with fakes.
"""

import logging
import os
from dataclasses import dataclass

import httpx

log = logging.getLogger(__name__)

# Free services that need no API key (fair-use limits; the API rate limits
# visitors so we stay well inside them):
# - Photon (komoot): place search built on OpenStreetMap
# - OSRM: road routing on OpenStreetMap
# - Open-Meteo: elevation along the route and the current temperature
PHOTON_URL = "https://photon.komoot.io/api/"
OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving/{coordinates}"
OPEN_METEO_ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
TIMEOUT = httpx.Timeout(15.0, connect=5.0)
# OpenStreetMap services ask every client to identify itself.
HEADERS = {"User-Agent": "porsche-showroom-portfolio (github.com/raulcaian/task-manager)"}
# Elevation is sampled every ~1 km (at most this many points) to keep the
# number of Open-Meteo calls small; 100 points per call is their maximum.
MAX_ELEVATION_POINTS = 600
ELEVATION_BATCH = 100


class ExternalServiceError(Exception):
    """An external API failed or is not configured."""


def _failure(message: str, exc: httpx.HTTPError) -> ExternalServiceError:
    """Log what the upstream API answered and add its status to the message,
    so a failure in production can be diagnosed from the response alone."""
    if isinstance(exc, httpx.HTTPStatusError):
        status = exc.response.status_code
        log.warning("%s: HTTP %s %s", message, status, exc.response.text[:300])
        return ExternalServiceError(f"{message} (upstream HTTP {status})")
    log.warning("%s: %s", message, exc.__class__.__name__)
    return ExternalServiceError(f"{message} ({exc.__class__.__name__})")


@dataclass(frozen=True)
class Place:
    label: str
    lat: float
    lon: float


@dataclass(frozen=True)
class Route:
    distance_m: float
    duration_s: float
    # [[lon, lat, elevation_m], ...]
    coordinates: list[list[float]]


def place_label(properties: dict) -> str:
    """'Stuttgart, Baden-Württemberg, Germany' from Photon's properties."""
    parts = [properties.get(key) for key in ("name", "city", "state", "country")]
    unique = []
    for part in parts:
        if part and part not in unique:
            unique.append(part)
    return ", ".join(unique)


def smooth(values: list[float], radius: int = 2) -> list[float]:
    """Centred moving average. Terrain data is noisy point to point, and
    summing that noise would overstate the climbing; near the ends the window
    shrinks symmetrically, so the start and end heights stay exact."""
    smoothed = []
    for i in range(len(values)):
        half = min(radius, i, len(values) - 1 - i)
        window = values[i - half:i + half + 1]
        smoothed.append(sum(window) / len(window))
    return smoothed


def sample_points(coordinates: list[list[float]], max_points: int) -> list[list[float]]:
    """Keep at most max_points evenly spaced points, always with both ends."""
    if len(coordinates) <= max_points:
        return coordinates
    step = (len(coordinates) - 1) / (max_points - 1)
    return [coordinates[round(i * step)] for i in range(max_points)]


class RouteService:
    def geocode(self, query: str, limit: int = 5) -> list[Place]:
        try:
            response = httpx.get(
                PHOTON_URL,
                params={"q": query, "limit": limit, "lang": "en"},
                headers=HEADERS,
                timeout=TIMEOUT,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise _failure("Could not search for places", exc) from exc

        places = []
        for feature in response.json().get("features", []):
            lon, lat = feature["geometry"]["coordinates"][:2]
            label = place_label(feature.get("properties", {}))
            # Photon can return the same place twice (e.g. two station nodes).
            if label and label not in {place.label for place in places}:
                places.append(Place(label=label, lat=lat, lon=lon))
        return places

    def route(self, origin: Place, destination: Place) -> Route:
        coordinates = f"{origin.lon},{origin.lat};{destination.lon},{destination.lat}"
        try:
            response = httpx.get(
                OSRM_ROUTE_URL.format(coordinates=coordinates),
                params={"overview": "full", "geometries": "geojson"},
                headers=HEADERS,
                timeout=TIMEOUT,
            )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPError as exc:
            raise _failure("Could not compute a road route", exc) from exc
        if data.get("code") != "Ok" or not data.get("routes"):
            raise ExternalServiceError("No road route was found between these places")

        best = data["routes"][0]
        points = sample_points(best["geometry"]["coordinates"], MAX_ELEVATION_POINTS)
        elevations = self.elevations(points)
        return Route(
            distance_m=best["distance"],
            duration_s=best["duration"],
            coordinates=[[lon, lat, ele] for (lon, lat), ele in zip(points, elevations)],
        )

    def elevations(self, points: list[list[float]]) -> list[float]:
        """Terrain height (m) for [lon, lat] points; flat (0) if unavailable,
        so a failing elevation service only makes the estimate less precise."""
        heights: list[float] = []
        try:
            for start in range(0, len(points), ELEVATION_BATCH):
                batch = points[start:start + ELEVATION_BATCH]
                response = httpx.get(
                    OPEN_METEO_ELEVATION_URL,
                    params={
                        "latitude": ",".join(f"{lat:.5f}" for _, lat in batch),
                        "longitude": ",".join(f"{lon:.5f}" for lon, _ in batch),
                    },
                    headers=HEADERS,
                    timeout=TIMEOUT,
                )
                response.raise_for_status()
                heights.extend(float(h) for h in response.json()["elevation"])
        except (httpx.HTTPError, KeyError, TypeError, ValueError):
            log.warning("Elevation unavailable, planning the route as flat", exc_info=True)
            return [0.0] * len(points)
        return smooth(heights)


class WeatherService:
    def current_temperature_c(self, lat: float, lon: float) -> float | None:
        """Current temperature, or None if the weather API is unavailable."""
        try:
            response = httpx.get(
                OPEN_METEO_URL,
                params={"latitude": lat, "longitude": lon, "current": "temperature_2m"},
                headers=HEADERS,
                timeout=TIMEOUT,
            )
            response.raise_for_status()
            return float(response.json()["current"]["temperature_2m"])
        except (httpx.HTTPError, KeyError, TypeError, ValueError):
            return None


def get_route_service() -> RouteService:
    return RouteService()


def get_weather_service() -> WeatherService:
    return WeatherService()
