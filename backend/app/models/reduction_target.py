import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SBTiStatus(str, enum.Enum):
    none = "none"
    committed = "committed"
    validated_near_term = "validated_near_term"
    validated_net_zero = "validated_net_zero"


class ReductionTarget(Base):
    __tablename__ = "reduction_targets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("submission_periods.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    supplier_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False)
    has_climate_target: Mapped[bool] = mapped_column(Boolean, nullable=False)
    sbti_status: Mapped[SBTiStatus] = mapped_column(
        Enum(SBTiStatus, name="sbtistatus"), default=SBTiStatus.none, nullable=False
    )
    base_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    near_term_target_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    scope_1_2_reduction_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    scope_3_reduction_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    net_zero_target_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    net_zero_reduction_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    internal_carbon_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    cdp_participation: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    cdp_score: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    submission: Mapped["SubmissionPeriod"] = relationship("SubmissionPeriod", back_populates="reduction_target")
