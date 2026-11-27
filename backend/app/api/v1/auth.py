import uuid
from fastapi import APIRouter, Depends
from app.core.security import AuthUser, get_current_user, create_test_jwt

router = APIRouter(prefix="/auth", tags=["Authentication"])

DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@router.post("/demo-session")
async def create_demo_session():
    """Generates an immediate cryptographically valid session token for zero-friction demo access."""
    token = create_test_jwt(
        user_id=DEMO_USER_ID,
        email="organizer@shushi.io",
        expires_in_seconds=86400 * 7,
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(DEMO_USER_ID),
            "email": "organizer@shushi.io",
            "role": "authenticated",
        },
    }


@router.get("/me")
async def get_current_user_profile(
    current_user: AuthUser = Depends(get_current_user),
):
    """Returns authenticated staff profile claims extracted from verified Supabase JWT."""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role,
        "app_metadata": current_user.app_metadata,
        "user_metadata": current_user.user_metadata,
    }

