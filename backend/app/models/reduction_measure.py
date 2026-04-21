import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AffectedScope(str, enum.Enum):
    scope_1 = "scope_1"
    scope_2 = "scope_2"
    scope_3 = "scope_3"
    scope_1_2 = "scope_1_2"
    cross_cutting = "cross_cutting"


class MeasureStatus(str, enum.Enum):
    implemented = "implemented"
    in_progress = "in_progress"
    planned = "planned"
    under_review = "under_review"


class RelevanceToSupply(str, enum.Enum):
    yes = "yes"
    no = "no"
    partially = "partially"


class ReductionMeasure(Base):
    __tablename__ = "reduction_measures"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("submission_periods.id", ondelete="CASCADE"), nullable=False
    )
    supplier_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False)
    measure_name: Mapped[str] = mapped_column(String, nullable=False)
    affected_scope: Mapped[AffectedScope] = mapped_column(
        Enum(AffectedScope, name="affectedscope"), nullable=False
    )
    status: Mapped[MeasureStatus] = mapped_column(Enum(MeasureStatus, name="measurestatus"), nullable=False)
    implementation_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expected_savings_tco2e: Mapped[float | None] = mapped_column(Float, nullable=True)
    capex_eur: Mapped[float | None] = mapped_column(Float, nullable=True)
    relevant_to_our_supply: Mapped[RelevanceToSupply] = mapped_column(
        Enum(RelevanceToSupply, name="relevancetosupply"), default=RelevanceToSupply.partially, nullable=False
    )
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    submission: Mapped["SubmissionPeriod"] = relationship("SubmissionPeriod", back_populates="reduction_measures")
