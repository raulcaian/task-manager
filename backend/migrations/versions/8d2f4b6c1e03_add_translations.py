"""add translations (i18n) to showroom content

Revision ID: 8d2f4b6c1e03
Revises: 5c1e8a2d4f90
Create Date: 2026-09-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d2f4b6c1e03'
down_revision: Union[str, Sequence[str], None] = '5c1e8a2d4f90'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES = ('models', 'paints', 'eras', 'config_options')


def upgrade() -> None:
    """Upgrade schema."""
    for table in TABLES:
        op.add_column(table, sa.Column('i18n', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    for table in TABLES:
        op.drop_column(table, 'i18n')
