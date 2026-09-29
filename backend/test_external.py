import httpx
import pytest

import external
from external import ExternalServiceError, Place, RouteService, _failure, place_label, sample_points


def test_failure_message_includes_upstream_status():
    request = httpx.Request("GET", "https://example.com")
    response = httpx.Response(403, request=request, text="Access denied")
    error = httpx.HTTPStatusError("forbidden", request=request, response=response)

    assert str(_failure("Could not search for places", error)) == (
        "Could not search for places (upstream HTTP 403)"
    )


def test_failure_message_names_network_errors():
    error = httpx.ConnectTimeout("timed out")
    assert str(_failure("Could not compute a road route", error)) == (
        "Could not compute a road route (ConnectTimeout)"
    )


# --- Clients, with httpx.get replaced so no network is used ----------------


class FakeResponse:
    def __init__(self, data, status=200):
        self.data = data
        self.status_code = status

    def raise_for_status(self):
        if self.status_code >= 400:
            request = httpx.Request("GET", "https://example.com")
            raise httpx.HTTPStatusError("error", request=request, response=httpx.Response(self.status_code, request=request))

    def json(self):
        return self.data


def test_place_label_skips_repeated_parts():
    assert place_label({"name": "Stuttgart", "city": "Stuttgart", "state": "BW", "country": "Germany"}) == (
        "Stuttgart, BW, Germany"
    )


def test_sample_points_keeps_both_ends():
    points = [[i, i] for i in range(1001)]
    sampled = sample_points(points, 11)
    assert len(sampled) == 11
    assert sampled[0] == [0, 0] and sampled[-1] == [1000, 1000]
    assert sample_points(points[:5], 11) == points[:5]


def test_geocode_reads_photon_features(monkeypatch):
    data = {"features": [{"geometry": {"coordinates": [9.18, 48.78]}, "properties": {"name": "Stuttgart", "country": "Germany"}}]}
    monkeypatch.setattr(external.httpx, "get", lambda *a, **k: FakeResponse(data))
    assert RouteService().geocode("Stutt") == [Place("Stuttgart, Germany", 48.78, 9.18)]


def test_route_combines_osrm_and_elevation(monkeypatch):
    def fake_get(url, params=None, **kwargs):
        if "elevation" in url:
            count = len(params["latitude"].split(","))
            return FakeResponse({"elevation": [100.0 + i for i in range(count)]})
        return FakeResponse({
            "code": "Ok",
            "routes": [{"distance": 2000.0, "duration": 100.0,
                        "geometry": {"coordinates": [[9.0, 48.0], [9.01, 48.0], [9.02, 48.0]]}}],
        })

    monkeypatch.setattr(external.httpx, "get", fake_get)
    route = RouteService().route(Place("A", 48.0, 9.0), Place("B", 48.0, 9.02))
    assert route.distance_m == 2000.0
    assert route.coordinates == [[9.0, 48.0, 100.0], [9.01, 48.0, 101.0], [9.02, 48.0, 102.0]]


def test_route_is_flat_when_elevation_fails(monkeypatch):
    def fake_get(url, params=None, **kwargs):
        if "elevation" in url:
            return FakeResponse({}, status=503)
        return FakeResponse({"code": "Ok", "routes": [{"distance": 1.0, "duration": 1.0,
                             "geometry": {"coordinates": [[9.0, 48.0], [9.1, 48.0]]}}]})

    monkeypatch.setattr(external.httpx, "get", fake_get)
    route = RouteService().route(Place("A", 48.0, 9.0), Place("B", 48.0, 9.1))
    assert [point[2] for point in route.coordinates] == [0.0, 0.0]


def test_no_route_found(monkeypatch):
    monkeypatch.setattr(external.httpx, "get", lambda *a, **k: FakeResponse({"code": "NoRoute", "routes": []}))
    with pytest.raises(ExternalServiceError, match="No road route"):
        RouteService().route(Place("A", 48.0, 9.0), Place("B", 40.0, -70.0))


def test_smooth_keeps_ends_and_straight_slopes():
    assert external.smooth([100.0, 101.0, 102.0, 103.0]) == [100.0, 101.0, 102.0, 103.0]
    # a single noisy spike is spread out, so the total climb gets smaller
    noisy = external.smooth([0.0, 0.0, 50.0, 0.0, 0.0])
    assert max(noisy) < 50.0 and noisy[0] == 0.0 and noisy[-1] == 0.0


def test_geocode_drops_duplicate_labels(monkeypatch):
    feature = {"geometry": {"coordinates": [9.18, 48.78]}, "properties": {"name": "Main Station", "country": "Germany"}}
    monkeypatch.setattr(external.httpx, "get", lambda *a, **k: FakeResponse({"features": [feature, feature]}))
    assert len(RouteService().geocode("station")) == 1
