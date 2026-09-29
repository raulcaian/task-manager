"""Routes of the configurator: the option catalogue and price quotes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from configurator import ConfigurationError, Option, build_quote
from db import get_session
from models import CarModel, ConfigOption, Paint
from schemas import ConfigOptionOut, QuoteOut, QuoteRequest

router = APIRouter(prefix="/api", tags=["configurator"])


def load_options(session: Session) -> dict[str, Option]:
    rows = session.scalars(select(ConfigOption).order_by(ConfigOption.sort_order)).all()
    return {
        row.code: Option(
            code=row.code,
            category=row.category,
            name=row.name,
            price_eur=row.price_eur,
            available_for=tuple(row.available_for) if row.available_for is not None else None,
            requires=tuple(row.requires),
            excludes=tuple(row.excludes),
        )
        for row in rows
    }


@router.get("/options", response_model=list[ConfigOptionOut])
def list_options(session: Session = Depends(get_session)):
    return session.scalars(select(ConfigOption).order_by(ConfigOption.sort_order)).all()


@router.post("/quote", response_model=QuoteOut)
def quote(request: QuoteRequest, session: Session = Depends(get_session)):
    model = session.scalars(select(CarModel).where(CarModel.slug == request.model)).first()
    if model is None:
        raise HTTPException(status_code=422, detail=[{"msg": "Unknown model."}])
    paint = session.get(Paint, request.paint_id)
    if paint is None:
        raise HTTPException(status_code=422, detail=[{"msg": "Unknown paint."}])

    try:
        result = build_quote(
            model.slug,
            model.name,
            model.base_price_eur,
            paint.name,
            paint.price_eur,
            load_options(session),
            request.options,
        )
    except ConfigurationError as exc:
        # Same shape as FastAPI validation errors, so the frontend handles both alike.
        raise HTTPException(status_code=422, detail=[{"msg": error} for error in exc.errors]) from exc

    return {
        "items": result.items,
        "total_eur": result.total_eur,
        "vat_included_eur": result.vat_included_eur,
    }
