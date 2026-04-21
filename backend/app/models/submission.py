import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SubmissionStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"


class SubmissionPeriod(Base):
    __tablename__ = "submission_periods"
    __table_args__ = (UniqueConstraint("supplier_id", "reporting_year", name="uq_supplier_year"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supplier_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False)
    reporting_year: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus, name="submissionstatus"), default=SubmissionStatus.draft, nullable=False
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewer_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    supplier: Mapped["Supplier"] = relationship("Supplier", back_populates="submissions")
    pcf_records: Mapped[list["PCFRecord"]] = relationship(
        "PCFRecord", back_populates="submission", cascade="all, delete-orphan"
    )
    reduction_target: Mapped["ReductionTarget | None"] = relationship(
        "ReductionTarget", back_populates="submission", cascade="all, delete-orphan", uselist=False
    )
    reduction_measures: Mapped[list["ReductionMeasure"]] = relationship(
        "ReductionMeasure", back_populates="submission", cascade="all, delete-orphan"
    )
