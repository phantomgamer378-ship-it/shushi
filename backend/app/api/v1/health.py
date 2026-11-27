from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_db_session

router = APIRouter(tags=["System"])


@router.get("/health/live")
@router.get("/v1/health/live")
async def liveness_probe():
    """Kubernetes / Render liveness probe verifying process responsiveness."""
    return {"status": "alive"}


@router.get("/health/ready")
@router.get("/v1/health/ready")
async def readiness_probe(
    response: Response,
    db: AsyncSession = Depends(get_db_session),
):
    """Readiness probe checking database connectivity to Supabase pooler."""
    try:
        await db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "region": settings.SUPABASE_REGION,
        }
    except Exception as e:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "not_ready",
            "database": "disconnected",
            "error": str(e),
        }


@router.get("/v1/health")
async def generic_health():
    """General heartbeat summary."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "region": settings.SUPABASE_REGION,
    }
