import uuid
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.core.database import AsyncSessionLocal
from app.core.security import create_test_jwt


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Asynchronous HTTP test client bound to the test event loop."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provides an isolated async database session for tests."""
    async with AsyncSessionLocal() as session:
        yield session


@pytest.fixture
def user_a_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def user_b_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def user_a_token(user_a_id: uuid.UUID) -> str:
    return create_test_jwt(user_id=user_a_id, email="user_a@eventflow.io")


@pytest.fixture
def user_b_token(user_b_id: uuid.UUID) -> str:
    return create_test_jwt(user_id=user_b_id, email="user_b@eventflow.io")


@pytest.fixture
def expired_token(user_a_id: uuid.UUID) -> str:
    return create_test_jwt(user_id=user_a_id, expires_in_seconds=-100)


@pytest.fixture
def invalid_sig_token(user_a_id: uuid.UUID) -> str:
    return create_test_jwt(user_id=user_a_id, secret="wrong-secret-key-for-testing-only")
