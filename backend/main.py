import os

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from db import get_session
from models import CarModel, Era, Paint
from schemas import CarModelOut, EraOut, PaintOut

app = FastAPI()

# Comma-separated list of origins allowed to call the API from a browser.
# In production the frontend and the API share one CloudFront domain, so no
# cross-origin requests happen there; locally, Vite runs on :5173 and the API
# on :8000, which is why localhost:5173 is the default.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/models", response_model=list[CarModelOut])
def list_models(session: Session = Depends(get_session)):
    stmt = (
        select(CarModel)
        .options(selectinload(CarModel.specs))
        .order_by(CarModel.sort_order)
    )
    return session.scalars(stmt).all()


@app.get("/api/models/{slug}", response_model=CarModelOut)
def get_model(slug: str, session: Session = Depends(get_session)):
    stmt = (
        select(CarModel)
        .options(selectinload(CarModel.specs))
        .where(CarModel.slug == slug)
    )
    model = session.scalars(stmt).first()
    if model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@app.get("/api/paints", response_model=list[PaintOut])
def list_paints(session: Session = Depends(get_session)):
    return session.scalars(select(Paint).order_by(Paint.sort_order)).all()


@app.get("/api/eras", response_model=list[EraOut])
def list_eras(session: Session = Depends(get_session)):
    return session.scalars(select(Era).order_by(Era.sort_order)).all()
