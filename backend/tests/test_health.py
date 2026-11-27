import pytest


@pytest.mark.asyncio
async def test_liveness_probe(client):
    res = await client.get("/health/live")
    assert res.status_code == 200
    assert res.json() == {"status": "alive"}
    assert "X-Request-ID" in res.headers
    assert "X-Response-Time-Ms" in res.headers


@pytest.mark.asyncio
async def test_readiness_probe(client):
    res = await client.get("/health/ready")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"
    assert data["region"] == "ap-south-1"


@pytest.mark.asyncio
async def test_generic_health(client):
    res = await client.get("/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Shushi"
