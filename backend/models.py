from sqlalchemy import ForeignKey, String, Text
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
    