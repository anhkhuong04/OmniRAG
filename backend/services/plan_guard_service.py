"""
plan_guard_service.py

Enforces plan-based resource limits before every billable operation.

The service reads the tenant's active Subscription (joined with Plan limits)
and raises appropriate HTTP errors before any expensive work (embedding API
calls, LLM calls) is done.

All reads filter by tenant_id — no cross-tenant data leakage.
"""
import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.subscription import Plan, Subscription

logger = logging.getLogger(__name__)


async def _get_subscription_with_plan(db: AsyncSession, tenant_id: str) -> tuple[Subscription, Plan]:
    """Fetches the active subscription and its plan for a tenant.

    Args:
        db: Active async database session.
        tenant_id: UUID string of the tenant.

    Returns:
        A (Subscription, Plan) tuple.

    Raises:
        HTTPException 404: If no subscription exists for this tenant.
    """
    import uuid
    result = await db.execute(
        select(Subscription, Plan)
        .join(Plan, Subscription.plan_id == Plan.id)
        .where(Subscription.tenant_id == uuid.UUID(tenant_id))
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found for this workspace.",
        )
    return row[0], row[1]


# ─── Pre-flight Checks ────────────────────────────────────────────────────────


async def check_document_limit(db: AsyncSession, tenant_id: str) -> None:
    """Raises HTTP 402 if the tenant has reached their document upload limit.

    Uses `documents_count` from Subscription (cached counter) to avoid a
    full table scan on every upload request.

    Args:
        db: Active async database session.
        tenant_id: UUID string of the tenant making the upload.

    Raises:
        HTTPException 402: If documents_count >= plan.max_documents.
    """
    subscription, plan = await _get_subscription_with_plan(db, tenant_id)

    # -1 means unlimited (Enterprise tier)
    if plan.max_documents != -1 and subscription.documents_count >= plan.max_documents:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=(
                f"Document limit reached ({subscription.documents_count}/{plan.max_documents}). "
                f"Upgrade your plan to upload more documents."
            ),
        )


async def check_query_limit(db: AsyncSession, tenant_id: str) -> None:
    """Raises HTTP 429 if the tenant has exhausted their monthly query quota.

    Args:
        db: Active async database session.
        tenant_id: UUID string of the tenant making the query.

    Raises:
        HTTPException 429: If queries_used >= plan.max_queries_per_month.
    """
    subscription, plan = await _get_subscription_with_plan(db, tenant_id)

    if (
        plan.max_queries_per_month != -1
        and subscription.queries_used_this_month >= plan.max_queries_per_month
    ):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Monthly query limit reached "
                f"({subscription.queries_used_this_month}/{plan.max_queries_per_month}). "
                f"Upgrade your plan or wait until next billing period."
            ),
        )


async def check_file_size(content: str, db: AsyncSession, tenant_id: str) -> None:
    """Raises HTTP 413 if the document content exceeds the plan's file size limit.

    Estimates size as UTF-8 byte length of the raw text.

    Args:
        content: The raw text content to check.
        db: Active async database session.
        tenant_id: UUID string of the tenant making the upload.

    Raises:
        HTTPException 413: If size > plan.max_file_size_mb * 1_000_000 bytes.
    """
    _, plan = await _get_subscription_with_plan(db, tenant_id)

    size_bytes = len(content.encode("utf-8"))
    max_bytes = plan.max_file_size_mb * 1_000_000

    if size_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"Content size ({size_bytes / 1e6:.2f} MB) exceeds plan limit "
                f"({plan.max_file_size_mb} MB). Reduce content size or upgrade your plan."
            ),
        )


async def check_storage_limit(db: AsyncSession, tenant_id: str, new_file_size_bytes: int) -> None:
    """Raises HTTP 413 if adding the new file exceeds the workspace's storage limit.

    Args:
        db: Active async database session.
        tenant_id: UUID string of the tenant making the upload.
        new_file_size_bytes: Size of the new file being uploaded in bytes.

    Raises:
        HTTPException 413: If current_storage + new_file_size_bytes > plan.max_storage_mb * 1_000_000.
    """
    import uuid
    from sqlalchemy import func
    from backend.models.document import Document
    
    _, plan = await _get_subscription_with_plan(db, tenant_id)
    
    if plan.max_storage_mb == -1:
        return  # Unlimited

    # Sum existing document sizes
    result = await db.execute(
        select(func.coalesce(func.sum(Document.file_size_bytes), 0))
        .where(Document.tenant_id == uuid.UUID(tenant_id))
    )
    current_storage_bytes = result.scalar() or 0
    
    total_bytes = current_storage_bytes + new_file_size_bytes
    max_bytes = plan.max_storage_mb * 1_000_000
    
    if total_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"Workspace storage limit reached. "
                f"Current: {current_storage_bytes / 1e6:.2f} MB, "
                f"New File: {new_file_size_bytes / 1e6:.2f} MB, "
                f"Limit: {plan.max_storage_mb} MB. "
                f"Upgrade your plan or delete old documents."
            ),
        )


# ─── Counter Increments ───────────────────────────────────────────────────────


async def increment_query_counter(db: AsyncSession, tenant_id: str) -> None:
    """Increments the monthly query counter for a tenant's subscription.

    Called non-blocking (via asyncio.create_task) after each successful query.

    Args:
        db: Active async database session.
        tenant_id: UUID string of the tenant.
    """
    import uuid
    result = await db.execute(
        select(Subscription).where(Subscription.tenant_id == uuid.UUID(tenant_id))
    )
    subscription = result.scalar_one_or_none()
    if subscription:
        subscription.queries_used_this_month += 1
        subscription.updated_at = datetime.now(timezone.utc)
        db.add(subscription)
        await db.commit()


async def increment_document_counter(db: AsyncSession, tenant_id: str) -> None:
    """Increments the document count for a tenant's subscription.

    Called after a successful ingestion background task completes.

    Args:
        db: Active async database session.
        tenant_id: UUID string of the tenant.
    """
    import uuid
    result = await db.execute(
        select(Subscription).where(Subscription.tenant_id == uuid.UUID(tenant_id))
    )
    subscription = result.scalar_one_or_none()
    if subscription:
        subscription.documents_count += 1
        subscription.updated_at = datetime.now(timezone.utc)
        db.add(subscription)
        await db.commit()


async def decrement_document_counter(db: AsyncSession, tenant_id: str) -> None:
    """Decrements the document count when a document is deleted.

    Args:
        db: Active async database session.
        tenant_id: UUID string of the tenant.
    """
    import uuid
    result = await db.execute(
        select(Subscription).where(Subscription.tenant_id == uuid.UUID(tenant_id))
    )
    subscription = result.scalar_one_or_none()
    if subscription and subscription.documents_count > 0:
        subscription.documents_count -= 1
        subscription.updated_at = datetime.now(timezone.utc)
        db.add(subscription)
        await db.commit()
