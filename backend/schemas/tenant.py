import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from backend.models.user_tenant import TenantRole

# ─── Workspace CRUD ────────────────────────────────────────────────────────────


class TenantCreate(BaseModel):
    """Payload for creating a new Organization (Tenant)."""

    name: str = Field(..., min_length=2, max_length=100, description="Name of the organization")


class TenantResponse(BaseModel):
    """Organization details as seen by a member, including the caller's role."""

    id: uuid.UUID
    name: str
    is_active: bool
    created_at: datetime
    # The role of the currently authenticated user within this organization
    role: TenantRole

    class Config:
        from_attributes = True


# ─── Member Management ─────────────────────────────────────────────────────────


class TenantMemberResponse(BaseModel):
    """A member's profile and role within a specific organization."""

    user_id: uuid.UUID
    email: str
    full_name: str
    role: TenantRole
    joined_at: datetime

    class Config:
        from_attributes = True


# ─── Plan & Subscription ───────────────────────────────────────────────────────


class PlanResponse(BaseModel):
    """Public representation of a billing plan."""

    id: uuid.UUID
    tier: str
    display_name: str
    price_usd_monthly: float
    max_documents: int
    max_queries_per_month: int
    max_file_size_mb: int

    class Config:
        from_attributes = True


class SubscriptionResponse(BaseModel):
    """Active subscription details for a workspace, including usage counters."""

    id: uuid.UUID
    status: str
    queries_used_this_month: int
    documents_count: int
    current_period_start: datetime
    current_period_end: datetime | None
    plan: PlanResponse

    class Config:
        from_attributes = True
