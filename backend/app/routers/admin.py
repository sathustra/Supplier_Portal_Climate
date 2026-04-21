import csv
import io
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.pcf_record import PCFRecord
from app.models.reduction_measure import ReductionMeasure
from app.models.reduction_target import ReductionTarget
from app.models.submission import SubmissionPeriod, SubmissionStatus
from app.models.supplier import Supplier
from app.routers.auth import get_admin_supplier
from app.schemas.submission import AdminSubmissionDetail, ReviewRequest, SubmissionDetail

router = APIRouter(prefix="/api/admin", tags=["admin"])

from app.schemas.pcf_record import PCFRecordOut
from app.schemas.reduction_target import ReductionTargetOut
from app.schemas.reduction_measure import ReductionMeasureOut


@router.get("/submissions", response_model=list[AdminSubmissionDetail])
async def admin_list_submissions(
    status_filter: SubmissionStatus | None = Query(None, alias="status"),
    admin: Supplier = Depends(get_admin_supplier),
    db: AsyncSession = Depends(get_db),
) -> list[AdminSubmissionDetail]:
    query = select(SubmissionPeriod, Supplier).join(Supplier, SubmissionPeriod.supplier_id == Supplier.id)
    if status_filter:
        query = query.where(SubmissionPeriod.status == status_filter)
    query = query.order_by(SubmissionPeriod.created_at.desc())

    result = await db.execute(query)
    rows = result.all()

    out = []
    for sub, supplier in rows:
        detail = AdminSubmissionDetail.model_validate(sub)
        detail.supplier_company_name = supplier.company_name
        detail.supplier_contact_email = supplier.contact_email
        detail.supplier_country = supplier.country
        out.append(detail)
    return out


@router.get("/submissions/{submission_id}", response_model=AdminSubmissionDetail)
async def admin_get_submission(
    submission_id: uuid.UUID,
    admin: Supplier = Depends(get_admin_supplier),
    db: AsyncSession = Depends(get_db),
) -> AdminSubmissionDetail:
    result = await db.execute(
        select(SubmissionPeriod, Supplier)
        .join(Supplier, SubmissionPeriod.supplier_id == Supplier.id)
        .where(SubmissionPeriod.id == submission_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    sub, supplier = row
    detail = AdminSubmissionDetail.model_validate(sub)
    detail.supplier_company_name = supplier.company_name
    detail.supplier_contact_email = supplier.contact_email
    detail.supplier_country = supplier.country

    pcf_result = await db.execute(select(PCFRecord).where(PCFRecord.submission_id == sub.id))
    detail.pcf_count = len(pcf_result.scalars().all())

    measures_result = await db.execute(
        select(ReductionMeasure).where(ReductionMeasure.submission_id == sub.id)
    )
    detail.measures_count = len(measures_result.scalars().all())

    target_result = await db.execute(
        select(ReductionTarget).where(ReductionTarget.submission_id == sub.id)
    )
    detail.has_target = target_result.scalar_one_or_none() is not None
    return detail


@router.get("/submissions/{submission_id}/pcf-records", response_model=list[PCFRecordOut])
async def admin_list_pcf_records(
    submission_id: uuid.UUID,
    admin: Supplier = Depends(get_admin_supplier),
    db: AsyncSession = Depends(get_db),
) -> list[PCFRecordOut]:
    result = await db.execute(select(PCFRecord).where(PCFRecord.submission_id == submission_id))
    return [PCFRecordOut.model_validate(r) for r in result.scalars().all()]


@router.get("/submissions/{submission_id}/reduction-target", response_model=ReductionTargetOut)
async def admin_get_reduction_target(
    submission_id: uuid.UUID,
    admin: Supplier = Depends(get_admin_supplier),
    db: AsyncSession = Depends(get_db),
) -> ReductionTargetOut:
    result = await db.execute(select(ReductionTarget).where(ReductionTarget.submission_id == submission_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reduction target not found")
    return ReductionTargetOut.model_validate(target)


@router.get("/submissions/{submission_id}/measures", response_model=list[ReductionMeasureOut])
async def admin_list_measures(
    submission_id: uuid.UUID,
    admin: Supplier = Depends(get_admin_supplier),
    db: AsyncSession = Depends(get_db),
) -> list[ReductionMeasureOut]:
    result = await db.execute(select(ReductionMeasure).where(ReductionMeasure.submission_id == submission_id))
    return [ReductionMeasureOut.model_validate(m) for m in result.scalars().all()]


@router.patch("/submissions/{submission_id}/review", response_model=SubmissionDetail)
async def review_submission(
    submission_id: uuid.UUID,
    body: ReviewRequest,
    admin: Supplier = Depends(get_admin_supplier),
    db: AsyncSession = Depends(get_db),
) -> SubmissionDetail:
    result = await db.execute(select(SubmissionPeriod).where(SubmissionPeriod.id == submission_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    sub.status = body.status
    sub.reviewer_comment = body.comment
    sub.reviewed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(sub)
    return SubmissionDetail.model_validate(sub)


@router.get("/export/pcf")
async def export_pcf_csv(
    year: int | None = Query(None),
    status_filter: SubmissionStatus | None = Query(None, alias="status"),
    admin: Supplier = Depends(get_admin_supplier),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    query = (
        select(PCFRecord, SubmissionPeriod, Supplier)
        .join(SubmissionPeriod, PCFRecord.submission_id == SubmissionPeriod.id)
        .join(Supplier, PCFRecord.supplier_id == Supplier.id)
    )
    if year:
        query = query.where(SubmissionPeriod.reporting_year == year)
    if status_filter:
        query = query.where(SubmissionPeriod.status == status_filter)

    result = await db.execute(query)
    rows = result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "supplier", "country", "reporting_year", "status",
        "article_number", "product_name", "pcf_total", "functional_unit",
        "system_boundary", "methodology", "calculation_year", "externally_verified",
        "primary_data_share", "recycled_content_share", "bio_based_share",
        "raw_material_emissions", "production_energy_emissions",
        "upstream_transport_emissions", "packaging_emissions", "other_emissions",
    ])
    for pcf, sub, supplier in rows:
        writer.writerow([
            supplier.company_name, supplier.country, sub.reporting_year, sub.status.value,
            pcf.article_number, pcf.product_name, pcf.pcf_total, pcf.functional_unit,
            pcf.system_boundary.value, pcf.methodology.value, pcf.calculation_year, pcf.externally_verified,
            pcf.primary_data_share, pcf.recycled_content_share, pcf.bio_based_share,
            pcf.raw_material_emissions, pcf.production_energy_emissions,
            pcf.upstream_transport_emissions, pcf.packaging_emissions, pcf.other_emissions,
        ])

    output.seek(0)
    filename = f"pcf_export_{year or 'all'}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/measures")
async def export_measures_csv(
    year: int | None = Query(None),
    admin: Supplier = Depends(get_admin_supplier),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    query = (
        select(ReductionMeasure, SubmissionPeriod, Supplier)
        .join(SubmissionPeriod, ReductionMeasure.submission_id == SubmissionPeriod.id)
        .join(Supplier, ReductionMeasure.supplier_id == Supplier.id)
    )
    if year:
        query = query.where(SubmissionPeriod.reporting_year == year)

    result = await db.execute(query)
    rows = result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "supplier", "country", "reporting_year", "submission_status",
        "measure_name", "affected_scope", "status", "implementation_year",
        "expected_savings_tco2e", "capex_eur", "relevant_to_our_supply", "remarks",
    ])
    for measure, sub, supplier in rows:
        writer.writerow([
            supplier.company_name, supplier.country, sub.reporting_year, sub.status.value,
            measure.measure_name, measure.affected_scope.value, measure.status.value,
            measure.implementation_year, measure.expected_savings_tco2e,
            measure.capex_eur, measure.relevant_to_our_supply.value, measure.remarks,
        ])

    output.seek(0)
    filename = f"measures_export_{year or 'all'}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
