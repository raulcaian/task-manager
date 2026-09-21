# Task Manager

[![Python](https://img.shields.io/badge/Python-3.14-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tested with pytest](https://img.shields.io/badge/backend%20tests-pytest-0A9EDC)](https://docs.pytest.org/)
[![Tested with Vitest](https://img.shields.io/badge/frontend%20tests-vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

A full-stack task management app built to practice connecting a **React** frontend to a **Python (FastAPI)** REST API — with real request/response handling, error states, and automated tests on both sides.

## Overview

The backend exposes a small REST API for managing tasks (create, list, delete), with automatic request validation. The frontend consumes that API directly — no mock data — and reflects loading and error states the way a production app would.

## Features

- List, create, and delete tasks through a REST API
- Automatic request validation on the backend (Pydantic)
- Interactive, auto-generated API documentation (Swagger UI, at `/docs`)
- Loading and error states on the frontend, driven by real API responses
- Automated test suite for both backend and frontend

## Tech stack

| Layer    | Technologies                              |
|----------|--------------------------------------------|
| Backend  | Python, FastAPI, Uvicorn, Pydantic          |
| Frontend | React, Vite, JavaScript (ES6+), CSS         |
| Testing  | pytest + httpx (backend), Vitest + React Testing Library (frontend) |

## Project structure

```
task-manager/
├── backend/
│   ├── main.py         # FastAPI app: routes, model, in-memory store
│   └── test_main.py    # API tests (pytest)
└── frontend/
    └── src/
        ├── App.jsx      # Main component: fetch, state, UI
        ├── App.css      # Styling
        └── App.test.jsx # Component tests (Vitest)
```

## Getting started

### 1. Backend (API)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Interactive docs are available at `http://127.0.0.1:8000/docs`.

### 2. Frontend (React)

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

> Both servers need to be running at the same time for the app to work end to end.

## API reference

| Method | Endpoint            | Description                |
|--------|----------------------|------------------------------|
| GET    | `/tasks`              | List all tasks              |
| POST   | `/tasks`               | Create a new task           |
| DELETE | `/tasks/{task_id}`    | Delete a task by id          |

**Task model**

```json
{
  "id": 1,
  "title": "Buy milk",
  "status": "pending"
}
```

`status` defaults to `"pending"` if not provided.

## Testing

**Backend** (pytest) — exercises every endpoint through FastAPI's `TestClient`, with no manual steps:

```bash
cd backend
source venv/bin/activate
pip install pytest httpx
pytest
```

**Frontend** (Vitest + React Testing Library) — renders the component, mocks `fetch`, and simulates real user interaction (typing, clicking):

```bash
cd frontend
npm install
npm test
```

## Possible next steps

- Persistent storage (SQLite / PostgreSQL) instead of an in-memory list
- User authentication
- Editing an existing task (PUT/PATCH)
- Containerization with Docker
- CI pipeline running both test suites on every push

## License

This project was built for learning and portfolio purposes.
