import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import LoginRequest, SupplierOut, SupplierRegister, TokenResponse
from app.services.auth import create_access_token, decode_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])
bearer = HTTPBearer()


async def get_current_supplier(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> Supplier:
    try:
        payload = decode_token(credentials.credentials)
        supplier_id = uuid.UUID(payload["sub"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Supplier not found")
    return supplier


async def get_admin_supplier(supplier: Supplier = Depends(get_current_supplier)) -> Supplier:
    if not supplier.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return supplier


@router.post("/register", response_model=SupplierOut, status_code=status.HTTP_201_CREATED)
async def register(body: SupplierRegister, db: AsyncSession = Depends(get_db)) -> Supplier:
    existing = await db.execute(select(Supplier).where(Supplier.contact_email == body.contact_email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    supplier = Supplier(
        company_name=body.company_name,
        country=body.country,
        contact_name=body.contact_name,
        contact_email=body.contact_email,
        password_hash=hash_password(body.password),
    )
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return supplier


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(select(Supplier).where(Supplier.contact_email == body.email))
    supplier = result.scalar_one_or_none()
    if not supplier or not verify_password(body.password, supplier.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(supplier.id, supplier.is_admin)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=SupplierOut)
async def me(supplier: Supplier = Depends(get_current_supplier)) -> Supplier:
    return supplier
