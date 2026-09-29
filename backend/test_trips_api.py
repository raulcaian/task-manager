import pytest
from fastapi.testclient import TestClient

import main
from external import ExternalServiceError, Place, Route, get_route_service, get_weather_service
from rate_limit import geocode_limit, plan_trip_limit

client = TestClient(main.app)

BUCHAREST = {"label": "Bucharest, Romania", "lat": 44.4268, "lon": 26.1025}
CLUJ = {"label": "Cluj-Napoca, Romania", "lat": 46.7712, "lon": 23.6236}


class FakeRouteService:
    """A straight 'road' made of ~1 km steps, so no network is needed."""

    def __init__(self, distance_km: int = 450):
        self.distance_km = distance_km

    def geocode(self, query: str, limit: int = 5) -> list[Place]:
        return [Place(label=f"{query}, Romania", lat=46.77, lon=23.62)]

    def route(self, origin: Place, destination: Place) -> Route:
        steps = self.distance_km
        coordinates = [
            [origin.lon, origin.lat + i * 0.009, 100.0]  # 0.009° latitude ≈ 1 km
            for i in range(steps + 1)
        ]
        return Route(distance_m=steps * 1000, duration_s=steps * 1000 / 30, coordinates=coordinates)


class BrokenRouteService(FakeRouteService):
    def route(self, origin, destination):
        raise ExternalServiceError("Could not compute a road route")


class FakeWeatherService:
    def current_temperature_c(self, lat, lon):
        return 5.0


@pytest.fixture(autouse=True)
def fake_services():
    main.app.dependency_overrides[get_route_service] = lambda: FakeRouteService()
    main.app.dependency_overrides[get_weather_service] = lambda: FakeWeatherService()
    plan_trip_limit.reset()
    geocode_limit.reset()
    yield
    main.app.dependency_overrides.clear()


def trip_request(**overrides):
    body = {
        "origin": BUCHAREST,
        "destination": CLUJ,
        "ev_model": "taycan",
        "start_soc": 80,
        "cruise_speed_kmh": 130,
    }
    body.update(overrides)
    return body


def test_ev_models_are_listed():
    response = client.get("/api/ev-models")
    assert response.status_code == 200
    assert [m["slug"] for m in response.json()] == ["taycan", "taycan-4s", "macan-4-electric"]


def test_geocode_returns_places():
    response = client.get("/api/geocode", params={"q": "Cluj"})
    assert response.status_code == 200
    assert response.json()[0]["label"] == "Cluj, Romania"


def test_geocode_needs_at_least_two_characters():
    assert client.get("/api/geocode", params={"q": "C"}).status_code == 422


def test_plan_trip_calculates_and_saves_it():
    response = client.post("/api/trips", json=trip_request())
    assert response.status_code == 201
    trip = response.json()
    assert trip["distance_km"] == pytest.approx(450, rel=0.02)
    assert trip["temperature_c"] == 5.0  # taken from the weather service
    assert trip["stop_count"] == len(trip["stops"]) >= 1
    assert trip["arrival_soc"] >= 10
    assert trip["total_minutes"] >= trip["driving_minutes"]
    assert trip["route"][0] == [44.4268, 26.1025]

    saved = client.get(f"/api/trips/{trip['id']}")
    assert saved.status_code == 200
    assert saved.json()["stops"] == trip["stops"]

    listed = client.get("/api/trips").json()
    assert listed[0]["id"] == trip["id"]
    assert "route" not in listed[0]  # the list stays light, no map geometry


def test_given_temperature_overrides_the_weather():
    response = client.post("/api/trips", json=trip_request(temperature_c=25))
    assert response.json()["temperature_c"] == 25


def test_unknown_trip_returns_404():
    assert client.get("/api/trips/999999").status_code == 404


def test_unknown_ev_model_is_rejected():
    assert client.post("/api/trips", json=trip_request(ev_model="golf")).status_code == 422


def test_start_charge_must_be_realistic():
    assert client.post("/api/trips", json=trip_request(start_soc=5)).status_code == 422
    assert client.post("/api/trips", json=trip_request(start_soc=120)).status_code == 422


def test_route_service_failure_returns_503():
    main.app.dependency_overrides[get_route_service] = lambda: BrokenRouteService()
    response = client.post("/api/trips", json=trip_request())
    assert response.status_code == 503


def test_planning_is_rate_limited():
    codes = [client.post("/api/trips", json=trip_request()).status_code for _ in range(11)]
    assert codes[:10] == [201] * 10
    assert codes[10] == 429
