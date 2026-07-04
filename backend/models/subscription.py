import uuid
import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.tenant import Tenant


class PlanTier(str, enum.Enum):
    """Tier names for billing plans."""

    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class Plan(SQLModel, table=True):
    """Represents a billing/subscription plan.

    Limits are enforced at the API layer before each operation.
    Using -1 to indicate unlimited (for Enterprise tier).

    Attributes:
        id: Unique plan identifier.
        tier: Named tier (free/pro/enterprise).
        display_name: Human-readable name shown on pricing page.
        price_usd_monthly: Monthly price in USD (0.0 for Free tier).
        max_documents: Maximum number of documents per workspace (-1 = unlimited).
        max_queries_per_month: Maximum RAG queries per calendar month (-1 = unlimited).
        max_file_size_mb: Maximum size of a single uploaded file in MB.
    """

    __tablename__ = "plans"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    tier: PlanTier = Field(nullable=False, unique=True)
    display_name: str = Field(nullable=False, max_length=100)
    price_usd_monthly: float = Field(default=0.0, nullable=False)

    # Resource limits (-1 means unlimited)
    max_documents: int = Field(default=20, nullable=False)
    max_queries_per_month: int = Field(default=500, nullable=False)
    max_file_size_mb: int = Field(default=10, nullable=False)

    # Relationships
    subscriptions: list["Subscription"] = Relationship(back_populates="plan")


class Subscription(SQLModel, table=True):
    """Tracks the active plan subscription for a Tenant (Workspace).

    Payment status is driven by webhook callbacks from the payment gateway
    (Stripe / VNPay), NOT by UI redirect, to ensure the source of truth
    is always the gateway.

    Attributes:
        id: Unique subscription identifier.
        tenant_id: FK to the owning Tenant (Workspace).
        plan_id: FK to the subscribed Plan.
        status: Current billing status (active, past_due, cancelled).
        current_period_start: Start of the current billing period.
        current_period_end: End of the current billing period.
        queries_used_this_month: Rolling counter for rate-limit enforcement.
        documents_count: Cached count of documents for limit checks.
        gateway_subscription_id: External subscription ID from payment gateway.
    """

    __tablename__ = "subscriptions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", nullable=False, unique=True, index=True)
    plan_id: uuid.UUID = Field(foreign_key="plans.id", nullable=False)
    status: str = Field(default="active", nullable=False, max_length=50)

    current_period_start: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    current_period_end: Optional[datetime] = Field(default=None, nullable=True)

    # Usage counters (updated on each relevant API call)
    queries_used_this_month: int = Field(default=0, nullable=False)
    documents_count: int = Field(default=0, nullable=False)

    # External reference from payment gateway (null for Free tier)
    gateway_subscription_id: Optional[str] = Field(default=None, nullable=True, max_length=255)

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    plan: Optional["Plan"] = Relationship(back_populates="subscriptions")
    tenant: Optional["Tenant"] = Relationship(back_populates="subscription")
