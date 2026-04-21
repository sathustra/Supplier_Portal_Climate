"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-04-20
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "suppliers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("company_name", sa.String(), nullable=False),
        sa.Column("country", sa.String(), nullable=False),
        sa.Column("duns_number", sa.String(), nullable=True, unique=True),
        sa.Column("contact_name", sa.String(), nullable=False),
        sa.Column("contact_email", sa.String(), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "submission_periods",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("supplier_id", UUID(as_uuid=True), sa.ForeignKey("suppliers.id"), nullable=False),
        sa.Column("reporting_year", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("draft", "submitted", "under_review", "approved", "rejected", name="submissionstatus"),
            nullable=False,
            server_default="draft",
        ),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewer_comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("supplier_id", "reporting_year", name="uq_supplier_year"),
    )

    op.create_table(
        "pcf_records",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("submission_id", UUID(as_uuid=True), sa.ForeignKey("submission_periods.id", ondelete="CASCADE"), nullable=False),
        sa.Column("supplier_id", UUID(as_uuid=True), sa.ForeignKey("suppliers.id"), nullable=False),
        sa.Column("article_number", sa.String(), nullable=False),
        sa.Column("product_name", sa.String(), nullable=False),
        sa.Column("pcf_total", sa.Float(), nullable=False),
        sa.Column("functional_unit", sa.String(), nullable=False),
        sa.Column(
            "system_boundary",
            sa.Enum("cradle_to_gate", "cradle_to_grave", "gate_to_gate", name="systemboundary"),
            nullable=False,
        ),
        sa.Column(
            "methodology",
            sa.Enum("iso_14067", "ghg_product", "pact_pathfinder", "pef", "other", name="methodology"),
            nullable=False,
        ),
        sa.Column("primary_data_share", sa.Float(), nullable=True),
        sa.Column("biogenic_emissions", sa.Float(), nullable=True),
        sa.Column("raw_material_emissions", sa.Float(), nullable=True),
        sa.Column("production_energy_emissions", sa.Float(), nullable=True),
        sa.Column("upstream_transport_emissions", sa.Float(), nullable=True),
        sa.Column("packaging_emissions", sa.Float(), nullable=True),
        sa.Column("other_emissions", sa.Float(), nullable=True),
        sa.Column("recycled_content_share", sa.Float(), nullable=True),
        sa.Column("bio_based_share", sa.Float(), nullable=True),
        sa.Column(
            "allocation_method",
            sa.Enum("mass", "economic", "energy", "system_expansion", "none", name="allocationmethod"),
            nullable=True,
        ),
        sa.Column("calculation_year", sa.Integer(), nullable=False),
        sa.Column("externally_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("verification_standard", sa.String(), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "reduction_targets",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("submission_id", UUID(as_uuid=True), sa.ForeignKey("submission_periods.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("supplier_id", UUID(as_uuid=True), sa.ForeignKey("suppliers.id"), nullable=False),
        sa.Column("has_climate_target", sa.Boolean(), nullable=False),
        sa.Column(
            "sbti_status",
            sa.Enum("none", "committed", "validated_near_term", "validated_net_zero", name="sbtistatus"),
            nullable=False,
            server_default="none",
        ),
        sa.Column("base_year", sa.Integer(), nullable=True),
        sa.Column("near_term_target_year", sa.Integer(), nullable=True),
        sa.Column("scope_1_2_reduction_pct", sa.Float(), nullable=True),
        sa.Column("scope_3_reduction_pct", sa.Float(), nullable=True),
        sa.Column("net_zero_target_year", sa.Integer(), nullable=True),
        sa.Column("net_zero_reduction_pct", sa.Float(), nullable=True),
        sa.Column("internal_carbon_price", sa.Float(), nullable=True),
        sa.Column("cdp_participation", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("cdp_score", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "reduction_measures",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("submission_id", UUID(as_uuid=True), sa.ForeignKey("submission_periods.id", ondelete="CASCADE"), nullable=False),
        sa.Column("supplier_id", UUID(as_uuid=True), sa.ForeignKey("suppliers.id"), nullable=False),
        sa.Column("measure_name", sa.String(), nullable=False),
        sa.Column(
            "affected_scope",
            sa.Enum("scope_1", "scope_2", "scope_3", "scope_1_2", "cross_cutting", name="affectedscope"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("implemented", "in_progress", "planned", "under_review", name="measurestatus"),
            nullable=False,
        ),
        sa.Column("implementation_year", sa.Integer(), nullable=True),
        sa.Column("expected_savings_tco2e", sa.Float(), nullable=True),
        sa.Column("capex_eur", sa.Float(), nullable=True),
        sa.Column(
            "relevant_to_our_supply",
            sa.Enum("yes", "no", "partially", name="relevancetosupply"),
            nullable=False,
            server_default="partially",
        ),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("reduction_measures")
    op.drop_table("reduction_targets")
    op.drop_table("pcf_records")
    op.drop_table("submission_periods")
    op.drop_table("suppliers")
    op.execute("DROP TYPE IF EXISTS relevancetosupply")
    op.execute("DROP TYPE IF EXISTS measurestatus")
    op.execute("DROP TYPE IF EXISTS affectedscope")
    op.execute("DROP TYPE IF EXISTS sbtistatus")
    op.execute("DROP TYPE IF EXISTS allocationmethod")
    op.execute("DROP TYPE IF EXISTS methodology")
    op.execute("DROP TYPE IF EXISTS systemboundary")
    op.execute("DROP TYPE IF EXISTS submissionstatus")
