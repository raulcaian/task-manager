"""add trip planner tables

Revision ID: 3b9d2f6a1c47
Revises: e7f72127edc8
Create Date: 2026-09-29 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3b9d2f6a1c47'
down_revision: Union[str, Sequence[str], None] = 'e7f72127edc8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('ev_models',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('slug', sa.String(length=50), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('usable_battery_kwh', sa.Float(), nullable=False),
    sa.Column('mass_kg', sa.Float(), nullable=False),
    sa.Column('drag_coefficient', sa.Float(), nullable=False),
    sa.Column('frontal_area_m2', sa.Float(), nullable=False),
    sa.Column('max_charge_kw', sa.Float(), nullable=False),
    sa.Column('charge_curve', sa.JSON(), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('slug')
    )
    op.create_table('trips',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('ev_model_id', sa.Integer(), nullable=False),
    sa.Column('origin_label', sa.String(length=200), nullable=False),
    sa.Column('origin_lat', sa.Float(), nullable=False),
    sa.Column('origin_lon', sa.Float(), nullable=False),
    sa.Column('destination_label', sa.String(length=200), nullable=False),
    sa.Column('destination_lat', sa.Float(), nullable=False),
    sa.Column('destination_lon', sa.Float(), nullable=False),
    sa.Column('start_soc', sa.Float(), nullable=False),
    sa.Column('cruise_speed_kmh', sa.Float(), nullable=False),
    sa.Column('temperature_c', sa.Float(), nullable=False),
    sa.Column('distance_km', sa.Float(), nullable=False),
    sa.Column('ascent_m', sa.Float(), nullable=False),
    sa.Column('descent_m', sa.Float(), nullable=False),
    sa.Column('energy_kwh', sa.Float(), nullable=False),
    sa.Column('consumption_kwh_per_100km', sa.Float(), nullable=False),
    sa.Column('driving_minutes', sa.Float(), nullable=False),
    sa.Column('charging_minutes', sa.Float(), nullable=False),
    sa.Column('total_minutes', sa.Float(), nullable=False),
    sa.Column('arrival_soc', sa.Float(), nullable=False),
    sa.Column('route', sa.JSON(), nullable=False),
    sa.ForeignKeyConstraint(['ev_model_id'], ['ev_models.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_trips_created_at', 'trips', ['created_at'])
    op.create_table('trip_charging_stops',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('trip_id', sa.Integer(), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('at_km', sa.Float(), nullable=False),
    sa.Column('lat', sa.Float(), nullable=False),
    sa.Column('lon', sa.Float(), nullable=False),
    sa.Column('arrive_soc', sa.Float(), nullable=False),
    sa.Column('depart_soc', sa.Float(), nullable=False),
    sa.Column('charge_minutes', sa.Float(), nullable=False),
    sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('trip_charging_stops')
    op.drop_index('ix_trips_created_at', table_name='trips')
    op.drop_table('trips')
    op.drop_table('ev_models')
