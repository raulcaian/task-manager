import pytest

from ev_physics import (
    RESERVE_SOC,
    Segment,
    Vehicle,
    charging_minutes,
    haversine_m,
    plan_trip,
    segment_energy_kwh,
    segments_from_coordinates,
)

TAYCAN = Vehicle(
    name="Taycan",
    usable_battery_kwh=97,
    mass_kg=2250,
    drag_coefficient=0.22,
    frontal_area_m2=2.33,
    charge_curve=((0, 280), (10, 320), (30, 300), (50, 250), (60, 210), (70, 160), (80, 110), (90, 55), (100, 20)),
)
FLAT_KM = Segment(distance_m=1000, elevation_change_m=0, lat=45.0, lon=25.0)


def flat_route(km: int) -> list[Segment]:
    return [FLAT_KM] * km


def test_haversine_bucharest_to_cluj_is_about_325_km():
    assert haversine_m(44.4268, 26.1025, 46.7712, 23.6236) == pytest.approx(325_000, rel=0.02)


def test_segments_from_coordinates_keep_distance_and_elevation():
    segments = segments_from_coordinates([[25.0, 45.0, 100], [25.0, 45.01, 150], [25.0, 45.02, 120]])
    assert len(segments) == 2
    assert segments[0].elevation_change_m == 50
    assert segments[1].elevation_change_m == -30
    assert sum(s.distance_m for s in segments) == pytest.approx(2224, rel=0.01)


def test_faster_driving_uses_more_energy_per_km():
    slow = segment_energy_kwh(TAYCAN, FLAT_KM, 100, 20)
    fast = segment_energy_kwh(TAYCAN, FLAT_KM, 150, 20)
    assert fast > slow * 1.4


def test_motorway_consumption_is_realistic():
    plan = plan_trip(TAYCAN, flat_route(100), start_soc=90, speed_kmh=130, temperature_c=20)
    assert 17 <= plan.consumption_kwh_per_100km <= 24


def test_uphill_costs_more_and_downhill_recovers_energy():
    flat = segment_energy_kwh(TAYCAN, FLAT_KM, 100, 20)
    uphill = segment_energy_kwh(TAYCAN, Segment(1000, 30, 45, 25), 100, 20)
    downhill = segment_energy_kwh(TAYCAN, Segment(1000, -30, 45, 25), 100, 20)
    assert uphill > flat > downhill


def test_cold_weather_increases_consumption():
    mild = segment_energy_kwh(TAYCAN, FLAT_KM, 120, 20)
    cold = segment_energy_kwh(TAYCAN, FLAT_KM, 120, -10)
    assert cold > mild * 1.15


def test_charging_slows_down_near_full():
    low = charging_minutes(TAYCAN, 10, 30)
    high = charging_minutes(TAYCAN, 80, 100)
    assert high > low * 2
    assert 15 <= charging_minutes(TAYCAN, 10, 80) <= 25


def test_short_trip_needs_no_charging():
    plan = plan_trip(TAYCAN, flat_route(150), start_soc=80, speed_kmh=120, temperature_c=20)
    assert plan.stops == []
    assert plan.arrival_soc > RESERVE_SOC
    assert plan.total_minutes == plan.driving_minutes


def test_long_trip_plans_stops_and_never_drops_below_reserve():
    plan = plan_trip(TAYCAN, flat_route(900), start_soc=90, speed_kmh=130, temperature_c=15)
    assert len(plan.stops) >= 2
    for stop in plan.stops:
        assert stop.arrive_soc >= RESERVE_SOC - 0.5
        assert stop.depart_soc > stop.arrive_soc
        assert stop.depart_soc <= 80
    assert plan.arrival_soc >= RESERVE_SOC
    assert plan.total_minutes == pytest.approx(plan.driving_minutes + plan.charging_minutes, abs=1)


def test_last_stop_only_charges_what_is_needed():
    plan = plan_trip(TAYCAN, flat_route(550), start_soc=90, speed_kmh=130, temperature_c=15)
    assert len(plan.stops) == 1
    assert plan.stops[0].depart_soc < 80


def test_start_charge_below_reserve_is_rejected():
    with pytest.raises(ValueError):
        plan_trip(TAYCAN, flat_route(10), start_soc=5, speed_kmh=100, temperature_c=20)
