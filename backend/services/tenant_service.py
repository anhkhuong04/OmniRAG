"""
workspace_service.py

Business logic for Workspace (Tenant) creation, membership queries,
and plan/subscription management.

Security invariant: every database query that touches tenant-scoped data
MUST include a filter on `tenant_id`. No exceptions.
"""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.subscription import Plan, PlanTier, Subscription
from backend.models.tenant import Tenant
from backend.models.user import User
from backend.models.user_tenant import UserTenantLink, TenantRole
from backend.schemas.tenant import TenantCreate, TenantMemberResponse, TenantResponse

logger = logging.getLogger(__name__)


# ─── Internal Helpers ──────────────────────────────────────────────────────────


async def _get_free_plan(db: AsyncSession) -> Plan:
    """Retrieves the FREE plan from the database.

    Raises:
        RuntimeError: If the plans table has not been seeded yet.
    """
    result = await db.execute(select(Plan).where(Plan.tier == PlanTier.FREE))
    plan = result.scalar_one_or_none()
    if not plan:
        raise RuntimeError(
            "FREE plan not found in database. Run the startup seeder first."
        )
    return plan


async def _get_user_role_in_tenant(
    db: AsyncSession, user_id: uuid.UUID, tenant_id: uuid.UUID
) -> TenantRole | None:
    """Returns the user's role in a tenant, or None if not a member."""
    result = await db.execute(
        select(UserTenantLink).where(
            UserTenantLink.user_id == user_id,
            UserTenantLink.tenant_id == tenant_id,
        )
    )
    link = result.scalar_one_or_none()
    return link.role if link else None


# ─── Workspace Creation ────────────────────────────────────────────────────────


async def create_tenant(
    db: AsyncSession, payload: TenantCreate, owner: User
) -> TenantResponse:
    """Creates a new Tenant (Organization) and assigns the creator as OWNER.

    Also auto-assigns a FREE plan subscription to the new tenant.

    Args:
        db: Active async database session.
        payload: Validated workspace creation data.
        owner: The authenticated user who will become the OWNER.

    Returns:
        A TenantResponse including the owner's role.

    Raises:
        HTTPException 403: If the user has not verified their email.
    """
    if not owner.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification is required before creating an organization.",
        )

    free_plan = await _get_free_plan(db)

    # 1. Create the Tenant row
    tenant = Tenant(name=payload.name)
    db.add(tenant)
    await db.flush()  # Flush to get tenant.id without committing yet

    # 2. Link the owner to the tenant with OWNER role
    link = UserTenantLink(
        user_id=owner.id,
        tenant_id=tenant.id,
        role=TenantRole.OWNER,
    )
    db.add(link)

    # 3. Auto-assign FREE plan subscription
    subscription = Subscription(
        tenant_id=tenant.id,
        plan_id=free_plan.id,
        status="active",
    )
    db.add(subscription)

    await db.commit()
    await db.refresh(tenant)

    logger.info(
        "Created tenant: id=%s name='%s' owner=%s plan=FREE",
        tenant.id,
        tenant.name,
        owner.id,
    )

    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        is_active=tenant.is_active,
        created_at=tenant.created_at,
        role=WorkspaceRole.OWNER,
        role=TenantRole.OWNER,
    )


# ─── Workspace Queries ─────────────────────────────────────────────────────────


async def list_tenants(db: AsyncSession, user: User) -> list[TenantResponse]:
    """Lists all tenants the user is a member of., including their role.

    Security: filters by user_id — users can only see their own workspaces.

    Args:
        db: Active async database session.
        user: The authenticated user.

    Returns:
        List of TenantResponse objects, ordered by join date descending.
    """
    result = await db.execute(
        select(UserTenantLink, Tenant)
        .join(Tenant, UserTenantLink.tenant_id == Tenant.id)
        .where(UserTenantLink.user_id == user_id)
        .order_by(UserTenantLink.joined_at.desc())
    )
    rows = result.all()

    return [
        TenantResponse(
            id=tenant.id,
            name=tenant.name,
            is_active=tenant.is_active,
            created_at=tenant.created_at,
            role=link.role,
        )
        for link, tenant in rows
    ]


async def get_tenant_detail(
    db: AsyncSession, tenant_id: uuid.UUID, user: User
) -> TenantResponse:
    """Returns tenant details if the requesting user is a member.

    Security: validates membership via UserTenantLink before returning data,
    or bypasses if the user is impersonating this workspace.

    Args:
        db: Active async database session.
        tenant_id: UUID of the target workspace (tenant).
        user: The authenticated User making the request.

    Returns:
        TenantResponse with the user's role.

    Raises:
        HTTPException 404: If not found or user is not a member.
    """
    is_impersonating = getattr(user, "impersonate_tenant_id", None) == str(tenant_id)
    
    if is_impersonating:
        tenant = await db.get(Tenant, tenant_id)
        if not tenant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
        return TenantResponse(
            id=tenant.id,
            name=tenant.name,
            is_active=tenant.is_active,
            created_at=tenant.created_at,
            role=TenantRole.MEMBER,
        )

    result = await db.execute(
        select(UserTenantLink, Tenant)
        .join(Tenant, UserTenantLink.tenant_id == Tenant.id)
        .where(
            UserTenantLink.user_id == user.id,
            UserTenantLink.tenant_id == tenant_id,  # tenant isolation filter
        )
    )
    row = result.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or you are not a member.",
        )

    link, tenant = row
    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        is_active=tenant.is_active,
        created_at=tenant.created_at,
        role=link.role,
    )


async def get_tenant_members(
    db: AsyncSession, tenant_id: uuid.UUID, requesting_user: User
) -> list[TenantMemberResponse]:
    """Returns all members of an organization.

    Security: verifies the requesting user is a member of the organization before
    returning the member list. Filters all queries by tenant_id.

    Args:
        db: Active async database session.
        tenant_id: UUID of the workspace to query.
        requesting_user: The authenticated User making the request.

    Returns:
        List of WorkspaceMemberResponse.

    Raises:
        HTTPException 403: If the requesting user is not a member.
    """
    is_impersonating = getattr(requesting_user, "impersonate_tenant_id", None) == str(tenant_id)
    
    # Guard: caller must be a member of this workspace (or impersonating)
    if not is_impersonating:
        caller_role = await _get_user_role_in_tenant(db, requesting_user.id, tenant_id)
        if not caller_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this organization.",
            )

    # Fetch all members, with tenant_id filter enforced
    result = await db.execute(
        select(UserTenantLink, User)
        .join(User, UserTenantLink.user_id == User.id)
        .where(UserTenantLink.tenant_id == tenant_id)  # tenant isolation filter
        .order_by(UserTenantLink.joined_at)
    )
    rows = result.all()

    return [
        TenantMemberResponse(
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=link.role,
            joined_at=link.joined_at,
        )
        for link, user in rows
    ]


# ─── Plan Seeder ───────────────────────────────────────────────────────────────


async def seed_plans(db: AsyncSession) -> None:
    """Seeds the default billing plans if they do not already exist.

    Called once at application startup. Idempotent — safe to call multiple times.

    Args:
        db: Active async database session.
    """
    existing = await db.execute(select(Plan))
    if existing.scalars().first():
        logger.debug("Plans table already seeded, skipping.")
        return

    plans = [
        Plan(
            tier=PlanTier.FREE,
            display_name="Free Trial",
            price_usd_monthly=0.0,
            max_documents=20,
            max_queries_per_month=500,
            max_file_size_mb=10,
        ),
        Plan(
            tier=PlanTier.PRO,
            display_name="Pro",
            price_usd_monthly=29.0,
            max_documents=500,
            max_queries_per_month=10_000,
            max_file_size_mb=50,
        ),
        Plan(
            tier=PlanTier.ENTERPRISE,
            display_name="Enterprise",
            price_usd_monthly=199.0,
            max_documents=-1,  # unlimited
            max_queries_per_month=-1,  # unlimited
            max_file_size_mb=200,
        ),
    ]
    db.add_all(plans)
    await db.commit()
    logger.info("Seeded %d billing plans.", len(plans))
