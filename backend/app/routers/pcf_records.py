import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.pcf_record import PCFRecord
from app.models.submission import SubmissionPeriod, SubmissionStatus
from app.models.supplier import Supplier
from app.routers.auth import get_current_supplier
from app.schemas.pcf_record import PCFRecordCreate, PCFRecordOut, PCFRecordUpdate, compute_pcf_warnings

router = APIRouter(tags=["pcf-records"])


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


async def _get_pcf_or_404(pcf_id: uuid.UUID, supplier: Supplier, db: AsyncSession) -> PCFRecord:
    result = await db.execute(
        select(PCFRecord).where(PCFRecord.id == pcf_id, PCFRecord.supplier_id == supplier.id)
    )
    pcf = result.scalar_one_or_none()
    if not pcf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PCF record not found")
    return pcf


def _record_to_out(record: PCFRecord, warnings: list[str]) -> PCFRecordOut:
    out = PCFRecordOut.model_validate(record)
    out.warnings = warnings
    return out


@router.post("/api/submissions/{submission_id}/pcf-records", response_model=PCFRecordOut, status_code=201)
async def create_pcf_record(
    submission_id: uuid.UUID,
    body: PCFRecordCreate,
    supplier: Supplier = Depends(get_current_supplier),
    db: AsyncSession = Depends(get_db),
) -> PCFRecordOut:
    sub = await _get_submission_or_404(submission_id, supplier, db)
    if sub.status != SubmissionStatus.draft:
        raise HTTPException(status_code=400, detail="Can only add PCF records to draft submissions")

    warnings = compute_pcf_warnings(body, body.pcf_total)
    record = PCFRecord(submission_id=sub.id, supplier_id=supplier.id, **body.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return _record_to_out(record, warnings)


@router.get("/api/submissions/{submission_id}/pcf-records", response_model=list[PCFRecordOut])
async def list_pcf_records(
    submission_id: uuid.UUID,
    supplier: Supplier = Depends(get_current_supplier),
    db: AsyncSession = Depends(get_db),
) -> list[PCFRecordOut]:
    await _get_submission_or_404(submission_id, supplier, db)
    result = await db.execute(
        select(PCFRecord).where(PCFRecord.submission_id == submission_id, PCFRecord.supplier_id == supplier.id)
    )
    return [_record_to_out(r, []) for r in result.scalars().all()]


@router.put("/api/pcf-records/{pcf_id}", response_model=PCFRecordOut)
async def update_pcf_record(
    pcf_id: uuid.UUID,
    body: PCFRecordUpdate,
    supplier: Supplier = Depends(get_current_supplier),
    db: AsyncSession = Depends(get_db),
) -> PCFRecordOut:
    record = await _get_pcf_or_404(pcf_id, supplier, db)

    sub_result = await db.execute(select(SubmissionPeriod).where(SubmissionPeriod.id == record.submission_id))
    sub = sub_result.scalar_one()
    if sub.status != SubmissionStatus.draft:
        raise HTTPException(status_code=400, detail="Can only edit PCF records in draft submissions")

    for field, value in body.model_dump().items():
        setattr(record, field, value)

    await db.commit()
    await db.refresh(record)
    warnings = compute_pcf_warnings(body, body.pcf_total)
    return _record_to_out(record, warnings)


@router.delete("/api/pcf-records/{pcf_id}", status_code=204)
async def delete_pcf_record(
    pcf_id: uuid.UUID,
    supplier: Supplier = Depends(get_current_supplier),
    db: AsyncSession = Depends(get_db),
) -> None:
    record = await _get_pcf_or_404(pcf_id, supplier, db)

    sub_result = await db.execute(select(SubmissionPeriod).where(SubmissionPeriod.id == record.submission_id))
    sub = sub_result.scalar_one()
    if sub.status != SubmissionStatus.draft:
        raise HTTPException(status_code=400, detail="Can only delete PCF records from draft submissions")

    await db.delete(record)
    await db.commit()
