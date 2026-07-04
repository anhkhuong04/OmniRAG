"""
api_keys.py

Workspace-scoped API Key management routes (JWT authenticated).

These routes allow workspace owners and admins to manage API keys that
chatbot-integrators use to authenticate with /documents/ingest and /chat/query.

Authentication: JWT Bearer (not API Key) — these are dashboard management endpoints.
Authorization:  OWNER/ADMIN role within the workspace for create/revoke.
                Any workspace MEMBER can view the key list and usage stats.
"""
import logging
import uuid

from fastapi import APIRouter, status

from backend.api.dependencies import DBSessionDep, VerifiedUserDep
from backend.schemas.usage import (
    WorkspaceAPIKeyCreate,
    WorkspaceAPIKeyCreateResponse,
    WorkspaceAPIKeyResponse,
    UsageStatsResponse,
    UsageHistoryResponse,
)
from backend.services import api_key_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/workspaces/{workspace_id}/api-keys", tags=["api-keys"])


@router.post(
    "",
    response_model=WorkspaceAPIKeyCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_api_key(
    workspace_id: uuid.UUID,
    payload: WorkspaceAPIKeyCreate,
    current_user: VerifiedUserDep,
    session: DBSessionDep,
):
    """Creates a new API key for a workspace.

    The raw key is returned ONCE in this response. Store it immediately —
    it cannot be retrieved again after this request completes.

    Requires: OWNER or ADMIN role in the workspace.
    """
    return await api_key_service.create_api_key(
        db=session,
        tenant_id=str(workspace_id),
        user_id=str(current_user.id),
        name=payload.name,
    )


@router.get("", response_model=list[WorkspaceAPIKeyResponse])
async def list_api_keys(
    workspace_id: uuid.UUID,
    current_user: VerifiedUserDep,
    session: DBSessionDep,
):
    """Lists all API keys for a workspace (raw values are never returned).

    Any workspace member can view the key list.
    """
    return await api_key_service.list_api_keys(
        db=session,
        tenant_id=str(workspace_id),
        user_id=str(current_user.id),
    )


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    workspace_id: uuid.UUID,
    key_id: uuid.UUID,
    current_user: VerifiedUserDep,
    session: DBSessionDep,
):
    """Revokes (soft-deletes) an API key by setting is_active=False.

    Any existing requests using this key will be rejected with HTTP 401.
    Requires: OWNER or ADMIN role in the workspace.
    """
    await api_key_service.revoke_api_key(
        db=session,
        tenant_id=str(workspace_id),
        key_id=str(key_id),
        user_id=str(current_user.id),
    )


@router.get("/usage", response_model=UsageStatsResponse)
async def get_workspace_usage(
    workspace_id: uuid.UUID,
    current_user: VerifiedUserDep,
    session: DBSessionDep,
):
    """Returns aggregated usage statistics for the current billing period.

    Includes: document count vs plan limit, queries vs quota, total token cost.
    Any workspace member can view usage stats.

    NOTE: Route is /api-keys/usage — grouped here because usage is closely
    tied to API key activity. May be extracted to a dedicated /usage router later.
    """
    return await api_key_service.get_usage_stats(
        db=session,
        tenant_id=str(workspace_id),
        user_id=str(current_user.id),
    )


@router.get("/usage/history", response_model=UsageHistoryResponse)
async def get_workspace_usage_history(
    workspace_id: uuid.UUID,
    current_user: VerifiedUserDep,
    session: DBSessionDep,
):
    """Returns monthly aggregated usage history for the last 6 months.

    Any workspace member can view usage history.
    """
    from backend.schemas.usage import UsageHistoryResponse
    return await api_key_service.get_usage_history(
        db=session,
        tenant_id=str(workspace_id),
        user_id=str(current_user.id),
    )
