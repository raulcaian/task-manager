import json
from pathlib import Path

from sqlalchemy import delete, select

from db import SessionLocal
from models import CarModel, ConfigOption, Era, EvModel, ModelSpec, Paint

DATA_FILE = Path(__file__).parent / "seed_data.json"


def seed() -> None:
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))

    with SessionLocal() as session:
        # Showroom content: start from empty tables so the script can safely run again.
        session.execute(delete(ModelSpec))
        session.execute(delete(CarModel))
        session.execute(delete(Paint))
        session.execute(delete(Era))
        session.execute(delete(ConfigOption))

        for order, item in enumerate(data["models"]):
            model = CarModel(
                slug=item["slug"],
                name=item["name"],
                tagline=item["tagline"],
                image_url=item["image_url"],
                base_hue=item["base_hue"],
                base_price_eur=item["base_price_eur"],
                i18n=item.get("i18n"),
                sort_order=order,
            )
            for spec_order, (label, value) in enumerate(item["specs"]):
                model.specs.append(
                    ModelSpec(label=label, value=value, sort_order=spec_order)
                )
            session.add(model)

        for order, item in enumerate(data["paints"]):
            session.add(Paint(sort_order=order, **item))

        for order, item in enumerate(data["eras"]):
            session.add(Era(sort_order=order, **item))

        for order, item in enumerate(data["config_options"]):
            session.add(ConfigOption(sort_order=order, **item))

        # EV models are referenced by saved trips, so they are updated in
        # place (matched by slug) instead of being deleted and re-created.
        for order, item in enumerate(data["ev_models"]):
            ev_model = session.scalars(
                select(EvModel).where(EvModel.slug == item["slug"])
            ).first()
            if ev_model is None:
                ev_model = EvModel(slug=item["slug"])
                session.add(ev_model)
            for key, value in item.items():
                setattr(ev_model, key, value)
            ev_model.sort_order = order

        session.commit()

    print(
        f"Seeded {len(data['models'])} models, "
        f"{len(data['paints'])} paints, {len(data['eras'])} eras, "
        f"{len(data['config_options'])} options, "
        f"{len(data['ev_models'])} EV models."
    )


if __name__ == "__main__":
    seed()
