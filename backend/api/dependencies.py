import logging
import secrets
import uuid
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import settings
from backend.core.database import get_session
from backend.core.security import decode_token, hash_api_key
from backend.models.api_key import APIKey
from backend.models.tenant import Tenant
from backend.models.user import User

logger = logging.getLogger(__name__)

# ─── Database Session ─────────────────────────────────────────────────────────

DBSessionDep = Annotated[AsyncSession, Depends(get_session)]

# ─── Shared Bearer extractor (used by both API-key and JWT routes) ─────────────

_http_bearer = HTTPBearer(auto_error=True)

# ─── API Key Authentication (Tenant / Chatbot endpoints) ──────────────────────


@dataclass
class TenantContext:
    """Carries both tenant_id and api_key_id so routes can log usage per key."""

    tenant_id: str
    api_key_id: str   # UUID string of the matched APIKey record


async def get_tenant_context(
    session: DBSessionDep,
    credentials: Annotated[HTTPAuthorizationCredentials, Security(_http_bearer)],
) -> TenantContext:
    """Authenticates a request via Bearer API key and returns TenantContext.

    Returns both tenant_id AND api_key_id — the api_key_id is required to
    write a UsageLog row attributing usage to a specific key for billing.

    Flow:
        1. Extract raw token from `Authorization: Bearer <token>`.
        2. SHA-256 hash the token.
        3. Look up the hash in `api_keys` table.
        4. Verify the key is active.
        5. Return TenantContext(tenant_id, api_key_id).

    Raises:
        401 Unauthorized: If the key is missing, invalid, or deactivated.
    """
    raw_key = credentials.credentials
    key_hash = hash_api_key(raw_key)

    result = await session.execute(
        select(APIKey)
        .where(APIKey.key_hash == key_hash)
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

    # Check if Tenant is active
    tenant = await session.get(Tenant, api_key_record.tenant_id)
    if not tenant or not tenant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Workspace has been disabled by system administrator.",
        )

    return TenantContext(
        tenant_id=str(api_key_record.tenant_id),
        api_key_id=str(api_key_record.id),
    )


async def get_current_tenant_id(
    ctx: Annotated[TenantContext, Depends(get_tenant_context)],
) -> str:
    """Backward-compatible wrapper — returns only tenant_id string.

    Existing routes that use TenantIDDep continue to work unchanged.
    """
    return ctx.tenant_id


# Annotated type aliases
TenantIDDep = Annotated[str, Depends(get_current_tenant_id)]
TenantContextDep = Annotated[TenantContext, Depends(get_tenant_context)]


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

# ─── JWT Authentication (Dashboard / Workspace endpoints) ─────────────────────


async def get_current_user(
    session: DBSessionDep,
    credentials: Annotated[HTTPAuthorizationCredentials, Security(_http_bearer)],
) -> User:
    """Authenticates a request via JWT Bearer token and returns the User.

    Used by all dashboard and workspace endpoints that require a logged-in user.

    Flow:
        1. Extract raw token from `Authorization: Bearer <token>`.
        2. Decode and validate the JWT signature and expiry.
        3. Confirm token type is "access".
        4. Load the User from the database.
        5. Confirm the user account is active.

    Raises:
        401 Unauthorized: If the token is missing, invalid, expired, or the
                          user account is inactive.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise credentials_exception

    if payload.get("type") != "access":
        raise credentials_exception

    user_id_str: str | None = payload.get("sub")
    if not user_id_str:
        raise credentials_exception

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    user = await session.get(User, user_id)
    if not user:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has been deactivated.",
        )

    return user


async def get_verified_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Extends get_current_user — additionally requires email verification.

    Use this dependency for any endpoint that must only be accessible
    to users who have confirmed their email address (e.g., creating workspaces).

    Raises:
        403 Forbidden: If the user's email has not been verified.
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification is required. Please check your inbox.",
        )
    return current_user


# Annotated type aliases for use in route function signatures
CurrentUserDep = Annotated[User, Depends(get_current_user)]
VerifiedUserDep = Annotated[User, Depends(get_verified_user)]

# ─── System Admin Authentication ──────────────────────────────────────────────

async def get_system_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Verifies that the current user is a System Admin.
    
    Raises:
        403 Forbidden: If the user is not a system admin.
    """
    if not current_user.is_system_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System Administrator privileges required.",
        )
    return current_user

SystemAdminDep = Annotated[User, Depends(get_system_admin)]
