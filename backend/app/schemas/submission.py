import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator

from app.models.submission import SubmissionStatus

CURRENT_YEAR = 2026


class SubmissionCreate(BaseModel):
    reporting_year: int

    @field_validator("reporting_year")
    @classmethod
    def validate_year(cls, v: int) -> int:
        if v < 2020 or v > CURRENT_YEAR:
            raise ValueError(f"reporting_year must be between 2020 and {CURRENT_YEAR}")
        return v


class SubmissionOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    supplier_id: uuid.UUID
    reporting_year: int
    status: SubmissionStatus
    submitted_at: datetime | None
    reviewed_at: datetime | None
    reviewer_comment: str | None
    created_at: datetime
    updated_at: datetime | None


class SubmissionDetail(SubmissionOut):
    pcf_count: int = 0
    measures_count: int = 0
    has_target: bool = False


class ReviewRequest(BaseModel):
    status: SubmissionStatus
    comment: str | None = None

    @field_validator("status")
    @classmethod
    def validate_review_status(cls, v: SubmissionStatus) -> SubmissionStatus:
        if v not in (SubmissionStatus.approved, SubmissionStatus.rejected):
            raise ValueError("status must be 'approved' or 'rejected'")
        return v


class AdminSubmissionDetail(SubmissionDetail):
    supplier_company_name: str = ""
    supplier_contact_email: str = ""
    supplier_country: str = ""
