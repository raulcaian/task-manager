"""Turns a trip request into a saved, fully calculated trip."""

from sqlalchemy.orm import Session

import ev_physics
from external import Place, RouteService, WeatherService
from models import EvModel, Trip, TripChargingStop
from schemas import TripCreate

DEFAULT_TEMPERATURE_C = 15.0
MAX_ROUTE_POINTS_STORED = 400


def vehicle_from_model(ev_model: EvModel) -> ev_physics.Vehicle:
    return ev_physics.Vehicle(
        name=ev_model.name,
        usable_battery_kwh=ev_model.usable_battery_kwh,
        mass_kg=ev_model.mass_kg,
        drag_coefficient=ev_model.drag_coefficient,
        frontal_area_m2=ev_model.frontal_area_m2,
        charge_curve=tuple((float(soc), float(kw)) for soc, kw in ev_model.charge_curve),
    )


def driving_speed_kmh(cruise_speed_kmh: float, distance_m: float, duration_s: float) -> float:
    """Average speed used for the energy and time estimate.

    The route's own average (towns, national roads, motorway) caps the
    visitor's cruise speed; the 1.2 factor accounts for the conservative
    durations that routing engines return.
    """
    if duration_s <= 0:
        return cruise_speed_kmh
    route_average = distance_m / duration_s * 3.6
    return max(30.0, min(cruise_speed_kmh, route_average * 1.2))


def simplify_route(coordinates: list[list[float]]) -> list[list[float]]:
    """Keep at most MAX_ROUTE_POINTS_STORED points, as [lat, lon], for the map."""
    step = max(1, len(coordinates) // MAX_ROUTE_POINTS_STORED)
    points = coordinates[::step]
    if points[-1] is not coordinates[-1]:
        points.append(coordinates[-1])
    return [[round(lat, 5), round(lon, 5)] for lon, lat, *_ in points]


def plan_and_save(
    session: Session,
    request: TripCreate,
    ev_model: EvModel,
    routes: RouteService,
    weather: WeatherService,
) -> Trip:
    origin = Place(request.origin.label, request.origin.lat, request.origin.lon)
    destination = Place(request.destination.label, request.destination.lat, request.destination.lon)

    route = routes.route(origin, destination)
    temperature = request.temperature_c
    if temperature is None:
        temperature = weather.current_temperature_c(origin.lat, origin.lon)
    if temperature is None:
        temperature = DEFAULT_TEMPERATURE_C

    speed = driving_speed_kmh(request.cruise_speed_kmh, route.distance_m, route.duration_s)
    plan = ev_physics.plan_trip(
        vehicle=vehicle_from_model(ev_model),
        segments=ev_physics.segments_from_coordinates(route.coordinates),
        start_soc=request.start_soc,
        speed_kmh=speed,
        temperature_c=temperature,
    )

    trip = Trip(
        ev_model=ev_model,
        origin_label=origin.label,
        origin_lat=origin.lat,
        origin_lon=origin.lon,
        destination_label=destination.label,
        destination_lat=destination.lat,
        destination_lon=destination.lon,
        start_soc=request.start_soc,
        cruise_speed_kmh=request.cruise_speed_kmh,
        temperature_c=round(temperature, 1),
        distance_km=plan.distance_km,
        ascent_m=plan.ascent_m,
        descent_m=plan.descent_m,
        energy_kwh=plan.energy_kwh,
        consumption_kwh_per_100km=plan.consumption_kwh_per_100km,
        driving_minutes=plan.driving_minutes,
        charging_minutes=plan.charging_minutes,
        total_minutes=plan.total_minutes,
        arrival_soc=plan.arrival_soc,
        route=simplify_route(route.coordinates),
        stops=[
            TripChargingStop(
                sort_order=order,
                at_km=stop.at_km,
                lat=stop.lat,
                lon=stop.lon,
                arrive_soc=stop.arrive_soc,
                depart_soc=stop.depart_soc,
                charge_minutes=stop.charge_minutes,
            )
            for order, stop in enumerate(plan.stops)
        ],
    )
    session.add(trip)
    session.commit()
    session.refresh(trip)
    return trip
