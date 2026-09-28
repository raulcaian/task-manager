from pydantic import BaseModel, ConfigDict


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
    specs: list[SpecOut]


class PaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    swatch_hex: str
    hue: int | None


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
