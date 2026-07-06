"""
workspace_service.py

Business logic for Workspace creation, membership queries.

Security invariant: every database query that touches workspace-scoped data
MUST include a filter on `workspace_id`. No exceptions.
"""

import logging
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.tenant import Tenant
from backend.models.workspace import Workspace
from backend.models.user import User
from backend.models.user_tenant import UserTenantLink, TenantRole
from backend.models.user_workspace import UserWorkspaceLink, WorkspaceRole
from backend.schemas.workspace import WorkspaceCreate, WorkspaceMemberResponse, WorkspaceResponse
from backend.services.tenant_service import _get_user_role_in_tenant

logger = logging.getLogger(__name__)


async def _get_user_role_in_workspace(
    db: AsyncSession, user_id: uuid.UUID, workspace_id: uuid.UUID
) -> WorkspaceRole | None:
    """Returns the user's role in a workspace, or None if not a member."""
    result = await db.execute(
        select(UserWorkspaceLink).where(
            UserWorkspaceLink.user_id == user_id,
            UserWorkspaceLink.workspace_id == workspace_id,
        )
    )
    link = result.scalar_one_or_none()
    return link.role if link else None


async def create_workspace(
    db: AsyncSession, payload: WorkspaceCreate, owner: User
) -> WorkspaceResponse:
    """Creates a new Workspace under a Tenant.

    Args:
        db: Active async database session.
        payload: Validated workspace creation data.
        owner: The authenticated user who will become the ADMIN of the workspace.

    Returns:
        A WorkspaceResponse including the owner's role.
    """
    if not owner.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification is required before creating a workspace.",
        )

    # 1. Verify user is ADMIN or OWNER in the parent Tenant
    tenant_role = await _get_user_role_in_tenant(db, owner.id, payload.tenant_id)
    if not tenant_role or tenant_role not in [TenantRole.OWNER, TenantRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be an Organization Admin or Owner to create a workspace.",
        )

    # 2. Create the Workspace row
    workspace = Workspace(name=payload.name, tenant_id=payload.tenant_id)
    db.add(workspace)
    await db.flush()  # Flush to get workspace.id without committing yet

    # 3. Link the owner to the workspace with ADMIN role
    link = UserWorkspaceLink(
        user_id=owner.id,
        workspace_id=workspace.id,
        role=WorkspaceRole.ADMIN,
    )
    db.add(link)

    await db.commit()
    await db.refresh(workspace)

    logger.info(
        "Created workspace: id=%s name='%s' owner=%s tenant_id=%s",
        workspace.id,
        workspace.name,
        owner.id,
        payload.tenant_id,
    )

    return WorkspaceResponse(
        id=workspace.id,
        tenant_id=workspace.tenant_id,
        name=workspace.name,
        is_active=workspace.is_active,
        created_at=workspace.created_at,
        role=WorkspaceRole.ADMIN,
    )


async def list_workspaces(db: AsyncSession, user: User, tenant_id: uuid.UUID) -> list[WorkspaceResponse]:
    """Lists all workspaces the user is a member of within a specific tenant."""
    result = await db.execute(
        select(UserWorkspaceLink, Workspace)
        .join(Workspace, UserWorkspaceLink.workspace_id == Workspace.id)
        .where(
            UserWorkspaceLink.user_id == user.id,
            Workspace.tenant_id == tenant_id
        )
        .order_by(UserWorkspaceLink.created_at.desc())
    )
    rows = result.all()

    return [
        WorkspaceResponse(
            id=workspace.id,
            tenant_id=workspace.tenant_id,
            name=workspace.name,
            is_active=workspace.is_active,
            created_at=workspace.created_at,
            role=link.role,
        )
        for link, workspace in rows
    ]


async def get_workspace_detail(
    db: AsyncSession, workspace_id: uuid.UUID, user: User
) -> WorkspaceResponse:
    """Returns workspace details if the requesting user is a member."""
    result = await db.execute(
        select(UserWorkspaceLink, Workspace)
        .join(Workspace, UserWorkspaceLink.workspace_id == Workspace.id)
        .where(
            UserWorkspaceLink.user_id == user.id,
            UserWorkspaceLink.workspace_id == workspace_id,
        )
    )
    row = result.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or you are not a member.",
        )

    link, workspace = row
    return WorkspaceResponse(
        id=workspace.id,
        tenant_id=workspace.tenant_id,
        name=workspace.name,
        is_active=workspace.is_active,
        created_at=workspace.created_at,
        role=link.role,
    )


async def get_workspace_members(
    db: AsyncSession, workspace_id: uuid.UUID, requesting_user: User
) -> list[WorkspaceMemberResponse]:
    """Returns all members of a workspace."""
    caller_role = await _get_user_role_in_workspace(db, requesting_user.id, workspace_id)
    if not caller_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this workspace.",
        )

    result = await db.execute(
        select(UserWorkspaceLink, User)
        .join(User, UserWorkspaceLink.user_id == User.id)
        .where(UserWorkspaceLink.workspace_id == workspace_id)
        .order_by(UserWorkspaceLink.created_at.asc())
    )
    rows = result.all()

    return [
        WorkspaceMemberResponse(
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=link.role,
            joined_at=link.created_at,
        )
        for link, user in rows
    ]
