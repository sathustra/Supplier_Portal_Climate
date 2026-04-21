import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.reduction_measure import ReductionMeasure
from app.models.submission import SubmissionPeriod, SubmissionStatus
from app.models.supplier import Supplier
from app.routers.auth import get_current_supplier
from app.schemas.reduction_measure import ReductionMeasureCreate, ReductionMeasureOut, ReductionMeasureUpdate

router = APIRouter(tags=["reduction-measures"])


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


async def _get_measure_or_404(
    measure_id: uuid.UUID, supplier: Supplier, db: AsyncSession
) -> ReductionMeasure:
    result = await db.execute(
        select(ReductionMeasure).where(
            ReductionMeasure.id == measure_id,
            ReductionMeasure.supplier_id == supplier.id,
        )
    )
    measure = result.scalar_one_or_none()
    if not measure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Measure not found")
    return measure


@router.post("/api/submissions/{submission_id}/measures", response_model=ReductionMeasureOut, status_code=201)
async def create_measure(
    submission_id: uuid.UUID,
    body: ReductionMeasureCreate,
    supplier: Supplier = Depends(get_current_supplier),
    db: AsyncSession = Depends(get_db),
) -> ReductionMeasureOut:
    sub = await _get_submission_or_404(submission_id, supplier, db)
    if sub.status != SubmissionStatus.draft:
        raise HTTPException(status_code=400, detail="Can only add measures to draft submissions")

    measure = ReductionMeasure(submission_id=sub.id, supplier_id=supplier.id, **body.model_dump())
    db.add(measure)
    await db.commit()
    await db.refresh(measure)
    return ReductionMeasureOut.model_validate(measure)


@router.get("/api/submissions/{submission_id}/measures", response_model=list[ReductionMeasureOut])
async def list_measures(
    submission_id: uuid.UUID,
    supplier: Supplier = Depends(get_current_supplier),
    db: AsyncSession = Depends(get_db),
) -> list[ReductionMeasureOut]:
    await _get_submission_or_404(submission_id, supplier, db)
    result = await db.execute(
        select(ReductionMeasure).where(
            ReductionMeasure.submission_id == submission_id,
            ReductionMeasure.supplier_id == supplier.id,
        )
    )
    return [ReductionMeasureOut.model_validate(m) for m in result.scalars().all()]


@router.put("/api/measures/{measure_id}", response_model=ReductionMeasureOut)
async def update_measure(
    measure_id: uuid.UUID,
    body: ReductionMeasureUpdate,
    supplier: Supplier = Depends(get_current_supplier),
    db: AsyncSession = Depends(get_db),
) -> ReductionMeasureOut:
    measure = await _get_measure_or_404(measure_id, supplier, db)

    sub_result = await db.execute(
        select(SubmissionPeriod).where(SubmissionPeriod.id == measure.submission_id)
    )
    sub = sub_result.scalar_one()
    if sub.status != SubmissionStatus.draft:
        raise HTTPException(status_code=400, detail="Can only edit measures in draft submissions")

    for field, value in body.model_dump().items():
        setattr(measure, field, value)

    await db.commit()
    await db.refresh(measure)
    return ReductionMeasureOut.model_validate(measure)


@router.delete("/api/measures/{measure_id}", status_code=204)
async def delete_measure(
    measure_id: uuid.UUID,
    supplier: Supplier = Depends(get_current_supplier),
    db: AsyncSession = Depends(get_db),
) -> None:
    measure = await _get_measure_or_404(measure_id, supplier, db)

    sub_result = await db.execute(
        select(SubmissionPeriod).where(SubmissionPeriod.id == measure.submission_id)
    )
    sub = sub_result.scalar_one()
    if sub.status != SubmissionStatus.draft:
        raise HTTPException(status_code=400, detail="Can only delete measures from draft submissions")

    await db.delete(measure)
    await db.commit()
