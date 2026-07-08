"""add custom credentials to profiles

Revision ID: a1b2c3d4e5f6
Revises: 
Create Date: 2026-07-08
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Agregar columnas de credenciales personalizadas por perfil
    op.add_column('profiles', sa.Column('custom_email', sa.String(255), nullable=True))
    op.add_column('profiles', sa.Column('custom_password', sa.String(255), nullable=True))


def downgrade():
    op.drop_column('profiles', 'custom_password')
    op.drop_column('profiles', 'custom_email')
