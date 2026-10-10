"""Create project table

Revision ID: 002
Revises: 001
Create Date: 2026-10-08

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create projects table
    op.create_table(
        'projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, default='draft'),
        sa.Column('project_type', sa.String(length=50), nullable=True),
        sa.Column('budget_amount', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('currency', sa.String(length=3), nullable=True, default='USD'),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('target_end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('owner_id', 'name'),
        sa.CheckConstraint(
            'budget_amount >= 0',
            name='ck_projects_budget_non_negative',
        ),
        sa.ForeignKeyConstraint(
            ['owner_id'], ['users.id'],
            name='fk_projects_owner_id_users',
            ondelete='RESTRICT'
        ),
    )

    # Create indexes for ownership and status filtering
    op.create_index(
        op.f('ix_projects_owner_id'), 'projects', ['owner_id'], unique=False
    )
    op.create_index(
        op.f('ix_projects_status'), 'projects', ['status'], unique=False
    )
    op.create_index(
        op.f('ix_projects_name'), 'projects', ['name'], unique=False
    )

    # Add created_at/update_at default to existing rows
    op.alter_column('projects', 'updated_at',
                    server_default=sa.text('now()'))


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_projects_owner_id'), table_name='projects')
    op.drop_index(op.f('ix_projects_status'), table_name='projects')
    op.drop_index(op.f('ix_projects_name'), table_name='projects')
    # Drop foreign key constraint
    op.drop_constraint('fk_projects_owner_id_users', 'projects', type_='foreignkey')
    # Drop table
    op.drop_table('projects')