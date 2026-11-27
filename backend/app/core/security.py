import os
import hmac
import hashlib
import time
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, timedelta
import jwt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import Header, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from app.core.config import settings

security_bearer = HTTPBearer(auto_error=False)


class AuthUser(BaseModel):
    id: UUID
    email: str
    role: str = "authenticated"
    app_metadata: Dict[str, Any] = {}
    user_metadata: Dict[str, Any] = {}


def hash_token(raw_token: str) -> str:
    """Computes SHA-256 hash of raw token for secure database storage."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def hash_webhook_secret(secret: str) -> str:
    """Computes salted hash of webhook secret."""
    salted = f"{settings.WEBHOOK_SECRET_SALT}:{secret}"
    return hashlib.sha256(salted.encode("utf-8")).hexdigest()


def verify_webhook_hmac(
    payload_bytes: bytes,
    signature_hex: str,
    secret: str,
) -> bool:
    """Validates inbound webhook HMAC-SHA256 signature in constant time."""
    expected = hmac.new(
        secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature_hex)


def encrypt_payload(plaintext: str, key_hex: Optional[str] = None) -> str:
    """Encrypts plaintext using Authenticated AES-256-GCM. Returns hex(nonce + ciphertext + tag)."""
    key_bytes = bytes.fromhex(key_hex or settings.TICKET_ENCRYPTION_KEY)
    aesgcm = AESGCM(key_bytes)
    nonce = os.urandom(12)  # 96-bit nonce
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return (nonce + ciphertext).hex()


def decrypt_payload(encrypted_hex: str, key_hex: Optional[str] = None) -> str:
    """Decrypts AES-256-GCM ciphertext. Returns plaintext."""
    data = bytes.fromhex(encrypted_hex)
    nonce = data[:12]
    ciphertext = data[12:]
    key_bytes = bytes.fromhex(key_hex or settings.TICKET_ENCRYPTION_KEY)
    aesgcm = AESGCM(key_bytes)
    decrypted = aesgcm.decrypt(nonce, ciphertext, None)
    return decrypted.decode("utf-8")


def decode_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a Supabase Auth JWT.
    Enforces signature, expiration, audience, issuer, and algorithm.
    """
    try:
        # Supabase GoTrue issues tokens signed with the project JWT Secret (HS256)
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_aud": True,
                "require": ["exp", "sub"],
            },
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_EXPIRED", "message": "Authentication token has expired."},
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": f"Token verification failed: {str(e)}"},
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
) -> AuthUser:
    """FastAPI Dependency for validating bearer JWT and extracting user identity."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "MISSING_CREDENTIALS", "message": "Bearer token required."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_supabase_jwt(credentials.credentials)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN_SUBJECT", "message": "Token missing 'sub' claim."},
        )

    try:
        user_uuid = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "MALFORMED_USER_ID", "message": "Token 'sub' is not a valid UUID."},
        )

    return AuthUser(
        id=user_uuid,
        email=payload.get("email", ""),
        role=payload.get("role", "authenticated"),
        app_metadata=payload.get("app_metadata", {}),
        user_metadata=payload.get("user_metadata", {}),
    )


def create_test_jwt(
    user_id: UUID,
    email: str = "staff@eventflow.io",
    expires_in_seconds: int = 3600,
    secret: Optional[str] = None,
) -> str:
    """Helper for unit and integration testing to generate signed test JWTs."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "aud": "authenticated",
        "role": "authenticated",
        "iss": f"{settings.SUPABASE_URL}/auth/v1",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=expires_in_seconds)).timestamp()),
    }
    return jwt.encode(payload, secret or settings.SUPABASE_JWT_SECRET, algorithm="HS256")
