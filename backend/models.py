from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class CarModel(Base):
    __tablename__ = "models"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    tagline: Mapped[str] = mapped_column(String(200))
    image_url: Mapped[str] = mapped_column(String(300))
    base_hue: Mapped[int | None]
    sort_order: Mapped[int] = mapped_column(default=0)

    specs: Mapped[list["ModelSpec"]] = relationship(
        back_populates="model",
        order_by="ModelSpec.sort_order",
        cascade="all, delete-orphan",
    )


class ModelSpec(Base):
    __tablename__ = "model_specs"

    id: Mapped[int] = mapped_column(primary_key=True)
    model_id: Mapped[int] = mapped_column(
        ForeignKey("models.id", ondelete="CASCADE")
    )
    label: Mapped[str] = mapped_column(String(50))
    value: Mapped[str] = mapped_column(String(100))
    sort_order: Mapped[int] = mapped_column(default=0)

    model: Mapped["CarModel"] = relationship(back_populates="specs")


class Paint(Base):
    __tablename__ = "paints"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    swatch_hex: Mapped[str] = mapped_column(String(7))
    hue: Mapped[int | None]
    sort_order: Mapped[int] = mapped_column(default=0)


class Era(Base):
    __tablename__ = "eras"

    id: Mapped[int] = mapped_column(primary_key=True)
    year_label: Mapped[str] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    photo_url: Mapped[str] = mapped_column(String(300))
    photo_caption: Mapped[str] = mapped_column(String(200), default="")
    bg_color: Mapped[str] = mapped_column(String(7))
    accent_color: Mapped[str] = mapped_column(String(7))
    sort_order: Mapped[int] = mapped_column(default=0)
    


class EvModel(Base):
    """Physical parameters of an electric model, used by the trip planner."""

    __tablename__ = "ev_models"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    usable_battery_kwh: Mapped[float] = mapped_column(Float)
    mass_kg: Mapped[float] = mapped_column(Float)
    drag_coefficient: Mapped[float] = mapped_column(Float)
    frontal_area_m2: Mapped[float] = mapped_column(Float)
    max_charge_kw: Mapped[float] = mapped_column(Float)
    # [[state of charge %, charging power kW], ...]
    charge_curve: Mapped[list] = mapped_column(JSON)
    sort_order: Mapped[int] = mapped_column(default=0)


class Trip(Base):
    """A route planned by a visitor, kept so everyone can see it later."""

    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    ev_model_id: Mapped[int] = mapped_column(ForeignKey("ev_models.id"))

    origin_label: Mapped[str] = mapped_column(String(200))
    origin_lat: Mapped[float] = mapped_column(Float)
    origin_lon: Mapped[float] = mapped_column(Float)
    destination_label: Mapped[str] = mapped_column(String(200))
    destination_lat: Mapped[float] = mapped_column(Float)
    destination_lon: Mapped[float] = mapped_column(Float)

    start_soc: Mapped[float] = mapped_column(Float)
    cruise_speed_kmh: Mapped[float] = mapped_column(Float)
    temperature_c: Mapped[float] = mapped_column(Float)

    distance_km: Mapped[float] = mapped_column(Float)
    ascent_m: Mapped[float] = mapped_column(Float)
    descent_m: Mapped[float] = mapped_column(Float)
    energy_kwh: Mapped[float] = mapped_column(Float)
    consumption_kwh_per_100km: Mapped[float] = mapped_column(Float)
    driving_minutes: Mapped[float] = mapped_column(Float)
    charging_minutes: Mapped[float] = mapped_column(Float)
    total_minutes: Mapped[float] = mapped_column(Float)
    arrival_soc: Mapped[float] = mapped_column(Float)
    # simplified route for the map: [[lat, lon], ...]
    route: Mapped[list] = mapped_column(JSON)

    ev_model: Mapped["EvModel"] = relationship()

    @property
    def stop_count(self) -> int:
        return len(self.stops)
    stops: Mapped[list["TripChargingStop"]] = relationship(
        back_populates="trip",
        order_by="TripChargingStop.sort_order",
        cascade="all, delete-orphan",
    )


class TripChargingStop(Base):
    __tablename__ = "trip_charging_stops"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"))
    sort_order: Mapped[int] = mapped_column(default=0)
    at_km: Mapped[float] = mapped_column(Float)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    arrive_soc: Mapped[float] = mapped_column(Float)
    depart_soc: Mapped[float] = mapped_column(Float)
    charge_minutes: Mapped[float] = mapped_column(Float)

    trip: Mapped["Trip"] = relationship(back_populates="stops")
