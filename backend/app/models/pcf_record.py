import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SystemBoundary(str, enum.Enum):
    cradle_to_gate = "cradle_to_gate"
    cradle_to_grave = "cradle_to_grave"
    gate_to_gate = "gate_to_gate"


class Methodology(str, enum.Enum):
    iso_14067 = "iso_14067"
    ghg_product = "ghg_product"
    pact_pathfinder = "pact_pathfinder"
    pef = "pef"
    other = "other"


class AllocationMethod(str, enum.Enum):
    mass = "mass"
    economic = "economic"
    energy = "energy"
    system_expansion = "system_expansion"
    none = "none"


class PCFRecord(Base):
    __tablename__ = "pcf_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("submission_periods.id", ondelete="CASCADE"), nullable=False
    )
    supplier_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False)
    article_number: Mapped[str] = mapped_column(String, nullable=False)
    product_name: Mapped[str] = mapped_column(String, nullable=False)
    pcf_total: Mapped[float] = mapped_column(Float, nullable=False)
    functional_unit: Mapped[str] = mapped_column(String, nullable=False)
    system_boundary: Mapped[SystemBoundary] = mapped_column(
        Enum(SystemBoundary, name="systemboundary"), nullable=False
    )
    methodology: Mapped[Methodology] = mapped_column(Enum(Methodology, name="methodology"), nullable=False)
    primary_data_share: Mapped[float | None] = mapped_column(Float, nullable=True)
    biogenic_emissions: Mapped[float | None] = mapped_column(Float, nullable=True)
    raw_material_emissions: Mapped[float | None] = mapped_column(Float, nullable=True)
    production_energy_emissions: Mapped[float | None] = mapped_column(Float, nullable=True)
    upstream_transport_emissions: Mapped[float | None] = mapped_column(Float, nullable=True)
    packaging_emissions: Mapped[float | None] = mapped_column(Float, nullable=True)
    other_emissions: Mapped[float | None] = mapped_column(Float, nullable=True)
    recycled_content_share: Mapped[float | None] = mapped_column(Float, nullable=True)
    bio_based_share: Mapped[float | None] = mapped_column(Float, nullable=True)
    allocation_method: Mapped[AllocationMethod | None] = mapped_column(
        Enum(AllocationMethod, name="allocationmethod"), nullable=True
    )
    calculation_year: Mapped[int] = mapped_column(Integer, nullable=False)
    externally_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_standard: Mapped[str | None] = mapped_column(String, nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    submission: Mapped["SubmissionPeriod"] = relationship("SubmissionPeriod", back_populates="pcf_records")
