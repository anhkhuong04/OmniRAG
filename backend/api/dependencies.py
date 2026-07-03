import logging
import secrets
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import settings
from backend.core.database import get_session
from backend.core.security import hash_api_key
from backend.models.api_key import APIKey

logger = logging.getLogger(__name__)

# ─── Database Session ─────────────────────────────────────────────────────────

DBSessionDep = Annotated[AsyncSession, Depends(get_session)]

# ─── API Key Authentication (Tenant) ──────────────────────────────────────────

_http_bearer = HTTPBearer(auto_error=True)


async def get_current_tenant_id(
    session: DBSessionDep,
    credentials: Annotated[HTTPAuthorizationCredentials, Security(_http_bearer)],
) -> str:
    """Authenticates a request via Bearer token and returns the owning tenant_id.

    Flow:
        1. Extract raw token from `Authorization: Bearer <token>` header.
        2. Hash the token with SHA-256.
        3. Look up the hash in the `api_keys` table.
        4. Verify the key is active (`is_active=True`).
        5. Return the associated tenant_id as a string.

    Raises:
        401 Unauthorized: If the key is missing, invalid, or deactivated.
    """
    raw_key = credentials.credentials
    key_hash = hash_api_key(raw_key)

    result = await session.execute(
        select(APIKey).where(APIKey.key_hash == key_hash)
    )
    api_key_record = result.scalar_one_or_none()

    if not api_key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not api_key_record.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key has been deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return str(api_key_record.tenant_id)


# Annotated type alias — used as `tenant_id: TenantIDDep` in route functions
TenantIDDep = Annotated[str, Depends(get_current_tenant_id)]

# ─── Admin Authentication ──────────────────────────────────────────────────────


async def verify_admin_key(
    x_admin_key: Annotated[str, Header(alias="X-Admin-Key")] = "",
) -> None:
    """Verifies the admin secret key using constant-time comparison.

    Uses `secrets.compare_digest()` to prevent timing-attack leakage
    that would occur with a simple `==` comparison.

    Raises:
        403 Forbidden: If the key is missing or incorrect.
    """
    if not x_admin_key or not secrets.compare_digest(
        x_admin_key.encode(), settings.ADMIN_SECRET_KEY.encode()
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing admin key.",
        )


AdminKeyDep = Annotated[None, Depends(verify_admin_key)]
