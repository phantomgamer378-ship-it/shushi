import logging
from typing import AsyncGenerator
from contextlib import asynccontextmanager
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import declarative_base
from app.core.config import settings

logger = logging.getLogger("eventflow.database")

Base = declarative_base()

# Configure AsyncEngine with Supavisor Transaction Pooler compatibility
# Uses unnamed prepared statements (lambda: "") and statement_cache_size=0
engine_kwargs = {
    "echo": (settings.ENVIRONMENT == "development_debug"),
    "connect_args": {
        "ssl": "require",
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "prepared_statement_name_func": lambda: "",
    },
}

if settings.ENVIRONMENT == "test":
    engine_kwargs["poolclass"] = pool.NullPool
else:
    engine_kwargs.update({
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
        "pool_recycle": settings.DB_POOL_RECYCLE,
        "pool_pre_ping": settings.DB_PRE_PING,
    })

engine: AsyncEngine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

# Async sessionmaker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency for database session with automatic lifecycle cleanup."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error("Database session rolled back due to error: %s", str(e))
            raise
        finally:
            await session.close()


@asynccontextmanager
async def transaction_scope() -> AsyncGenerator[AsyncSession, None]:
    """Reusable async transaction boundary context manager."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            try:
                yield session
            except Exception as e:
                await session.rollback()
                logger.error("Transaction rolled back: %s", str(e))
                raise
