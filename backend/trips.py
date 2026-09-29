"""Routes of the EV trip planner."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

import trip_planner
from db import get_session
from external import ExternalServiceError, RouteService, WeatherService, get_route_service, get_weather_service
from models import EvModel, Trip
from rate_limit import geocode_limit, plan_trip_limit
from schemas import EvModelOut, PlaceOut, TripCreate, TripOut, TripSummaryOut

router = APIRouter(prefix="/api", tags=["trip planner"])


@router.get("/ev-models", response_model=list[EvModelOut])
def list_ev_models(session: Session = Depends(get_session)):
    return session.scalars(select(EvModel).order_by(EvModel.sort_order)).all()


@router.get("/geocode", response_model=list[PlaceOut], dependencies=[Depends(geocode_limit)])
def geocode(
    q: str = Query(min_length=2, max_length=100),
    routes: RouteService = Depends(get_route_service),
):
    try:
        return routes.geocode(q)
    except ExternalServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post(
    "/trips",
    response_model=TripOut,
    status_code=201,
    dependencies=[Depends(plan_trip_limit)],
)
def create_trip(
    request: TripCreate,
    session: Session = Depends(get_session),
    routes: RouteService = Depends(get_route_service),
    weather: WeatherService = Depends(get_weather_service),
):
    ev_model = session.scalars(select(EvModel).where(EvModel.slug == request.ev_model)).first()
    if ev_model is None:
        raise HTTPException(status_code=422, detail="Unknown EV model")
    try:
        return trip_planner.plan_and_save(session, request, ev_model, routes, weather)
    except ExternalServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/trips", response_model=list[TripSummaryOut])
def list_trips(
    limit: int = Query(default=20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    stmt = (
        select(Trip)
        .options(selectinload(Trip.stops), selectinload(Trip.ev_model))
        .order_by(Trip.created_at.desc(), Trip.id.desc())
        .limit(limit)
    )
    return session.scalars(stmt).all()


@router.get("/trips/{trip_id}", response_model=TripOut)
def get_trip(trip_id: int, session: Session = Depends(get_session)):
    stmt = (
        select(Trip)
        .options(selectinload(Trip.stops), selectinload(Trip.ev_model))
        .where(Trip.id == trip_id)
    )
    trip = session.scalars(stmt).first()
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip
