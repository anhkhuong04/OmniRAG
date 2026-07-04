"""Workspace routes: create, list, detail, members."""

import logging
import uuid

from fastapi import APIRouter, status

from backend.api.dependencies import CurrentUserDep, DBSessionDep, VerifiedUserDep
from backend.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceMemberResponse,
    WorkspaceResponse,
)
from backend.services import workspace_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    payload: WorkspaceCreate,
    current_user: VerifiedUserDep,
    session: DBSessionDep,
):
    """Creates a new Workspace for the authenticated, verified user.

    The caller is automatically assigned the OWNER role.
    A FREE plan subscription is auto-assigned to the new workspace.

    Requires: valid JWT + verified email.
    """
    workspace = await workspace_service.create_workspace(session, payload, current_user)
    logger.info(
        "User %s created workspace '%s' (id=%s)",
        current_user.id,
        payload.name,
        workspace.id,
    )
    return workspace


@router.get("", response_model=list[WorkspaceResponse])
async def list_workspaces(current_user: CurrentUserDep, session: DBSessionDep):
    """Returns all workspaces the authenticated user belongs to.

    Includes the user's role within each workspace.
    Requires: valid JWT.
    """
    return await workspace_service.get_user_workspaces(session, current_user.id)


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: uuid.UUID,
    current_user: CurrentUserDep,
    session: DBSessionDep,
):
    """Returns the details of a specific workspace.

    Only accessible to members of that workspace.
    Requires: valid JWT + membership.
    """
    return await workspace_service.get_workspace_detail(
        session, workspace_id, current_user.id
    )


@router.get("/{workspace_id}/members", response_model=list[WorkspaceMemberResponse])
async def get_workspace_members(
    workspace_id: uuid.UUID,
    current_user: CurrentUserDep,
    session: DBSessionDep,
):
    """Returns all members of a workspace with their roles.

    Only accessible to members of that workspace.
    Requires: valid JWT + membership.
    """
    return await workspace_service.get_workspace_members(
        session, workspace_id, current_user.id
    )
