from fastapi import APIRouter, Depends
from app.core.security import AuthUser, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


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

