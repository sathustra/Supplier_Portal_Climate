from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import admin, auth, pcf_records, reduction_measures, reduction_targets, submissions


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.seed import run_seed
    await run_seed()
    yield


app = FastAPI(
    title="Supplier PCF Portal API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(submissions.router)
app.include_router(pcf_records.router)
app.include_router(reduction_targets.router)
app.include_router(reduction_measures.router)
app.include_router(admin.router)


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok"}
