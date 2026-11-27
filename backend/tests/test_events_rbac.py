import uuid
import pytest
from datetime import datetime, timezone, timedelta


@pytest.mark.asyncio
async def test_event_lifecycle_and_rbac(client, user_a_id, user_a_token, user_b_id, user_b_token):
    unique_slug = f"mumbai-summit-{uuid.uuid4().hex[:8]}"
    start = datetime.now(timezone.utc) + timedelta(days=10)
    end = start + timedelta(hours=8)

    payload = {
        "slug": unique_slug,
        "title": "Mumbai Summit",
        "description": "Tech conference in Mumbai",
        "venue_name": "Jio World BKC",
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "timezone": "Asia/Kolkata",
        "max_capacity": 200,
    }

    # 1. Unauthenticated creation fails
    res_unauth = await client.post("/v1/events", json=payload)
    assert res_unauth.status_code == 401

    # 2. User A creates event
    headers_a = {"Authorization": f"Bearer {user_a_token}"}
    res_create = await client.post("/v1/events", json=payload, headers=headers_a)
    assert res_create.status_code == 201
    event_data = res_create.json()
    event_id = event_data["id"]
    assert event_data["slug"] == unique_slug
    assert event_data["status"] == "DRAFT"

    # 3. Duplicate slug fails with 409 Conflict
    res_dup = await client.post("/v1/events", json=payload, headers=headers_a)
    assert res_dup.status_code == 409
    assert res_dup.json()["code"] == "SLUG_ALREADY_EXISTS"

    # 4. User A (Owner) reads event details -> 200 OK
    res_get_a = await client.get(f"/v1/events/{event_id}", headers=headers_a)
    assert res_get_a.status_code == 200
    assert res_get_a.json()["id"] == event_id

    # 5. User B (Cross-event non-member) attempts to access User A's event -> 403 Forbidden!
    headers_b = {"Authorization": f"Bearer {user_b_token}"}
    res_get_b = await client.get(f"/v1/events/{event_id}", headers=headers_b)
    assert res_get_b.status_code == 403
    assert res_get_b.json()["code"] == "ACCESS_DENIED_EVENT"

    # 6. User A lists events -> includes the created event
    res_list_a = await client.get("/v1/events", headers=headers_a)
    assert res_list_a.status_code == 200
    slugs_a = [e["slug"] for e in res_list_a.json()]
    assert unique_slug in slugs_a

    # 7. User B lists events -> does NOT include User A's event
    res_list_b = await client.get("/v1/events", headers=headers_b)
    assert res_list_b.status_code == 200
    slugs_b = [e["slug"] for e in res_list_b.json()]
    assert unique_slug not in slugs_b
