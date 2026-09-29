"""Clients for the external services used by the trip planner.

OpenRouteService turns place names into coordinates and computes the road
route with elevation; Open-Meteo gives the current temperature. Both are
wrapped behind small classes so tests can replace them with fakes.
"""

import logging
import os
from dataclasses import dataclass

import httpx

log = logging.getLogger(__name__)

# api.openrouteservice.org was retired in August 2026; HeiGIT now serves
# openrouteservice (routing) and Pelias (place search) under api.heigit.org.
ORS_DIRECTIONS_URL = "https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson"
PELIAS_AUTOCOMPLETE_URL = "https://api.heigit.org/pelias/v1/autocomplete"
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
TIMEOUT = httpx.Timeout(15.0, connect=5.0)


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
    # [[lon, lat, elevation_m], ...] as returned by OpenRouteService
    coordinates: list[list[float]]


class RouteService:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key if api_key is not None else os.getenv("ORS_API_KEY", "")

    def _headers(self) -> dict[str, str]:
        if not self.api_key:
            raise ExternalServiceError("Route service is not configured")
        return {"Authorization": self.api_key}

    def geocode(self, query: str, limit: int = 5) -> list[Place]:
        try:
            response = httpx.get(
                PELIAS_AUTOCOMPLETE_URL,
                params={"text": query, "size": limit},
                headers=self._headers(),
                timeout=TIMEOUT,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise _failure("Could not search for places", exc) from exc

        places = []
        for feature in response.json().get("features", []):
            lon, lat = feature["geometry"]["coordinates"][:2]
            places.append(Place(label=feature["properties"]["label"], lat=lat, lon=lon))
        return places

    def route(self, origin: Place, destination: Place) -> Route:
        try:
            response = httpx.post(
                ORS_DIRECTIONS_URL,
                json={
                    "coordinates": [[origin.lon, origin.lat], [destination.lon, destination.lat]],
                    "elevation": True,
                },
                headers=self._headers(),
                timeout=TIMEOUT,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise _failure("Could not compute a road route", exc) from exc

        feature = response.json()["features"][0]
        summary = feature["properties"]["summary"]
        return Route(
            distance_m=summary["distance"],
            duration_s=summary["duration"],
            coordinates=feature["geometry"]["coordinates"],
        )


class WeatherService:
    def current_temperature_c(self, lat: float, lon: float) -> float | None:
        """Current temperature, or None if the weather API is unavailable."""
        try:
            response = httpx.get(
                OPEN_METEO_URL,
                params={"latitude": lat, "longitude": lon, "current": "temperature_2m"},
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
