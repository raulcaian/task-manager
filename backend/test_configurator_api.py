from fastapi.testclient import TestClient

import main

client = TestClient(main.app)


def paint_id(name: str) -> int:
    return next(p["id"] for p in client.get("/api/paints").json() if p["name"] == name)


def test_models_and_paints_have_prices():
    models = client.get("/api/models").json()
    assert all(model["base_price_eur"] > 0 for model in models)
    paints = client.get("/api/paints").json()
    assert {paint["name"]: paint["price_eur"] for paint in paints}["Red"] == 0


def test_options_catalogue_exposes_rules():
    options = {option["code"]: option for option in client.get("/api/options").json()}
    assert options["ceramic-brakes"]["requires"] == ["wheels-sport"]
    assert options["tow-hitch"]["available_for"] == ["cayenne"]
    assert options["burmester"]["available_for"] is None


def test_quote_for_a_valid_configuration():
    response = client.post(
        "/api/quote",
        json={"model": "911-carrera", "paint_id": paint_id("Blue"), "options": ["wheels-sport", "ceramic-brakes"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert [item["kind"] for item in body["items"]] == ["model", "paint", "option", "option"]
    assert body["total_eur"] == sum(item["price_eur"] for item in body["items"])
    assert 0 < body["vat_included_eur"] < body["total_eur"]


def test_quote_lists_every_broken_rule():
    response = client.post(
        "/api/quote",
        json={"model": "911-carrera", "paint_id": paint_id("Red"), "options": ["tow-hitch", "ceramic-brakes"]},
    )
    assert response.status_code == 422
    messages = [error["msg"] for error in response.json()["detail"]]
    assert "Electric tow hitch is not available for this model." in messages
    assert "Choose exactly one option for wheels." in messages
    assert any("requires" in message for message in messages)


def test_quote_with_unknown_model_or_paint():
    assert client.post("/api/quote", json={"model": "golf", "paint_id": 1}).status_code == 422
    response = client.post("/api/quote", json={"model": "taycan", "paint_id": 999999, "options": ["wheels-aero"]})
    assert response.status_code == 422
    assert response.json()["detail"] == [{"msg": "Unknown paint."}]
