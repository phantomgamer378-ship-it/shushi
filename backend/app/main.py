import uuid
import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import text

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.database import engine
from app.core.exceptions import (
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.events import router as events_router
from app.api.v1.webhooks import router as webhooks_router
from app.api.v1.registrations import router as registrations_router
from app.api.v1.checkin import router as checkin_router

logger = logging.getLogger("eventflow.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan managing startup checks and clean connection pool shutdown."""
    setup_logging()
    logger.info("Initializing %s in %s mode (Region: %s)", settings.PROJECT_NAME, settings.ENVIRONMENT, settings.SUPABASE_REGION)

    # Startup connectivity verification
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    logger.info("Supabase PostgreSQL connection pool verified successfully.")

    yield

    # Clean shutdown
    logger.info("Disposing Supabase connection pool...")
    await engine.dispose()
    logger.info("Shutdown complete.")


class PureASGIRequestContextMiddleware:
    """High-performance pure ASGI middleware attaching X-Request-ID and timing headers."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        raw_req_id = headers.get(b"x-request-id")
        req_id = raw_req_id.decode() if raw_req_id else str(uuid.uuid4())
        start_time = time.perf_counter()

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                duration = (time.perf_counter() - start_time) * 1000
                res_headers = list(message.get("headers", []))
                res_headers.append((b"x-request-id", req_id.encode()))
                res_headers.append((b"x-response-time-ms", f"{duration:.2f}".encode()))
                message["headers"] = res_headers
            await send(message)

        await self.app(scope, receive, send_wrapper)


def create_app() -> FastAPI:
    app = FastAPI(
        title=f"{settings.PROJECT_NAME} API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # 1. Pure ASGI Request ID & Timing Middleware
    app.add_middleware(PureASGIRequestContextMiddleware)

    # 2. CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.FRONTEND_ORIGINS if isinstance(settings.FRONTEND_ORIGINS, list) else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 3. Centralized Exception Handlers (RFC 7807)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    # 4. Mount API Routers
    app.include_router(health_router)
    app.include_router(auth_router, prefix=settings.API_V1_STR)
    app.include_router(events_router, prefix=settings.API_V1_STR)
    app.include_router(webhooks_router, prefix=settings.API_V1_STR)
    app.include_router(registrations_router, prefix=settings.API_V1_STR)
    app.include_router(checkin_router, prefix=settings.API_V1_STR)

    return app


app = create_app()
