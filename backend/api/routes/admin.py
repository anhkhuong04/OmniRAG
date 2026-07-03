import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from backend.api.dependencies import AdminKeyDep, DBSessionDep
from backend.core.security import generate_api_key, hash_api_key
from backend.models.api_key import APIKey
from backend.models.tenant import Tenant
from backend.schemas.admin import (
    APIKeyCreate,
    APIKeyCreateResponse,
    APIKeyResponse,
    TenantCreate,
    TenantResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/tenants", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    request: TenantCreate,
    _: AdminKeyDep,
    session: DBSessionDep,
):
    """Creates a new Tenant. Requires Admin Key in `X-Admin-Key` header."""
    new_tenant = Tenant(name=request.name)
    session.add(new_tenant)
    await session.commit()
    await session.refresh(new_tenant)
    logger.info("Created new tenant: id=%s name='%s'", new_tenant.id, new_tenant.name)
    return new_tenant


@router.post(
    "/tenants/{tenant_id}/api-keys",
    response_model=APIKeyCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_api_key(
    tenant_id: uuid.UUID,
    request: APIKeyCreate,
    _: AdminKeyDep,
    session: DBSessionDep,
):
    """Creates and returns a new API key for a given Tenant.

    IMPORTANT: The raw API key is returned ONLY in this response.
    It is hashed before being stored — it cannot be recovered later.
    """
    # Verify the target tenant exists
    tenant = await session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found.")

    raw_key = generate_api_key()
    key_hash = hash_api_key(raw_key)

    new_key = APIKey(
        tenant_id=tenant_id,
        key_hash=key_hash,
        name=request.name,
    )
    session.add(new_key)
    await session.commit()
    await session.refresh(new_key)
    logger.info(
        "Created API key: id=%s name='%s' for tenant=%s", new_key.id, new_key.name, tenant_id
    )

    return APIKeyCreateResponse(
        id=new_key.id,
        tenant_id=new_key.tenant_id,
        name=new_key.name,
        is_active=new_key.is_active,
        created_at=new_key.created_at,
        raw_key=raw_key,  # Exposed only here, only once
    )


@router.delete("/api-keys/{key_id}", response_model=APIKeyResponse)
async def revoke_api_key(
    key_id: uuid.UUID,
    _: AdminKeyDep,
    session: DBSessionDep,
):
    """Revokes an API key by setting is_active=False.

    The key record is kept in the database for audit purposes.
    """
    api_key = await session.get(APIKey, key_id)
    if not api_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found.")

    if not api_key.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="API key is already deactivated."
        )

    api_key.is_active = False
    session.add(api_key)
    await session.commit()
    await session.refresh(api_key)
    logger.info("Revoked API key: id=%s for tenant=%s", key_id, api_key.tenant_id)
    return api_key
