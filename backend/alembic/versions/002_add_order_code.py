"""add order code to orders

Revision ID: 002
Revises: 001
Create Date: 2026-05-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Eagerly check if the column order_code already exists to prevent crashes on existing databases
    conn = op.get_bind()
    inspect_obj = sa.inspect(conn)
    columns = [c["name"] for c in inspect_obj.get_columns("orders")]
    
    if "order_code" not in columns:
        op.add_column("orders", sa.Column("order_code", sa.Integer(), unique=True, nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspect_obj = sa.inspect(conn)
    columns = [c["name"] for c in inspect_obj.get_columns("orders")]
    
    if "order_code" in columns:
        op.drop_column("orders", "order_code")
