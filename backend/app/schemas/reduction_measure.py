import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.reduction_measure import AffectedScope, MeasureStatus, RelevanceToSupply


class ReductionMeasureCreate(BaseModel):
    measure_name: str
    affected_scope: AffectedScope
    status: MeasureStatus
    implementation_year: int | None = None
    expected_savings_tco2e: float | None = None
    capex_eur: float | None = None
    relevant_to_our_supply: RelevanceToSupply = RelevanceToSupply.partially
    remarks: str | None = None


class ReductionMeasureUpdate(ReductionMeasureCreate):
    pass


class ReductionMeasureOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    submission_id: uuid.UUID
    supplier_id: uuid.UUID
    measure_name: str
    affected_scope: AffectedScope
    status: MeasureStatus
    implementation_year: int | None
    expected_savings_tco2e: float | None
    capex_eur: float | None
    relevant_to_our_supply: RelevanceToSupply
    remarks: str | None
    created_at: datetime
    updated_at: datetime | None
