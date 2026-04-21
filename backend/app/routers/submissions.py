import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.pcf_record import PCFRecord
from app.models.reduction_measure import ReductionMeasure
from app.models.reduction_target import ReductionTarget
from app.models.submission import SubmissionPeriod, SubmissionStatus
from app.models.supplier import Supplier
from app.routers.auth import get_current_supplier
from app.schemas.submission import SubmissionCreate, SubmissionDetail, SubmissionOut

router = APIRouter(prefix="/api/submissions", tags=["submissions"])


async def _get_submission_or_404(
    submission_id: uuid.UUID, supplier: Supplier, db: AsyncSession
) -> SubmissionPeriod:
    result = await db.execute(
        select(SubmissionPeriod).where(
            SubmissionPeriod.id == submission_id,
            SubmissionPeriod.supplier_id == supplier.id,
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    return sub


async def _enrich_detail(sub: SubmissionPeriod, db: AsyncSession) -> SubmissionDetail:
    pcf_count_result = await db.execute(
        select(func.count()).where(PCFRecord.submission_id == sub.id)
    )
    pcf_count = pcf_count_result.scalar() or 0

    measures_count_result = await db.execute(
        select(func.count()).where(ReductionMeasure.submission_id == sub.id)
    )
    measures_count = measures_count_result.scalar() or 0

    target_result = await db.execute(
        select(ReductionTarget).where(ReductionTarget.submission_id == sub.id)
    )
    has_target = target_result.scalar_one_or_none() is not None

    detail = SubmissionDetail.model_validate(sub)
    detail.pcf_count = pcf_count
    detail.measures_count = measures_count
    detail.has_target = has_target
    return detail


@router.post("", response_model=SubmissionOut, status_code=status.HTTP_201_CREATED)
async def create_submission(
    body: SubmissionCreate,
    supplier: Supplier = Depends(get_current_supplier),
    db: AsyncSession = Depends(get_db),
) -> SubmissionOut:
    existing = await db.execute(
        select(SubmissionPeriod).where(
            SubmissionPeriod.supplier_id == supplier.id,
            SubmissionPeriod.reporting_year == body.reporting_year,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Submission for this year already exists")

    sub = SubmissionPeriod(supplier_id=supplier.id, reporting_year=body.reporting_year)
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return SubmissionOut.model_validate(sub)


@router.get("", response_model=list[SubmissionOut])
async def list_submissions(
    supplier: Supplier = Depends(get_current_supplier),
    db: AsyncSession = Depends(get_db),
) -> list[SubmissionOut]:
    result = await db.execute(
        select(SubmissionPeriod)
        .where(SubmissionPeriod.supplier_id == supplier.id)
        .order_by(SubmissionPeriod.reporting_year.desc())
    )
    return [SubmissionOut.model_validate(s) for s in result.scalars().all()]


@router.get("/{submission_id}", response_model=SubmissionDetail)
async def get_submission(
    submission_id: uuid.UUID,
    supplier: Supplier = Depends(get_current_supplier),
    db: AsyncSession = Depends(get_db),
) -> SubmissionDetail:
    sub = await _get_submission_or_404(submission_id, supplier, db)
    return await _enrich_detail(sub, db)


@router.patch("/{submission_id}/submit", response_model=SubmissionOut)
async def submit_submission(
    submission_id: uuid.UUID,
    supplier: Supplier = Depends(get_current_supplier),
    db: AsyncSession = Depends(get_db),
) -> SubmissionOut:
    sub = await _get_submission_or_404(submission_id, supplier, db)

    if sub.status != SubmissionStatus.draft:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only draft submissions can be submitted")

    pcf_count_result = await db.execute(
        select(func.count()).where(PCFRecord.submission_id == sub.id)
    )
    if (pcf_count_result.scalar() or 0) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one PCF record is required before submitting",
        )

    sub.status = SubmissionStatus.submitted
    sub.submitted_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(sub)
    return SubmissionOut.model_validate(sub)
