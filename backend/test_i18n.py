from fastapi.testclient import TestClient

import main
from configurator import validate_selection, Option
from i18n import pick_language

client = TestClient(main.app)


def test_language_is_picked_from_query_then_browser():
    assert pick_language("de", "ro-RO,ro;q=0.9") == "de"
    assert pick_language(None, "ro-RO,ro;q=0.9,en;q=0.8") == "ro"
    assert pick_language(None, "fr-FR,fr") == "en"
    assert pick_language("xx", None) == "en"


def test_eras_are_translated():
    eras = client.get("/api/eras?lang=de").json()
    assert eras[1]["title"] == "Der erste Porsche"
    assert eras[-1]["year_label"] == "Today"  # stable key, the frontend translates it


def test_models_and_specs_are_translated():
    carrera = client.get("/api/models/911-carrera?lang=ro").json()
    assert carrera["tagline"] == "Coupé · motor spate"
    assert carrera["specs"][0] == {"label": "Caroserie", "value": "Coupé 2+2"}
    assert carrera["name"] == "911 Carrera"


def test_paints_keep_english_name_and_get_a_label():
    blue = next(p for p in client.get("/api/paints?lang=de").json() if p["name"] == "Blue")
    assert blue["label"] == "Blau"


def test_accept_language_header_is_used():
    eras = client.get("/api/eras", headers={"Accept-Language": "ro-RO,ro;q=0.9"}).json()
    assert eras[0]["title"] == "Totul începe cu un birou de proiectare"


def test_english_is_the_fallback():
    eras = client.get("/api/eras").json()
    assert eras[1]["title"] == "The first Porsche"


def test_quote_errors_in_german():
    paints = client.get("/api/paints").json()
    response = client.post(
        "/api/quote?lang=de",
        json={"model": "911-carrera", "paint_id": paints[0]["id"], "options": ["ceramic-brakes"]},
    )
    messages = [e["msg"] for e in response.json()["detail"]]
    assert "Wählen Sie genau eine Option für die Räder." in messages
    assert any("erfordert" in m for m in messages)


def test_rule_messages_in_romanian():
    options = {"w": Option("w", "wheels", "Jante", 0)}
    assert validate_selection("911", options, [], "ro") == ["Alege exact o opțiune pentru jante."]
