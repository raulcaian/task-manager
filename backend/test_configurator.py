"""Unit tests for the configurator rules (no database needed)."""

import pytest

from configurator import ConfigurationError, Option, build_quote, validate_selection

OPTIONS = {
    "wheels-standard": Option("wheels-standard", "wheels", "Standard wheels", 0),
    "wheels-sport": Option("wheels-sport", "wheels", "Sport wheels", 2450),
    "wheels-aero": Option("wheels-aero", "wheels", "Aero wheels", 2890, available_for=("taycan",)),
    "ceramic-brakes": Option("ceramic-brakes", "performance", "Ceramic brakes", 9780, requires=("wheels-sport",)),
    "bucket-seats": Option("bucket-seats", "interior", "Bucket seats", 5320, excludes=("comfort-seats",)),
    "comfort-seats": Option("comfort-seats", "interior", "Comfort seats", 2930),
}


def test_valid_selection_has_no_errors():
    assert validate_selection("911-carrera", OPTIONS, ["wheels-sport", "ceramic-brakes"]) == []


def test_exactly_one_wheel_choice_is_required():
    assert validate_selection("911-carrera", OPTIONS, []) == ["Choose exactly one option for wheels."]
    errors = validate_selection("911-carrera", OPTIONS, ["wheels-standard", "wheels-sport"])
    assert errors == ["Choose exactly one option for wheels."]


def test_option_limited_to_other_models():
    errors = validate_selection("911-carrera", OPTIONS, ["wheels-aero"])
    assert errors == ["Aero wheels is not available for this model."]
    assert validate_selection("taycan", OPTIONS, ["wheels-aero"]) == []


def test_missing_requirement():
    errors = validate_selection("911-carrera", OPTIONS, ["wheels-standard", "ceramic-brakes"])
    assert errors == ["Ceramic brakes requires Sport wheels."]


def test_exclusion_written_on_one_side_is_reported_once():
    errors = validate_selection(
        "911-carrera", OPTIONS, ["wheels-standard", "comfort-seats", "bucket-seats"]
    )
    assert errors == ["Bucket seats cannot be combined with Comfort seats."]


def test_unknown_and_duplicate_codes():
    errors = validate_selection("911-carrera", OPTIONS, ["wheels-standard", "turbo", "wheels-standard"])
    assert "'wheels-standard' is selected more than once." in errors
    assert "Unknown option 'turbo'." in errors


def test_quote_adds_up_and_keeps_catalogue_order():
    quote = build_quote(
        "911-carrera", "911 Carrera", 125900, "Blue", 1850, OPTIONS,
        ["ceramic-brakes", "wheels-sport"],
    )
    assert [item.code for item in quote.items] == ["911-carrera", "blue", "wheels-sport", "ceramic-brakes"]
    assert quote.total_eur == 125900 + 1850 + 2450 + 9780
    # 19 % VAT is included in the gross price: 139980 * 19 / 119
    assert quote.vat_included_eur == round(139980 * 0.19 / 1.19)


def test_quote_refuses_an_invalid_selection():
    with pytest.raises(ConfigurationError) as info:
        build_quote("911-carrera", "911 Carrera", 125900, "Red", 0, OPTIONS, ["ceramic-brakes"])
    assert len(info.value.errors) == 2  # missing wheels + missing requirement
