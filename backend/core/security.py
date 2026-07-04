import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from backend.core.config import settings

# ─── API Key Utilities (existing) ─────────────────────────────────────────────

API_KEY_PREFIX = "omni_"

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_api_key() -> str:
    """Generates a secure, random API key.

    Returns:
        A URL-safe string of format `omni_<44 random chars>`.
        The full string is the raw key shown to the user exactly once.
    """
    return f"{API_KEY_PREFIX}{secrets.token_urlsafe(32)}"


def hash_api_key(api_key: str) -> str:
    """Hashes an API key using SHA-256 for safe storage in the database.

    The raw key is NEVER stored — only its hash is persisted.

    Args:
        api_key: The raw API key string to hash.

    Returns:
        Hex-encoded SHA-256 digest of the key.
    """
    return hashlib.sha256(api_key.encode()).hexdigest()


# ─── Password Hashing (bcrypt) ─────────────────────────────────────────────────


def hash_password(plain_password: str) -> str:
    """Hashes a plain-text password using bcrypt.

    Args:
        plain_password: The raw password string from the user.

    Returns:
        bcrypt hash string safe for storage in the database.
    """
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against its bcrypt hash.

    Args:
        plain_password: Raw password from login request.
        hashed_password: Stored bcrypt hash from the database.

    Returns:
        True if the password matches, False otherwise.
    """
    return _pwd_context.verify(plain_password, hashed_password)


# ─── JWT Tokens ────────────────────────────────────────────────────────────────


def _create_token(data: dict[str, Any], expires_delta: timedelta) -> str:
    """Internal helper: signs a JWT with the configured secret and algorithm.

    Args:
        data: Claims to embed in the token payload.
        expires_delta: Time-to-live for the token.

    Returns:
        Signed JWT string.
    """
    payload = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: str) -> str:
    """Creates a short-lived JWT access token for a user.

    Args:
        user_id: The UUID string of the authenticated user (becomes `sub` claim).

    Returns:
        Signed JWT access token string.
    """
    return _create_token(
        data={"sub": user_id, "type": "access"},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: str) -> str:
    """Creates a long-lived JWT refresh token for a user.

    Args:
        user_id: The UUID string of the authenticated user.

    Returns:
        Signed JWT refresh token string.
    """
    return _create_token(
        data={"sub": user_id, "type": "refresh"},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> dict[str, Any]:
    """Decodes and validates a JWT token.

    Args:
        token: The raw JWT string from the Authorization header.

    Returns:
        The decoded payload dictionary.

    Raises:
        JWTError: If the token is expired, tampered, or structurally invalid.
    """
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
