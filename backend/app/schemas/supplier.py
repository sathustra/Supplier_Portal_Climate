import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class SupplierRegister(BaseModel):
    company_name: str
    contact_name: str
    contact_email: EmailStr
    password: str
    country: str


class SupplierOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    company_name: str
    country: str
    duns_number: str | None
    contact_name: str
    contact_email: str
    is_admin: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
