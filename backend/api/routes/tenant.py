"""Tenant (Organization) routes: create, list, detail, members."""

import logging
import uuid

from fastapi import APIRouter, status, HTTPException

from backend.api.dependencies import CurrentUserDep, DBSessionDep, VerifiedUserDep
from backend.schemas.tenant import (
    TenantCreate,
    TenantMemberResponse,
    TenantResponse,
)
from backend.services import tenant_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    payload: TenantCreate,
    current_user: VerifiedUserDep,
    session: DBSessionDep,
):
    """Creates a new Organization (Tenant) for the authenticated, verified user.

    The caller is automatically assigned the OWNER role.
    A FREE plan subscription is auto-assigned to the new organization.

    Requires: valid JWT + verified email.
    """
    if current_user.is_system_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System Administrators operate at the platform level and cannot own or join organizations.",
        )
        
    tenant = await tenant_service.create_tenant(session, payload, current_user)
    logger.info(
        "User %s created organization '%s' (id=%s)",
        current_user.id,
        payload.name,
        tenant.id,
    )
    return tenant


@router.get("", response_model=list[TenantResponse])
async def list_tenants(current_user: CurrentUserDep, session: DBSessionDep):
    """Returns all organizations the authenticated user belongs to.

    Includes the user's role within each organization.
    Requires: valid JWT.
    """
    return await tenant_service.list_tenants(session, current_user)


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: uuid.UUID,
    current_user: CurrentUserDep,
    session: DBSessionDep,
):
    """Returns the details of a specific organization.

    Only accessible to members of that organization.
    Requires: valid JWT + membership.
    """
    return await tenant_service.get_tenant_detail(
        session, tenant_id, current_user
    )


@router.get("/{tenant_id}/members", response_model=list[TenantMemberResponse])
async def get_tenant_members(
    tenant_id: uuid.UUID,
    current_user: CurrentUserDep,
    session: DBSessionDep,
):
    """Returns all members of an organization with their roles.

    Only accessible to members of that organization.
    Requires: valid JWT + membership.
    """
    return await tenant_service.get_tenant_members(
        session, tenant_id, current_user
    )
