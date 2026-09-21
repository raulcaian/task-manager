# Task Manager — React + FastAPI

Aplicație full-stack simplă de gestionare a task-urilor, construită pentru a exersa integrarea unui frontend React cu un backend REST API scris în Python (FastAPI).

## Funcționalități

- Listarea task-urilor existente (GET)
- Adăugarea unui task nou, cu titlu și status (POST)
- Ștergerea unui task existent (DELETE)
- Validare automată a datelor pe backend (Pydantic)
- Documentație interactivă a API-ului, generată automat (Swagger UI, la `/docs`)
- Stări de loading și eroare pe frontend

## Tehnologii

**Backend:** Python, FastAPI, Uvicorn, Pydantic
**Frontend:** React, Vite, JavaScript (ES6+), CSS

## Structură

```
task-manager/
├── backend/         # API REST (FastAPI)
│   └── main.py
└── frontend/        # Interfață (React + Vite)
    └── src/
        ├── App.jsx
        └── App.css
```

## Cum se rulează local

### 1. Backend (API)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn
uvicorn main:app --reload
```

API-ul pornește pe `http://127.0.0.1:8000`. Documentația interactivă e disponibilă la `http://127.0.0.1:8000/docs`.

### 2. Frontend (React)

Într-un terminal separat:

```bash
cd frontend
npm install
npm run dev
```

Interfața pornește pe `http://localhost:5173`.

Ambele servere trebuie să ruleze simultan pentru ca aplicația să funcționeze complet.

## API — Endpoint-uri

| Metodă | Adresă             | Descriere                     |
|--------|---------------------|--------------------------------|
| GET    | `/tasks`             | Returnează lista de task-uri  |
| POST   | `/tasks`             | Creează un task nou           |
| DELETE | `/tasks/{task_id}`   | Șterge un task după id        |

## Testare

**Backend** (pytest) — verifică fiecare endpoint fără intervenție manuală:

```bash
cd backend
source venv/bin/activate
pip install pytest httpx
pytest
```

**Frontend** (Vitest + React Testing Library) — verifică randarea componentelor și interacțiunea cu API-ul (mock):

```bash
cd frontend
npm install
npm test
```

## Posibile îmbunătățiri viitoare

- Persistență reală a datelor (bază de date, ex. SQLite/PostgreSQL)
- Autentificare utilizatori
- Editarea unui task existent (PUT/PATCH)
- Containerizare cu Docker
