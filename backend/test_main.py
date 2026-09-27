from fastapi.testclient import TestClient
import main

client = TestClient(main.app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_old_tasks_route_is_gone():
    response = client.get("/tasks")
    assert response.status_code == 404


def test_cors_allows_local_frontend():
    response = client.get(
        "/api/health", headers={"Origin": "http://localhost:5173"}
    )
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_cors_rejects_unknown_origin():
    response = client.get(
        "/api/health", headers={"Origin": "https://example.com"}
    )
    assert "access-control-allow-origin" not in response.headers
