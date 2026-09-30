"""Languages of the API: English (the database columns), German and Romanian.

Content rows carry their translations in an `i18n` JSON column:
{"de": {"title": "..."}, "ro": {"title": "..."}}. A missing translation
falls back to English, so a half-translated row never breaks a page.
"""

from fastapi import Header, Query

SUPPORTED = ("en", "de", "ro")
DEFAULT = "en"


def pick_language(lang: str | None, accept_language: str | None) -> str:
    """?lang= wins; otherwise the first supported language the browser asks for."""
    if lang and lang.lower()[:2] in SUPPORTED:
        return lang.lower()[:2]
    for part in (accept_language or "").split(","):
        code = part.split(";")[0].strip().lower()[:2]
        if code in SUPPORTED:
            return code
    return DEFAULT


def get_language(
    lang: str | None = Query(default=None, description="en, de or ro"),
    accept_language: str | None = Header(default=None),
) -> str:
    return pick_language(lang, accept_language)


def translated(row, field: str, lang: str):
    """The field in `lang` if a translation exists, else the English value."""
    value = ((getattr(row, "i18n", None) or {}).get(lang) or {}).get(field)
    return value if value is not None else getattr(row, field)
