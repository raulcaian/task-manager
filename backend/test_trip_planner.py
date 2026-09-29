from ev_physics import Segment
from trip_planner import match_road_distance


def test_segments_are_stretched_to_the_road_length():
    segments = [Segment(900.0, 0.0, 48.0, 9.0), Segment(900.0, 5.0, 48.0, 9.01)]
    stretched = match_road_distance(segments, 2000.0)
    assert sum(s.distance_m for s in stretched) == 2000.0
    assert stretched[1].elevation_change_m == 5.0


def test_unrealistic_factors_are_capped():
    segments = [Segment(1000.0, 0.0, 48.0, 9.0)]
    assert match_road_distance(segments, 10_000.0)[0].distance_m == 1300.0
    assert match_road_distance([], 1000.0) == []
