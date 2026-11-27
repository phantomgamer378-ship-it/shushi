import pytest


@pytest.mark.asyncio
async def test_auth_me_success(client, user_a_id, user_a_token):
    headers = {"Authorization": f"Bearer {user_a_token}"}
    res = await client.get("/v1/auth/me", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == str(user_a_id)
    assert data["email"] == "user_a@eventflow.io"
    assert data["role"] == "authenticated"


@pytest.mark.asyncio
async def test_auth_me_missing_token(client):
    res = await client.get("/v1/auth/me")
    assert res.status_code == 401
    data = res.json()
    assert data["code"] == "MISSING_CREDENTIALS"


@pytest.mark.asyncio
async def test_auth_me_expired_token(client, expired_token):
    headers = {"Authorization": f"Bearer {expired_token}"}
    res = await client.get("/v1/auth/me", headers=headers)
    assert res.status_code == 401
    data = res.json()
    assert data["code"] == "TOKEN_EXPIRED"


@pytest.mark.asyncio
async def test_auth_me_invalid_signature(client, invalid_sig_token):
    headers = {"Authorization": f"Bearer {invalid_sig_token}"}
    res = await client.get("/v1/auth/me", headers=headers)
    assert res.status_code == 401
    data = res.json()
    assert data["code"] == "INVALID_TOKEN"
