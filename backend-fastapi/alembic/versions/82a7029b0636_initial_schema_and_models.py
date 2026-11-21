"""initial_schema_and_models_and_rls

Revision ID: 82a7029b0636
Revises: 
Create Date: 2026-10-12 21:01:15.683455

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '82a7029b0636'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TENANT_TABLES = [
    "units",
    "expenses",
    "aliquot_debts",
    "payments",
    "notice_circulars",
    "failure_reports",
]


def upgrade() -> None:
    # 1. Asegurar extensión UUID
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

    # 2. Habilitar Row-Level Security (RLS) y Políticas de Aislamiento Inviolable por Tenant
    for table in TENANT_TABLES:
        policy_name = f"tenant_isolation_policy_{table}"
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")
        op.execute(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE tablename = '{table}' AND policyname = '{policy_name}'
                ) THEN
                    CREATE POLICY {policy_name} ON {table}
                    FOR ALL
                    USING (
                        building_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                    )
                    WITH CHECK (
                        building_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                    );
                END IF;
            END
            $$;
        """)


def downgrade() -> None:
    for table in TENANT_TABLES:
        policy_name = f"tenant_isolation_policy_{table}"
        op.execute(f"DROP POLICY IF EXISTS {policy_name} ON {table};")
        op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
