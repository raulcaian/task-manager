"""Pytest setup: run the tests against a separate database, migrated and
seeded once per test run, so tests never touch the development data."""

import os
from pathlib import Path

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://showroom:showroom@localhost:5432/showroom_test",
)
# Must be set before db.py is imported anywhere, so the app's engine
# connects to the test database instead of the development one.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

import psycopg  # noqa: E402
import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from psycopg import sql  # noqa: E402
from sqlalchemy.engine import make_url  # noqa: E402

BACKEND_DIR = Path(__file__).parent


def _create_database_if_missing(url_string: str) -> None:
    """Create the test database on the same server if it does not exist."""
    url = make_url(url_string)
    server_url = url.set(drivername="postgresql", database="postgres")
    with psycopg.connect(
        server_url.render_as_string(hide_password=False), autocommit=True
    ) as conn:
        exists = conn.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s", (url.database,)
        ).fetchone()
        if not exists:
            conn.execute(
                sql.SQL("CREATE DATABASE {}").format(sql.Identifier(url.database))
            )


@pytest.fixture(scope="session", autouse=True)
def test_database():
    _create_database_if_missing(TEST_DATABASE_URL)
    command.upgrade(Config(str(BACKEND_DIR / "alembic.ini")), "head")

    from seed import seed

    seed()
    yield
