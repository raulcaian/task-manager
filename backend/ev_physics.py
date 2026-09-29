"""Energy and charging model for the EV trip planner.

Pure functions, no database or network access, so every rule can be unit
tested. All numbers are engineering estimates, not official Porsche data.
"""

import math
from dataclasses import dataclass, field

GRAVITY = 9.81  # m/s^2
EARTH_RADIUS_M = 6_371_000
RESERVE_SOC = 10.0  # never plan to arrive anywhere below this (%)
CHARGE_TARGET_SOC = 80.0  # above ~80% charging becomes very slow (%)
ARRIVAL_MARGIN_SOC = 5.0  # extra buffer on top of the reserve when charging for the last leg (%)


@dataclass(frozen=True)
class Vehicle:
    """Physical parameters of one EV model."""

    name: str
    usable_battery_kwh: float
    mass_kg: float  # car + driver + some luggage
    drag_coefficient: float  # Cd
    frontal_area_m2: float
    rolling_resistance: float = 0.009  # Crr, typical for low-resistance EV tyres
    drivetrain_efficiency: float = 0.90  # battery -> wheels
    regen_efficiency: float = 0.65  # wheels -> battery when braking / going downhill
    auxiliary_kw: float = 0.35  # electronics, pumps, infotainment
    # (state of charge %, max charging power kW), sorted by state of charge
    charge_curve: tuple[tuple[float, float], ...] = field(default=((0.0, 150.0), (100.0, 20.0)))


@dataclass(frozen=True)
class Segment:
    """A short piece of the route between two consecutive route points."""

    distance_m: float
    elevation_change_m: float
    lat: float
    lon: float


@dataclass(frozen=True)
class ChargingStop:
    at_km: float
    lat: float
    lon: float
    arrive_soc: float
    depart_soc: float
    charge_minutes: float


@dataclass(frozen=True)
class TripPlan:
    distance_km: float
    ascent_m: float
    descent_m: float
    energy_kwh: float
    consumption_kwh_per_100km: float
    driving_minutes: float
    charging_minutes: float
    total_minutes: float
    arrival_soc: float
    stops: list[ChargingStop]


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points, in metres."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def segments_from_coordinates(coordinates: list[list[float]]) -> list[Segment]:
    """Turn route points [lon, lat, elevation] into segments.

    The segment position is its end point, which is where a charging stop
    would be placed.
    """
    segments = []
    for (lon1, lat1, *e1), (lon2, lat2, *e2) in zip(coordinates, coordinates[1:]):
        distance = haversine_m(lat1, lon1, lat2, lon2)
        if distance <= 0:
            continue
        elevation_change = (e2[0] - e1[0]) if e1 and e2 else 0.0
        segments.append(Segment(distance, elevation_change, lat2, lon2))
    return segments


def air_density(temperature_c: float) -> float:
    """Dry-air density at sea level; cold air is denser, so drag is higher."""
    return 101_325 / (287.05 * (temperature_c + 273.15))


def climate_kw(temperature_c: float) -> float:
    """Cabin heating or cooling power for a heat-pump car (kW)."""
    if temperature_c < 20:
        return min(4.0, (20 - temperature_c) * 0.12)
    if temperature_c > 24:
        return min(3.0, (temperature_c - 24) * 0.10)
    return 0.0


def cold_battery_factor(temperature_c: float) -> float:
    """A cold battery wastes more energy; +1% per degree below 10 °C, max +20%."""
    return 1.0 + min(0.20, max(0.0, (10 - temperature_c) * 0.01))


def segment_energy_kwh(
    vehicle: Vehicle, segment: Segment, speed_kmh: float, temperature_c: float
) -> float:
    """Energy taken from the battery for one segment (negative = recovered)."""
    speed = speed_kmh / 3.6
    drag = 0.5 * air_density(temperature_c) * vehicle.drag_coefficient * vehicle.frontal_area_m2 * speed**2
    rolling = vehicle.rolling_resistance * vehicle.mass_kg * GRAVITY
    wheel_energy_j = (drag + rolling) * segment.distance_m + vehicle.mass_kg * GRAVITY * segment.elevation_change_m

    if wheel_energy_j >= 0:
        battery_j = wheel_energy_j / vehicle.drivetrain_efficiency * cold_battery_factor(temperature_c)
    else:
        battery_j = wheel_energy_j * vehicle.regen_efficiency

    seconds = segment.distance_m / speed
    auxiliary_j = (vehicle.auxiliary_kw + climate_kw(temperature_c)) * 1000 * seconds
    return (battery_j + auxiliary_j) / 3_600_000


def charging_power_kw(vehicle: Vehicle, soc: float) -> float:
    """Charging power at a given state of charge, interpolated on the curve."""
    curve = vehicle.charge_curve
    if soc <= curve[0][0]:
        return curve[0][1]
    for (s1, p1), (s2, p2) in zip(curve, curve[1:]):
        if soc <= s2:
            return p1 + (p2 - p1) * (soc - s1) / (s2 - s1)
    return curve[-1][1]


def charging_minutes(vehicle: Vehicle, from_soc: float, to_soc: float) -> float:
    """Time to charge between two states of charge, following the curve."""
    minutes, soc, step = 0.0, from_soc, 0.5
    while soc < to_soc - 1e-9:
        delta = min(step, to_soc - soc)
        energy_kwh = vehicle.usable_battery_kwh * delta / 100
        power_kw = charging_power_kw(vehicle, soc + delta / 2)
        minutes += energy_kwh / power_kw * 60
        soc += delta
    return minutes


def plan_trip(
    vehicle: Vehicle,
    segments: list[Segment],
    start_soc: float,
    speed_kmh: float,
    temperature_c: float,
) -> TripPlan:
    """Drive the route virtually and insert charging stops when needed.

    Before each segment the planner checks whether the battery would drop
    below the reserve. If so, it stops and charges: up to 80% while more
    charging will be needed later, or only as much as the rest of the trip
    needs (plus a margin) for the last stop, which saves the slow top part
    of the charging curve.
    """
    if start_soc <= RESERVE_SOC:
        raise ValueError(f"Start charge must be above the {RESERVE_SOC:.0f}% reserve")
    if not segments:
        raise ValueError("The route has no distance")

    percent_per_kwh = 100 / vehicle.usable_battery_kwh
    energies = [segment_energy_kwh(vehicle, s, speed_kmh, temperature_c) for s in segments]

    # remaining[i] = energy needed from the start of segment i to the destination
    remaining = [0.0] * (len(segments) + 1)
    for i in range(len(segments) - 1, -1, -1):
        remaining[i] = remaining[i + 1] + energies[i]

    soc, distance_m, stops = start_soc, 0.0, []
    for i, (segment, energy) in enumerate(zip(segments, energies)):
        if soc - energy * percent_per_kwh < RESERVE_SOC:
            needed = RESERVE_SOC + ARRIVAL_MARGIN_SOC + remaining[i] * percent_per_kwh
            target = min(CHARGE_TARGET_SOC, max(needed, soc))
            if target - soc < 1:
                # Even a full stop cannot cover this segment (should not happen with short segments).
                target = min(100.0, soc + 1)
            previous = segments[i - 1] if i > 0 else segment
            stops.append(
                ChargingStop(
                    at_km=round(distance_m / 1000, 1),
                    lat=previous.lat,
                    lon=previous.lon,
                    arrive_soc=round(soc, 1),
                    depart_soc=round(target, 1),
                    charge_minutes=round(charging_minutes(vehicle, soc, target), 1),
                )
            )
            soc = target
        soc -= energy * percent_per_kwh
        soc = min(soc, 100.0)
        distance_m += segment.distance_m

    distance_km = distance_m / 1000
    energy_kwh = sum(energies)
    driving_minutes = distance_km / speed_kmh * 60
    total_charging = sum(stop.charge_minutes for stop in stops)
    return TripPlan(
        distance_km=round(distance_km, 1),
        ascent_m=round(sum(max(0.0, s.elevation_change_m) for s in segments)),
        descent_m=round(sum(max(0.0, -s.elevation_change_m) for s in segments)),
        energy_kwh=round(energy_kwh, 1),
        consumption_kwh_per_100km=round(energy_kwh / distance_km * 100, 1),
        driving_minutes=round(driving_minutes),
        charging_minutes=round(total_charging),
        total_minutes=round(driving_minutes + total_charging),
        arrival_soc=round(soc, 1),
        stops=stops,
    )
