"""Configurator rules and pricing, as pure functions (no database, no HTTP).

The rules are data (stored in the config_options table) and this module only
interprets them, so adding an option or a rule never needs a code change:

- available_for: the option exists only for these models
- requires:      the option needs these other options
- excludes:      the option cannot be combined with these options
- SINGLE_CHOICE_CATEGORIES: exactly one option of the category is chosen
"""

from dataclasses import dataclass, field

# Exactly one choice per category, like radio buttons.
SINGLE_CHOICE_CATEGORIES = ("wheels",)
VAT_RATE = 0.19  # German VAT; list prices already include it

# The rule messages in every language the API speaks.
MESSAGES = {
    "en": {
        "duplicate": "'{code}' is selected more than once.",
        "unknown": "Unknown option '{code}'.",
        "unavailable": "{name} is not available for this model.",
        "requires": "{name} requires {required}.",
        "conflict": "{name} cannot be combined with {other}.",
        "single": "Choose exactly one option for {category}.",
        "paint": "{name} paint",
    },
    "de": {
        "duplicate": "„{code}“ ist mehrfach ausgewählt.",
        "unknown": "Unbekannte Option „{code}“.",
        "unavailable": "{name} ist für dieses Modell nicht erhältlich.",
        "requires": "{name} erfordert {required}.",
        "conflict": "{name} kann nicht mit {other} kombiniert werden.",
        "single": "Wählen Sie genau eine Option für {category}.",
        "paint": "Lackierung {name}",
    },
    "ro": {
        "duplicate": "„{code}” este selectată de mai multe ori.",
        "unknown": "Opțiune necunoscută „{code}”.",
        "unavailable": "{name} nu este disponibil pentru acest model.",
        "requires": "{name} necesită {required}.",
        "conflict": "{name} nu se poate combina cu {other}.",
        "single": "Alege exact o opțiune pentru {category}.",
        "paint": "Vopsea {name}",
    },
}
CATEGORY_NAMES = {
    "en": {"wheels": "wheels"},
    "de": {"wheels": "die Räder"},
    "ro": {"wheels": "jante"},
}


@dataclass(frozen=True)
class Option:
    code: str
    category: str
    name: str
    price_eur: int
    available_for: tuple[str, ...] | None = None
    requires: tuple[str, ...] = ()
    excludes: tuple[str, ...] = ()


@dataclass(frozen=True)
class LineItem:
    kind: str  # "model", "paint" or "option"
    code: str
    name: str
    price_eur: int


@dataclass
class Quote:
    items: list[LineItem] = field(default_factory=list)

    @property
    def total_eur(self) -> int:
        return sum(item.price_eur for item in self.items)

    @property
    def vat_included_eur(self) -> int:
        """The VAT contained in the gross total."""
        return round(self.total_eur * VAT_RATE / (1 + VAT_RATE))


class ConfigurationError(ValueError):
    """The selection breaks one or more rules; `errors` lists all of them."""

    def __init__(self, errors: list[str]):
        super().__init__("; ".join(errors))
        self.errors = errors


def validate_selection(
    model_slug: str, options: dict[str, Option], selected: list[str], lang: str = "en"
) -> list[str]:
    """Return every broken rule as a readable sentence (empty list = valid)."""
    text = MESSAGES.get(lang, MESSAGES["en"])
    errors: list[str] = []

    duplicates = sorted({code for code in selected if selected.count(code) > 1})
    for code in duplicates:
        errors.append(text["duplicate"].format(code=code))

    unknown = [code for code in dict.fromkeys(selected) if code not in options]
    for code in unknown:
        errors.append(text["unknown"].format(code=code))

    chosen = [options[code] for code in dict.fromkeys(selected) if code in options]
    chosen_codes = {option.code for option in chosen}

    reported_conflicts: set[frozenset[str]] = set()
    for option in chosen:
        if option.available_for is not None and model_slug not in option.available_for:
            errors.append(text["unavailable"].format(name=option.name))
        for required in option.requires:
            if required not in chosen_codes:
                required_name = options[required].name if required in options else required
                errors.append(text["requires"].format(name=option.name, required=required_name))
        for excluded in option.excludes:
            pair = frozenset((option.code, excluded))
            # A rule may be written on one side or both; report each pair once.
            if excluded in chosen_codes and pair not in reported_conflicts:
                reported_conflicts.add(pair)
                errors.append(text["conflict"].format(name=option.name, other=options[excluded].name))

    for category in SINGLE_CHOICE_CATEGORIES:
        in_category = [option for option in chosen if option.category == category]
        if len(in_category) != 1:
            category_name = CATEGORY_NAMES.get(lang, {}).get(category, category)
            errors.append(text["single"].format(category=category_name))

    return errors


def build_quote(
    model_slug: str,
    model_name: str,
    base_price_eur: int,
    paint_name: str,
    paint_price_eur: int,
    options: dict[str, Option],
    selected: list[str],
    lang: str = "en",
    paint_code: str | None = None,
) -> Quote:
    errors = validate_selection(model_slug, options, selected, lang)
    paint_code = (paint_code or paint_name).lower()
    if errors:
        raise ConfigurationError(errors)

    quote = Quote()
    quote.items.append(LineItem("model", model_slug, model_name, base_price_eur))
    paint_label = MESSAGES.get(lang, MESSAGES["en"])["paint"].format(name=paint_name)
    quote.items.append(LineItem("paint", paint_code, paint_label, paint_price_eur))
    # Show options in catalogue order, whatever order the client sent.
    order = list(options)
    for code in sorted(set(selected), key=order.index):
        option = options[code]
        quote.items.append(LineItem("option", option.code, option.name, option.price_eur))
    return quote
