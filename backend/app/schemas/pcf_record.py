import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator, model_validator

from app.models.pcf_record import AllocationMethod, Methodology, SystemBoundary

CURRENT_YEAR = 2026


class PCFRecordCreate(BaseModel):
    article_number: str
    product_name: str
    pcf_total: float
    functional_unit: str
    system_boundary: SystemBoundary
    methodology: Methodology
    primary_data_share: float | None = None
    biogenic_emissions: float | None = None
    raw_material_emissions: float | None = None
    production_energy_emissions: float | None = None
    upstream_transport_emissions: float | None = None
    packaging_emissions: float | None = None
    other_emissions: float | None = None
    recycled_content_share: float | None = None
    bio_based_share: float | None = None
    allocation_method: AllocationMethod | None = None
    calculation_year: int
    externally_verified: bool = False
    verification_standard: str | None = None
    remarks: str | None = None

    @field_validator("pcf_total")
    @classmethod
    def pcf_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("pcf_total must be >= 0")
        return v

    @field_validator("primary_data_share", "recycled_content_share", "bio_based_share")
    @classmethod
    def validate_percentage(cls, v: float | None) -> float | None:
        if v is not None and not (0 <= v <= 100):
            raise ValueError("Percentage fields must be between 0 and 100")
        return v

    @field_validator("calculation_year")
    @classmethod
    def validate_calc_year(cls, v: int) -> int:
        if v < 2020 or v > CURRENT_YEAR:
            raise ValueError(f"calculation_year must be between 2020 and {CURRENT_YEAR}")
        return v


class PCFRecordUpdate(PCFRecordCreate):
    pass


class PCFRecordOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    submission_id: uuid.UUID
    supplier_id: uuid.UUID
    article_number: str
    product_name: str
    pcf_total: float
    functional_unit: str
    system_boundary: SystemBoundary
    methodology: Methodology
    primary_data_share: float | None
    biogenic_emissions: float | None
    raw_material_emissions: float | None
    production_energy_emissions: float | None
    upstream_transport_emissions: float | None
    packaging_emissions: float | None
    other_emissions: float | None
    recycled_content_share: float | None
    bio_based_share: float | None
    allocation_method: AllocationMethod | None
    calculation_year: int
    externally_verified: bool
    verification_standard: str | None
    remarks: str | None
    created_at: datetime
    updated_at: datetime | None
    warnings: list[str] = []


def compute_pcf_warnings(record: "PCFRecordCreate | PCFRecordUpdate", pcf_total: float) -> list[str]:
    fields = [
        record.raw_material_emissions,
        record.production_energy_emissions,
        record.upstream_transport_emissions,
        record.packaging_emissions,
        record.other_emissions,
    ]
    if all(f is not None for f in fields):
        breakdown_sum = sum(fields)  # type: ignore[arg-type]
        if pcf_total > 0 and abs(breakdown_sum - pcf_total) / pcf_total > 0.20:
            return ["Aufschlüsselung weicht >20% von PCF gesamt ab"]
    return []
