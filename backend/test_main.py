from fastapi.testclient import TestClient
import main

client = TestClient(main.app)


def setup_function():
    """Resetează lista de task-uri înainte de fiecare test,
    ca testele să nu se influențeze reciproc (izolare)."""
    main.tasks.clear()


def test_list_tasks_empty():
    response = client.get("/tasks")
    assert response.status_code == 200
    assert response.json() == []


def test_create_task():
    response = client.post(
        "/tasks", json={"id": 1, "title": "Task de test", "status": "pending"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["title"] == "Task de test"
    assert data["status"] == "pending"


def test_create_task_default_status():
    response = client.post("/tasks", json={"id": 2, "title": "Fără status specificat"})
    assert response.status_code == 200
    assert response.json()["status"] == "pending"


def test_list_tasks_after_create():
    client.post("/tasks", json={"id": 1, "title": "A"})
    client.post("/tasks", json={"id": 2, "title": "B"})
    response = client.get("/tasks")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_delete_task():
    client.post("/tasks", json={"id": 1, "title": "De șters"})
    response = client.delete("/tasks/1")
    assert response.status_code == 200
    assert response.json() == {"deleted": 1}

    response = client.get("/tasks")
    assert response.json() == []


def test_delete_nonexistent_task():
    response = client.delete("/tasks/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"
