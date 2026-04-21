import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import AsyncSessionLocal
from app.models.pcf_record import AllocationMethod, Methodology, PCFRecord, SystemBoundary
from app.models.reduction_measure import AffectedScope, MeasureStatus, ReductionMeasure, RelevanceToSupply
from app.models.reduction_target import ReductionTarget, SBTiStatus
from app.models.submission import SubmissionPeriod, SubmissionStatus
from app.models.supplier import Supplier
from app.services.auth import hash_password


async def run_seed() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Supplier))
        if result.scalars().first():
            return

        admin = Supplier(
            company_name="Portal Admin",
            country="DE",
            contact_name="Admin",
            contact_email=settings.admin_email,
            password_hash=hash_password(settings.admin_password),
            is_admin=True,
        )
        db.add(admin)

        await _seed_mueller(db)
        await _seed_nordic(db)

        await db.commit()


async def _seed_mueller(db: AsyncSession) -> None:
    supplier = Supplier(
        company_name="Müller Kunststoffe GmbH",
        country="DE",
        contact_name="Hans Müller",
        contact_email="hans.mueller@mueller-kunststoffe.de",
        password_hash=hash_password("Demo1234!"),
        duns_number="123456789",
    )
    db.add(supplier)
    await db.flush()

    sub = SubmissionPeriod(
        supplier_id=supplier.id,
        reporting_year=2024,
        status=SubmissionStatus.submitted,
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(sub)
    await db.flush()

    pcf_records = [
        PCFRecord(
            submission_id=sub.id,
            supplier_id=supplier.id,
            article_number="MK-001",
            product_name="PE-HD Granulat",
            pcf_total=2.1,
            functional_unit="1 kg",
            system_boundary=SystemBoundary.cradle_to_gate,
            methodology=Methodology.iso_14067,
            primary_data_share=65.0,
            raw_material_emissions=1.4,
            production_energy_emissions=0.45,
            upstream_transport_emissions=0.15,
            packaging_emissions=0.05,
            other_emissions=0.05,
            recycled_content_share=15.0,
            bio_based_share=0.0,
            allocation_method=AllocationMethod.mass,
            calculation_year=2024,
            externally_verified=True,
            verification_standard="ISO 14067:2018",
        ),
        PCFRecord(
            submission_id=sub.id,
            supplier_id=supplier.id,
            article_number="MK-042",
            product_name="Spritzgussteil Gehäusedeckel",
            pcf_total=4.8,
            functional_unit="1 Stück",
            system_boundary=SystemBoundary.cradle_to_gate,
            methodology=Methodology.pact_pathfinder,
            primary_data_share=72.0,
            raw_material_emissions=2.8,
            production_energy_emissions=1.5,
            upstream_transport_emissions=0.3,
            packaging_emissions=0.1,
            other_emissions=0.1,
            recycled_content_share=10.0,
            allocation_method=AllocationMethod.mass,
            calculation_year=2024,
            externally_verified=False,
        ),
        PCFRecord(
            submission_id=sub.id,
            supplier_id=supplier.id,
            article_number="MK-077",
            product_name="PP-Folie 200µm",
            pcf_total=1.85,
            functional_unit="1 m²",
            system_boundary=SystemBoundary.cradle_to_gate,
            methodology=Methodology.iso_14067,
            primary_data_share=58.0,
            calculation_year=2024,
            externally_verified=False,
            remarks="Daten basieren auf Branchendurchschnittswerten für PP-Produktion.",
        ),
    ]
    for r in pcf_records:
        db.add(r)

    target = ReductionTarget(
        submission_id=sub.id,
        supplier_id=supplier.id,
        has_climate_target=True,
        sbti_status=SBTiStatus.committed,
        base_year=2019,
        near_term_target_year=2030,
        scope_1_2_reduction_pct=42.0,
        scope_3_reduction_pct=25.0,
        net_zero_target_year=2050,
        net_zero_reduction_pct=90.0,
        internal_carbon_price=45.0,
        cdp_participation=True,
        cdp_score="B",
    )
    db.add(target)

    measures = [
        ReductionMeasure(
            submission_id=sub.id,
            supplier_id=supplier.id,
            measure_name="Umstieg auf Ökostrom (100% EE) am Standort Augsburg",
            affected_scope=AffectedScope.scope_2,
            status=MeasureStatus.implemented,
            implementation_year=2023,
            expected_savings_tco2e=320.0,
            capex_eur=0.0,
            relevant_to_our_supply=RelevanceToSupply.yes,
        ),
        ReductionMeasure(
            submission_id=sub.id,
            supplier_id=supplier.id,
            measure_name="Installation Photovoltaikanlage 500 kWp",
            affected_scope=AffectedScope.scope_1_2,
            status=MeasureStatus.planned,
            implementation_year=2026,
            expected_savings_tco2e=180.0,
            capex_eur=350000.0,
            relevant_to_our_supply=RelevanceToSupply.partially,
        ),
    ]
    for m in measures:
        db.add(m)

    await db.flush()


async def _seed_nordic(db: AsyncSession) -> None:
    supplier = Supplier(
        company_name="Nordic Components AB",
        country="SE",
        contact_name="Anna Lindqvist",
        contact_email="anna.lindqvist@nordic-components.se",
        password_hash=hash_password("Demo1234!"),
        duns_number="987654321",
    )
    db.add(supplier)
    await db.flush()

    sub = SubmissionPeriod(
        supplier_id=supplier.id,
        reporting_year=2024,
        status=SubmissionStatus.draft,
    )
    db.add(sub)
    await db.flush()

    pcf_records = [
        PCFRecord(
            submission_id=sub.id,
            supplier_id=supplier.id,
            article_number="NC-A12",
            product_name="Aluminium-Stanzblech 2mm",
            pcf_total=8.6,
            functional_unit="1 kg",
            system_boundary=SystemBoundary.cradle_to_gate,
            methodology=Methodology.iso_14067,
            primary_data_share=80.0,
            raw_material_emissions=6.2,
            production_energy_emissions=1.8,
            upstream_transport_emissions=0.4,
            packaging_emissions=0.1,
            other_emissions=0.1,
            recycled_content_share=55.0,
            allocation_method=AllocationMethod.mass,
            calculation_year=2024,
            externally_verified=True,
            verification_standard="ISO 14067:2018",
            remarks="Recyclinganteil basiert auf zertifizierten Schmelzlieferanten.",
        ),
        PCFRecord(
            submission_id=sub.id,
            supplier_id=supplier.id,
            article_number="NC-B05",
            product_name="Präzisionsdrehteil Stahl",
            pcf_total=3.2,
            functional_unit="1 Stück",
            system_boundary=SystemBoundary.cradle_to_gate,
            methodology=Methodology.pact_pathfinder,
            primary_data_share=60.0,
            raw_material_emissions=1.9,
            production_energy_emissions=0.9,
            upstream_transport_emissions=0.3,
            packaging_emissions=0.05,
            other_emissions=0.05,
            calculation_year=2024,
            externally_verified=False,
        ),
    ]
    for r in pcf_records:
        db.add(r)

    target = ReductionTarget(
        submission_id=sub.id,
        supplier_id=supplier.id,
        has_climate_target=True,
        sbti_status=SBTiStatus.validated_near_term,
        base_year=2020,
        near_term_target_year=2030,
        scope_1_2_reduction_pct=50.0,
        scope_3_reduction_pct=30.0,
        net_zero_target_year=2045,
        net_zero_reduction_pct=95.0,
        internal_carbon_price=80.0,
        cdp_participation=True,
        cdp_score="A-",
    )
    db.add(target)

    measures = [
        ReductionMeasure(
            submission_id=sub.id,
            supplier_id=supplier.id,
            measure_name="Elektrifikation der Produktionsanlage Göteborg",
            affected_scope=AffectedScope.scope_1,
            status=MeasureStatus.in_progress,
            implementation_year=2025,
            expected_savings_tco2e=540.0,
            capex_eur=1200000.0,
            relevant_to_our_supply=RelevanceToSupply.yes,
        ),
        ReductionMeasure(
            submission_id=sub.id,
            supplier_id=supplier.id,
            measure_name="Lieferantenprogramm für Recycling-Rohmaterial",
            affected_scope=AffectedScope.scope_3,
            status=MeasureStatus.planned,
            implementation_year=2026,
            expected_savings_tco2e=280.0,
            capex_eur=50000.0,
            relevant_to_our_supply=RelevanceToSupply.yes,
        ),
        ReductionMeasure(
            submission_id=sub.id,
            supplier_id=supplier.id,
            measure_name="Optimierung Transportlogistik (Seefracht statt Luftfracht)",
            affected_scope=AffectedScope.scope_3,
            status=MeasureStatus.implemented,
            implementation_year=2023,
            expected_savings_tco2e=95.0,
            capex_eur=0.0,
            relevant_to_our_supply=RelevanceToSupply.partially,
        ),
    ]
    for m in measures:
        db.add(m)

    await db.flush()
