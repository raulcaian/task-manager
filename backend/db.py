"""Database connection shared by the API and the Alembic migrations."""

import os
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# Default matches docker-compose.yml; on AWS this is set to the RDS address.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://showroom:showroom@localhost:5432/showroom",
)

# pool_pre_ping checks a pooled connection is still alive before using it,
# so a database restart does not surface as an error on the next request.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    """Parent class for every table defined in models.py."""


def get_session() -> Iterator[Session]:
    """FastAPI dependency: one session per request, always closed afterwards."""
    with SessionLocal() as session:
        yield session
