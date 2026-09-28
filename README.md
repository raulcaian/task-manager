# Porsche Showroom

[![CI](https://github.com/raulcaian/task-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/raulcaian/task-manager/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.14-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)

A full-stack showcase site for Porsche models: a **React** frontend with scroll-driven animations, backed by a **Python (FastAPI)** API and deployed on **AWS**.

> **Status: in progress.** The backend serves the showroom data (models, paints, timeline) from PostgreSQL. The frontend is still a minimal shell; the showroom sections are being built next.

*Unofficial portfolio project, not affiliated with Porsche AG.*

## Architecture

```
                 https://<distribution>.cloudfront.net
                                 │
                         ┌───────▼───────┐
      Browser  ────────► │  CloudFront   │  HTTPS, caching, routing
                         └───┬───────┬───┘
                   /api/*    │       │   everything else
                             ▼       ▼
                    ┌────────────┐ ┌────────────┐
                    │    EC2     │ │     S3     │
                    │  FastAPI   │ │ React build│
                    │  (Docker)  │ │  (static)  │
                    └────────────┘ └────────────┘
```

- The React app is built into static files and served from **S3**.
- The FastAPI backend runs in **Docker** on **EC2**.
- **CloudFront** sits in front of both: API routes go to EC2 with caching disabled, everything else goes to S3 with caching. Because the browser sees a single domain, no CORS is needed in production.
- The data lives in **PostgreSQL** (locally in Docker; planned on **RDS**).

## Tech stack

| Layer    | Technologies |
|----------|--------------|
| Frontend | React 19, Vite 8, JavaScript, CSS |
| Backend  | Python 3.14, FastAPI, Uvicorn, SQLAlchemy, Alembic |
| Database | PostgreSQL 17 |
| Testing  | pytest + httpx (backend), Vitest + React Testing Library (frontend), ESLint |
| DevOps   | Docker, GitHub Actions, AWS (S3, CloudFront, EC2) |

## Project structure

```
.
├── .github/workflows/ci.yml   # CI: tests, lint, build, Docker build
├── docker-compose.yml         # local PostgreSQL
├── backend/
│   ├── main.py                # FastAPI app and routes
│   ├── db.py                  # database connection and session
│   ├── models.py              # tables (SQLAlchemy)
│   ├── schemas.py             # API response shapes (Pydantic)
│   ├── migrations/            # Alembic migrations
│   ├── seed.py                # loads seed_data.json into the database
│   ├── seed_data.json         # models, paints and timeline content
│   ├── conftest.py            # test database setup
│   ├── test_main.py           # health and CORS tests
│   ├── test_api.py            # endpoint tests
│   ├── requirements.txt       # runtime dependencies
│   ├── requirements-dev.txt   # + test dependencies
│   ├── .env.example           # environment variables template
│   └── Dockerfile
└── frontend/
    ├── index.html
    └── src/
        ├── main.jsx           # React entry point
        ├── App.jsx            # root component
        ├── App.css
        └── App.test.jsx       # component tests (Vitest)
```

## Getting started

Requirements: Python 3.14, Node.js 22, Docker Desktop.

### Database

```bash
docker compose up -d        # PostgreSQL on localhost:5432
```

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt
alembic upgrade head        # create the tables
python seed.py              # load the showroom data
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Try `http://127.0.0.1:8000/api/health`, or the interactive docs at `/docs`.

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

### Environment variables

| Variable | Where | Default | Purpose |
|----------|-------|---------|---------|
| `DATABASE_URL` | backend | local Docker database | PostgreSQL connection string (SQLAlchemy format). |
| `ALLOWED_ORIGINS` | backend | `http://localhost:5173` | Comma-separated browser origins allowed to call the API (CORS). Not needed in production, where CloudFront serves everything from one domain. |
| `TEST_DATABASE_URL` | tests | local `showroom_test` database | Database the tests create, migrate and seed. |

See `backend/.env.example`.

## API

| Method | Endpoint              | Description |
|--------|-----------------------|-------------|
| GET    | `/api/health`         | Health check, returns `{"status": "ok"}` |
| GET    | `/api/models`         | All models with their specs, in display order |
| GET    | `/api/models/{slug}`  | One model, or 404 |
| GET    | `/api/paints`         | Paint colours for the configurator |
| GET    | `/api/eras`           | Timeline entries, from 1931 to today |

## Tests and checks

```bash
# backend (needs the Docker database running)
cd backend && pytest

# frontend
cd frontend
npm run lint
npm test
npm run build
```

Backend tests run against a separate `showroom_test` database that is created, migrated and seeded automatically. Every push to `main` and every pull request runs the same checks in GitHub Actions (with a PostgreSQL service container), plus a Docker build of the backend.

## Roadmap

- [x] PostgreSQL schema (models, specs, paints, timeline) with SQLAlchemy and Alembic migrations
- [x] `GET /api/models`, `/api/paints` and `/api/eras`
- [ ] Showroom sections: smoke intro, build-on-scroll, garage with configurator, timeline
- [ ] Continuous deployment to S3 / EC2 with CloudFront invalidation
