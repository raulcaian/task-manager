import json
from pathlib import Path

from sqlalchemy import delete

from db import SessionLocal
from models import CarModel, Era, ModelSpec, Paint

DATA_FILE = Path(__file__).parent / "seed_data.json"


def seed() -> None:
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))

    with SessionLocal() as session:
        # Start from empty tables so the script can safely run again.
        session.execute(delete(ModelSpec))
        session.execute(delete(CarModel))
        session.execute(delete(Paint))
        session.execute(delete(Era))

        for order, item in enumerate(data["models"]):
            model = CarModel(
                slug=item["slug"],
                name=item["name"],
                tagline=item["tagline"],
                image_url=item["image_url"],
                base_hue=item["base_hue"],
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

        session.commit()

    print(
        f"Seeded {len(data['models'])} models, "
        f"{len(data['paints'])} paints, {len(data['eras'])} eras."
    )


if __name__ == "__main__":
    seed()
