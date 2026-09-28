from fastapi.testclient import TestClient

import main

client = TestClient(main.app)


def test_list_models_returns_seeded_models_in_order():
    response = client.get("/api/models")
    assert response.status_code == 200
    slugs = [model["slug"] for model in response.json()]
    assert slugs == ["911-carrera", "718-boxster", "taycan", "cayenne"]


def test_each_model_has_its_specs_in_order():
    models = client.get("/api/models").json()
    for model in models:
        assert len(model["specs"]) == 4
    assert models[0]["specs"][0] == {"label": "Body", "value": "2+2 coupé"}


def test_grey_model_has_no_base_hue():
    boxster = client.get("/api/models/718-boxster").json()
    assert boxster["base_hue"] is None


def test_get_model_by_slug():
    response = client.get("/api/models/taycan")
    assert response.status_code == 200
    assert response.json()["name"] == "Taycan"


def test_unknown_model_returns_404():
    response = client.get("/api/models/golf")
    assert response.status_code == 404
    assert response.json() == {"detail": "Model not found"}


def test_internal_fields_are_not_exposed():
    model = client.get("/api/models/taycan").json()
    assert "sort_order" not in model


def test_list_paints_in_order():
    paints = client.get("/api/paints").json()
    assert [paint["name"] for paint in paints] == [
        "Red", "Blue", "Green", "Silver", "Black",
    ]


def test_list_eras_from_1931_to_today():
    eras = client.get("/api/eras").json()
    assert len(eras) == 8
    assert eras[0]["year_label"] == "1931"
    assert eras[-1]["year_label"] == "Today"
