import os

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from db import get_session
from i18n import get_language, translated
from models import CarModel, Era, Paint
from schemas import CarModelOut, EraOut, PaintOut, SpecOut
from configurator_api import router as configurator_router
from contact import router as contact_router
from trips import router as trips_router

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

app.include_router(trips_router)
app.include_router(configurator_router)
app.include_router(contact_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


def localized_model(model: CarModel, lang: str) -> CarModelOut:
    out = CarModelOut.model_validate(model)
    out.tagline = translated(model, "tagline", lang)
    specs = ((model.i18n or {}).get(lang) or {}).get("specs")
    if specs:
        out.specs = [SpecOut(label=label, value=value) for label, value in specs]
    return out


@app.get("/api/models", response_model=list[CarModelOut])
def list_models(session: Session = Depends(get_session), lang: str = Depends(get_language)):
    stmt = (
        select(CarModel)
        .options(selectinload(CarModel.specs))
        .order_by(CarModel.sort_order)
    )
    return [localized_model(model, lang) for model in session.scalars(stmt).all()]


@app.get("/api/models/{slug}", response_model=CarModelOut)
def get_model(slug: str, session: Session = Depends(get_session), lang: str = Depends(get_language)):
    stmt = (
        select(CarModel)
        .options(selectinload(CarModel.specs))
        .where(CarModel.slug == slug)
    )
    model = session.scalars(stmt).first()
    if model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    return localized_model(model, lang)


@app.get("/api/paints", response_model=list[PaintOut])
def list_paints(session: Session = Depends(get_session), lang: str = Depends(get_language)):
    paints = session.scalars(select(Paint).order_by(Paint.sort_order)).all()
    return [
        PaintOut.model_validate(paint).model_copy(update={"label": translated(paint, "name", lang)})
        for paint in paints
    ]


@app.get("/api/eras", response_model=list[EraOut])
def list_eras(session: Session = Depends(get_session), lang: str = Depends(get_language)):
    eras = session.scalars(select(Era).order_by(Era.sort_order)).all()
    return [
        EraOut.model_validate(era).model_copy(
            update={field: translated(era, field, lang) for field in ("title", "description", "photo_caption")}
        )
        for era in eras
    ]
