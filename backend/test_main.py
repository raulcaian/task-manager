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
