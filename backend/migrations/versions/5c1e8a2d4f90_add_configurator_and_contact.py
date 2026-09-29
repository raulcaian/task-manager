"""add configurator prices, options and contact messages

Revision ID: 5c1e8a2d4f90
Revises: 3b9d2f6a1c47
Create Date: 2026-09-29 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5c1e8a2d4f90'
down_revision: Union[str, Sequence[str], None] = '3b9d2f6a1c47'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('models', sa.Column('base_price_eur', sa.Integer(), server_default='0', nullable=False))
    op.add_column('paints', sa.Column('price_eur', sa.Integer(), server_default='0', nullable=False))
    op.create_table('config_options',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('code', sa.String(length=50), nullable=False),
    sa.Column('category', sa.String(length=30), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('description', sa.String(length=300), nullable=False),
    sa.Column('price_eur', sa.Integer(), nullable=False),
    sa.Column('available_for', sa.JSON(), nullable=True),
    sa.Column('requires', sa.JSON(), nullable=False),
    sa.Column('excludes', sa.JSON(), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('code')
    )
    op.create_table('contact_messages',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('email', sa.String(length=254), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('email_sent', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('contact_messages')
    op.drop_table('config_options')
    op.drop_column('paints', 'price_eur')
    op.drop_column('models', 'base_price_eur')
