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
- The data lives in **PostgreSQL** (locally in Docker, in production on **RDS**, reachable only from the EC2 server).

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
│   ├── schemas.py             # API request/response shapes (Pydantic)
│   ├── trips.py               # trip planner routes
│   ├── trip_planner.py        # route + weather + physics -> saved trip
│   ├── ev_physics.py          # energy and charging model (pure functions)
│   ├── external.py            # OpenRouteService and Open-Meteo clients
│   ├── rate_limit.py          # per-visitor limit on trip planning
│   ├── migrations/            # Alembic migrations
│   ├── seed.py                # loads seed_data.json into the database
│   ├── seed_data.json         # models, paints and timeline content
│   ├── conftest.py            # test database setup
│   ├── test_main.py           # health and CORS tests
│   ├── test_api.py            # showroom endpoint tests
│   ├── test_ev_physics.py     # physics and charging tests
│   ├── test_trips_api.py      # trip planner tests (external APIs faked)
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
| `ORS_API_KEY` | backend | empty | OpenRouteService key for place search and routes. Without it the trip planner answers 503. |
| `TURNSTILE_SECRET_KEY` | backend | empty | Cloudflare Turnstile secret for the contact form. Empty = captcha check skipped. |
| `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` | backend | empty | Verified Amazon SES addresses. Empty = messages are only stored. |
| `VITE_TURNSTILE_SITE_KEY` | frontend (build) | empty | Public Turnstile site key; in CI it comes from the `TURNSTILE_SITE_KEY` repository variable. |
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
| GET    | `/api/ev-models`      | Electric models available in the trip planner |
| GET    | `/api/geocode?q=Cluj` | Place suggestions for the trip planner search box |
| POST   | `/api/trips`          | Plan an EV trip (route, consumption, charging stops) and save it |
| GET    | `/api/trips`          | Latest saved trips |
| GET    | `/api/trips/{id}`     | One saved trip with its stops and route |
| GET    | `/api/options`        | Configurator options with their rules (models, requires, excludes) |
| POST   | `/api/quote`          | Validate a configuration and price it, or list every broken rule (422) |
| POST   | `/api/contact`        | Contact form: captcha check, store in PostgreSQL, email through SES |

### Configurator

Prices and rules are data in PostgreSQL (`config_options`), and `backend/configurator.py` interprets them as pure functions:

- an option can be limited to some models (`available_for`), can **require** other options and can **exclude** others;
- exactly one wheel choice is required;
- `POST /api/quote` returns the line items, the total and the VAT it contains, or a 422 that lists every broken rule at once (e.g. *"Ceramic composite brakes requires 21-inch sport wheels."*).

The browser uses the same rules only to be friendly (hiding options a model can't have); the backend is the source of truth. Prices are illustrative.

### Contact form

`POST /api/contact` checks a hidden honeypot field and a **Cloudflare Turnstile** token, stores the message in PostgreSQL and then emails it through **Amazon SES** using the EC2 instance role (no keys). The message is saved before the email is sent, so an email failure never loses it. It is rate limited to 5 messages per hour per visitor.

### EV trip planner

`POST /api/trips` takes an origin, a destination (picked through `/api/geocode`), an EV model, the battery level at departure and a cruise speed, then:

1. gets the real road route with elevation from **OpenRouteService** and the current temperature from **Open-Meteo** (unless one is given);
2. splits the route into small segments and estimates the energy for each one from physics: aerodynamic drag (grows with speed²), rolling resistance, climbing and regenerative braking, cabin heating/cooling and a cold-battery penalty (`backend/ev_physics.py`);
3. drives the route virtually, and before the battery would fall under a 10% reserve inserts a charging stop that follows the car's charging curve: up to 80% while more stops are needed, only what the rest of the trip needs at the last one;
4. saves the trip and its stops in PostgreSQL so they can be listed and reopened.

All figures are engineering estimates, not official Porsche data. Planning is rate limited per visitor to protect the free routing quota; the OpenRouteService key lives in SSM Parameter Store (`/showroom/ors-api-key`), never in the browser.

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

## Deployment

Every merge into `main` that passes all checks is deployed automatically by the `deploy-backend` and `deploy-frontend` jobs in `.github/workflows/ci.yml`:

1. GitHub Actions gets **short-lived AWS credentials through OIDC**; the IAM role only trusts this repository's `main` branch and only allows what the deploy needs.
2. **Backend:** the Docker image is built, tagged with the commit SHA and pushed to **ECR**. The workflow then sends `deploy/remote-deploy.sh` to the EC2 server through **SSM Run Command** (no SSH, no open ports). On the server the script reads `DATABASE_URL` from **SSM Parameter Store** (SecureString), runs the Alembic migrations and the seed against **RDS PostgreSQL**, restarts the container with `--restart unless-stopped` and waits for `/api/health`.
3. **Frontend:** `npm run build` output is synced to **S3** (hashed assets cached for a year, `index.html` always revalidated) and the **CloudFront** cache is invalidated.

## Roadmap

- [x] PostgreSQL schema (models, specs, paints, timeline) with SQLAlchemy and Alembic migrations
- [x] `GET /api/models`, `/api/paints` and `/api/eras`
- [x] EV trip planner API
- [x] Trip planner page (place search, route drawing, battery chart, saved trips)
- [x] Showroom sections: video intro, build-on-scroll, garage with configurator, timeline
- [x] Configurator prices and rules (`/api/options`, `/api/quote`)
- [x] Contact form with Turnstile and SES
- [x] Continuous deployment to S3 / EC2 with CloudFront invalidation
- [ ] Animated logo
- [ ] Final design polish (colours, spacing, mobile details)

## Media

The car photos were cut out and optimised to WebP for this project; the four build steps (sketch, clay, paint, finish) were generated from the 911 photo with OpenCV. The intro video is AI-generated. All car names and photos belong to their respective owners; this is a non-commercial portfolio project, not affiliated with Porsche AG.
