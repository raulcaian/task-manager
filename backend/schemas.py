from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SpecOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    label: str
    value: str


class CarModelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    tagline: str
    image_url: str
    base_hue: int | None
    base_price_eur: int
    specs: list[SpecOut]


class PaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    swatch_hex: str
    hue: int | None
    price_eur: int


class EraOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    year_label: str
    title: str
    description: str
    photo_url: str
    photo_caption: str
    bg_color: str
    accent_color: str


class EvModelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    name: str
    usable_battery_kwh: float
    max_charge_kw: float


class PlaceIn(BaseModel):
    label: str = Field(min_length=1, max_length=200)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class PlaceOut(PlaceIn):
    pass


class TripCreate(BaseModel):
    origin: PlaceIn
    destination: PlaceIn
    ev_model: str = Field(description="Slug of the EV model, e.g. 'taycan'")
    start_soc: float = Field(ge=15, le=100, description="Battery at departure, %")
    cruise_speed_kmh: float = Field(default=120, ge=60, le=200)
    temperature_c: float | None = Field(
        default=None, ge=-30, le=50, description="Leave empty to use the current weather"
    )


class ChargingStopOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    at_km: float
    lat: float
    lon: float
    arrive_soc: float
    depart_soc: float
    charge_minutes: float


class TripSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    ev_model: EvModelOut
    origin_label: str
    destination_label: str
    distance_km: float
    total_minutes: float
    charging_minutes: float
    arrival_soc: float
    stop_count: int


class TripOut(TripSummaryOut):
    origin_lat: float
    origin_lon: float
    destination_lat: float
    destination_lon: float
    start_soc: float
    cruise_speed_kmh: float
    temperature_c: float
    ascent_m: float
    descent_m: float
    energy_kwh: float
    consumption_kwh_per_100km: float
    driving_minutes: float
    route: list[list[float]]
    stops: list[ChargingStopOut]


# --- Configurator -----------------------------------------------------------


class ConfigOptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    category: str
    name: str
    description: str
    price_eur: int
    available_for: list[str] | None
    requires: list[str]
    excludes: list[str]


class QuoteRequest(BaseModel):
    model: str = Field(description="Model slug, e.g. '911-carrera'")
    paint_id: int
    options: list[str] = Field(default_factory=list, max_length=30)


class LineItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    kind: str
    code: str
    name: str
    price_eur: int


class QuoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[LineItemOut]
    total_eur: int
    vat_included_eur: int


# --- Contact form -----------------------------------------------------------


class ContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    # A light check on purpose: the real proof is that a reply arrives.
    email: str = Field(max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    message: str = Field(min_length=10, max_length=2000)
    # Honeypot: hidden from people, bots tend to fill it in.
    website: str = Field(default="", max_length=200)
    turnstile_token: str | None = Field(default=None, max_length=2048)

