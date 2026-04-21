import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.reduction_target import ReductionTarget
from app.models.submission import SubmissionPeriod
from app.models.supplier import Supplier
from app.routers.auth import get_current_supplier
from app.schemas.reduction_target import ReductionTargetOut, ReductionTargetUpsert

router = APIRouter(tags=["reduction-targets"])


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


@router.put("/api/submissions/{submission_id}/reduction-target", response_model=ReductionTargetOut)
async def upsert_reduction_target(
    submission_id: uuid.UUID,
    body: ReductionTargetUpsert,
    supplier: Supplier = Depends(get_current_supplier),
    db: AsyncSession = Depends(get_db),
) -> ReductionTargetOut:
    await _get_submission_or_404(submission_id, supplier, db)

    result = await db.execute(
        select(ReductionTarget).where(ReductionTarget.submission_id == submission_id)
    )
    target = result.scalar_one_or_none()

    if target:
        for field, value in body.model_dump().items():
            setattr(target, field, value)
    else:
        target = ReductionTarget(
            submission_id=submission_id,
            supplier_id=supplier.id,
            **body.model_dump(),
        )
        db.add(target)

    await db.commit()
    await db.refresh(target)
    return ReductionTargetOut.model_validate(target)


@router.get("/api/submissions/{submission_id}/reduction-target", response_model=ReductionTargetOut)
async def get_reduction_target(
    submission_id: uuid.UUID,
    supplier: Supplier = Depends(get_current_supplier),
    db: AsyncSession = Depends(get_db),
) -> ReductionTargetOut:
    await _get_submission_or_404(submission_id, supplier, db)

    result = await db.execute(
        select(ReductionTarget).where(ReductionTarget.submission_id == submission_id)
    )
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reduction target not found")
    return ReductionTargetOut.model_validate(target)
