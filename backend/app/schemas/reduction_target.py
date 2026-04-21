import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.reduction_target import SBTiStatus


class ReductionTargetUpsert(BaseModel):
    has_climate_target: bool
    sbti_status: SBTiStatus = SBTiStatus.none
    base_year: int | None = None
    near_term_target_year: int | None = None
    scope_1_2_reduction_pct: float | None = None
    scope_3_reduction_pct: float | None = None
    net_zero_target_year: int | None = None
    net_zero_reduction_pct: float | None = None
    internal_carbon_price: float | None = None
    cdp_participation: bool = False
    cdp_score: str | None = None


class ReductionTargetOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    submission_id: uuid.UUID
    supplier_id: uuid.UUID
    has_climate_target: bool
    sbti_status: SBTiStatus
    base_year: int | None
    near_term_target_year: int | None
    scope_1_2_reduction_pct: float | None
    scope_3_reduction_pct: float | None
    net_zero_target_year: int | None
    net_zero_reduction_pct: float | None
    internal_carbon_price: float | None
    cdp_participation: bool
    cdp_score: str | None
    created_at: datetime
    updated_at: datetime | None
