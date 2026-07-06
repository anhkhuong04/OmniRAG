"""
api_key_service.py

Workspace-scoped API Key CRUD for use by authenticated tenant owners/admins.

Unlike the admin routes (X-Admin-Key header), these operations are triggered
by workspace members via JWT — meaning users manage their own keys.

All queries MUST filter by workspace_id for strict tenant isolation.
"""
import hashlib
import logging
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.api_key import APIKey
from backend.models.usage_log import UsageLog, UsageLogType
from backend.models.user_tenant import UserWorkspaceLink
from backend.schemas.usage import (
    WorkspaceAPIKeyResponse,
    WorkspaceAPIKeyCreateResponse,
    UsageStatsResponse,
    DailyUsagePoint,
    UsageHistoryResponse,
)

logger = logging.getLogger(__name__)

_KEY_PREFIX = "omni_"


def _hash_key(raw_key: str) -> str:
    """Returns SHA-256 hash of a raw API key for storage."""
    return hashlib.sha256(raw_key.encode()).hexdigest()


async def _assert_can_manage_keys(db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID) -> None:
    """Raises HTTP 403 unless user is OWNER or ADMIN of the workspace.

    Args:
        db: Active async database session.
        workspace_id: UUID of the target workspace/tenant.
        user_id: UUID of the requesting user.

    Raises:
        HTTPException 403: If user lacks permission.
    """
    result = await db.execute(
        select(UserWorkspaceLink).where(
            UserWorkspaceLink.workspace_id == workspace_id,
            UserWorkspaceLink.user_id == user_id,
            UserWorkspaceLink.role.in_(["owner", "admin"]),
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owners and admins can manage API keys.",
        )


async def create_api_key(
    db: AsyncSession,
    workspace_id: str,
    user_id: str,
    name: str,
    expires_in_days: Optional[int] = None,
) -> WorkspaceAPIKeyCreateResponse:
    """Creates a new API key for a workspace.

    Generates a cryptographically secure random key, stores only the hash.
    Returns the raw key ONCE — the caller is responsible for saving it.

    Args:
        db: Active async database session.
        workspace_id: UUID string of the workspace.
        user_id: UUID string of the requesting user (must be owner/admin).
        name: Friendly name for this key (e.g. "Production Widget").
        expires_in_days: Optional TTL in days. None means no expiry.

    Returns:
        WorkspaceAPIKeyCreateResponse including the raw key (shown once only).

    Raises:
        HTTPException 403: If user is not owner/admin of the workspace.
    """
    workspace_uuid = uuid.UUID(workspace_id)
    u_uuid = uuid.UUID(user_id)

    await _assert_can_manage_keys(db, workspace_uuid, u_uuid)

    raw_key = _KEY_PREFIX + secrets.token_urlsafe(32)
    key_hash = _hash_key(raw_key)

    expires_at = None
    if expires_in_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)

    api_key = APIKey(
        workspace_id=workspace_uuid,
        key_hash=key_hash,
        name=name,
        is_active=True,
        expires_at=expires_at,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    logger.info("Created API key '%s' for tenant='%s'.", name, workspace_id)

    return WorkspaceAPIKeyCreateResponse(
        **api_key.model_dump(),
        raw_key=raw_key,
    )


async def list_api_keys(
    db: AsyncSession,
    workspace_id: str,
    user_id: str,
) -> list[WorkspaceAPIKeyResponse]:
    """Lists all API keys for a workspace (raw values never returned).

    Args:
        db: Active async database session.
        workspace_id: UUID string of the workspace.
        user_id: UUID string of the requesting user.

    Returns:
        List of WorkspaceAPIKeyResponse (no raw keys).

    Raises:
        HTTPException 403: If user is not a member of the workspace.
    """
    workspace_uuid = uuid.UUID(workspace_id)
    u_uuid = uuid.UUID(user_id)

    # Any member can view keys (but not create/revoke)
    result = await db.execute(
        select(UserWorkspaceLink).where(
            UserWorkspaceLink.workspace_id == workspace_uuid,
            UserWorkspaceLink.user_id == u_uuid,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    keys_result = await db.execute(
        select(APIKey).where(APIKey.workspace_id == workspace_uuid).order_by(APIKey.created_at.desc())
    )
    keys = keys_result.scalars().all()
    return [WorkspaceAPIKeyResponse(**k.model_dump()) for k in keys]


async def revoke_api_key(
    db: AsyncSession,
    workspace_id: str,
    key_id: str,
    user_id: str,
) -> None:
    """Soft-revokes an API key by setting is_active=False.

    Args:
        db: Active async database session.
        workspace_id: UUID string of the workspace.
        key_id: UUID string of the key to revoke.
        user_id: UUID string of the requesting user.

    Raises:
        HTTPException 403: If user is not owner/admin.
        HTTPException 404: If key does not exist for this tenant.
    """
    workspace_uuid = uuid.UUID(workspace_id)
    await _assert_can_manage_keys(db, workspace_uuid, uuid.UUID(user_id))

    result = await db.execute(
        select(APIKey).where(
            APIKey.id == uuid.UUID(key_id),
            APIKey.workspace_id == workspace_uuid,  # Workspace isolation
        )
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found in this workspace.",
        )

    key.is_active = False
    db.add(key)
    await db.commit()
    logger.info("Revoked API key id='%s' for tenant='%s'.", key_id, workspace_id)


async def get_usage_stats(
    db: AsyncSession,
    workspace_id: str,
    user_id: str,
) -> UsageStatsResponse:
    """Returns aggregated usage metrics for the current billing period.

    Args:
        db: Active async database session.
        workspace_id: UUID string of the workspace.
        user_id: UUID string of the requesting user.

    Returns:
        UsageStatsResponse with plan limits and current usage.

    Raises:
        HTTPException 403: If user is not a workspace member.
    """
    from sqlalchemy import select
    from backend.models.subscription import Subscription, Plan

    workspace_uuid = uuid.UUID(workspace_id)
    u_uuid = uuid.UUID(user_id)

    # Membership check
    member_result = await db.execute(
        select(UserWorkspaceLink).where(
            UserWorkspaceLink.workspace_id == workspace_uuid,
            UserWorkspaceLink.user_id == u_uuid,
        )
    )
    if not member_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    # Get subscription + plan
    sub_result = await db.execute(
        select(Subscription, Plan)
        .join(Plan, Subscription.plan_id == Plan.id)
        .where(Subscription.workspace_id == workspace_uuid)
    )
    row = sub_result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="No subscription found.")

    sub, plan = row

    # Aggregate token cost from usage_logs this month
    from sqlalchemy import extract
    now = datetime.now(timezone.utc)
    cost_result = await db.execute(
        select(
            func.coalesce(func.sum(UsageLog.cost_usd), 0.0),
            func.coalesce(func.sum(UsageLog.prompt_tokens), 0),
            func.coalesce(func.sum(UsageLog.completion_tokens), 0),
        ).where(
            UsageLog.workspace_id == workspace_uuid,
            UsageLog.log_type == UsageLogType.QUERY,
            extract("year", UsageLog.created_at) == now.year,
            extract("month", UsageLog.created_at) == now.month,
        )
    )
    total_cost, total_prompt, total_completion = cost_result.one()

    return UsageStatsResponse(
        workspace_id=workspace_uuid,
        plan_name=plan.name,
        plan_tier=plan.tier,
        documents_count=sub.documents_count,
        max_documents=plan.max_documents,
        queries_used_this_month=sub.queries_used_this_month,
        max_queries_per_month=plan.max_queries_per_month,
        total_cost_usd_this_month=float(total_cost),
        total_prompt_tokens=int(total_prompt),
        total_completion_tokens=int(total_completion),
        current_period_start=sub.current_period_start,
        current_period_end=sub.current_period_end,
    )


async def get_usage_history(
    db: AsyncSession,
    workspace_id: str,
    user_id: str,
) -> UsageHistoryResponse:
    """Returns aggregated usage history for the last 6 months.

    Args:
        db: Active async database session.
        workspace_id: UUID string of the workspace.
        user_id: UUID string of the requesting user.

    Returns:
        UsageHistoryResponse with monthly history.

    Raises:
        HTTPException 403: If user is not a workspace member.
    """
    from sqlalchemy import select, extract, func
    from backend.schemas.usage import MonthlyUsagePoint, UsageHistoryResponse
    from backend.models.usage_log import UsageLog
    
    workspace_uuid = uuid.UUID(workspace_id)
    u_uuid = uuid.UUID(user_id)

    # Membership check
    member_result = await db.execute(
        select(UserWorkspaceLink).where(
            UserWorkspaceLink.workspace_id == workspace_uuid,
            UserWorkspaceLink.user_id == u_uuid,
        )
    )
    if not member_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    now = datetime.now(timezone.utc)
    # Calculate date 6 months ago
    six_months_ago = now - timedelta(days=6*30)

    # Aggregate by month
    history_result = await db.execute(
        select(
            extract("year", UsageLog.created_at).label("year"),
            extract("month", UsageLog.created_at).label("month"),
            func.coalesce(func.sum(UsageLog.cost_usd), 0.0),
            func.coalesce(func.sum(UsageLog.prompt_tokens), 0),
            func.coalesce(func.sum(UsageLog.completion_tokens), 0),
        ).where(
            UsageLog.workspace_id == workspace_uuid,
            UsageLog.created_at >= six_months_ago
        )
        .group_by(
            extract("year", UsageLog.created_at),
            extract("month", UsageLog.created_at)
        )
        .order_by(
            extract("year", UsageLog.created_at).desc(),
            extract("month", UsageLog.created_at).desc()
        )
    )

    history = []
    for row in history_result.all():
        year, month, cost, p_tokens, c_tokens = row
        # Format month as YYYY-MM
        month_str = f"{int(year)}-{int(month):02d}"
        history.append(MonthlyUsagePoint(
            month=month_str,
            cost_usd=float(cost),
            prompt_tokens=int(p_tokens),
            completion_tokens=int(c_tokens)
        ))

    return UsageHistoryResponse(workspace_id=workspace_uuid, history=history)
