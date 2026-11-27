import secrets
from app.core.security import (
    hash_token,
    hash_webhook_secret,
    verify_webhook_hmac,
    encrypt_payload,
    decrypt_payload,
)


def test_token_hashing_sha256():
    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_token(raw_token)
    assert len(token_hash) == 64  # Hex SHA-256 length
    assert hash_token(raw_token) == token_hash
    # Ensure different token produces different hash
    assert hash_token(raw_token + "x") != token_hash


def test_webhook_hmac_verification():
    secret = "test-secret-eventflow-webhook"
    payload = b'{"event_id": "123", "attendee": "John"}'
    
    # Compute signature
    import hmac, hashlib
    valid_sig = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    
    assert verify_webhook_hmac(payload, valid_sig, secret) is True
    # Tampered payload fails
    assert verify_webhook_hmac(payload + b"tamper", valid_sig, secret) is False
    # Tampered signature fails
    assert verify_webhook_hmac(payload, "invalid_sig" + valid_sig[11:], secret) is False


def test_aes_gcm_authenticated_encryption():
    plaintext = "super_secret_raw_qr_token_12345"
    encrypted_hex = encrypt_payload(plaintext)
    assert encrypted_hex != plaintext
    
    decrypted = decrypt_payload(encrypted_hex)
    assert decrypted == plaintext
