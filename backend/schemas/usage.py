"""Pydantic schemas for usage statistics and API key management responses."""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

# ─── API Key Schemas (workspace-scoped) ───────────────────────────────────────


class WorkspaceAPIKeyCreate(BaseModel):
    """Payload for creating a new API key for a workspace."""

    name: str


class WorkspaceAPIKeyResponse(BaseModel):
    """Public view of an API key (raw secret never returned after creation)."""

    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class WorkspaceAPIKeyCreateResponse(WorkspaceAPIKeyResponse):
    """Returned ONCE at creation — includes the raw key. Store immediately."""

    raw_key: str


# ─── Usage Statistics ─────────────────────────────────────────────────────────


class UsageStatsResponse(BaseModel):
    """Aggregated usage metrics for a workspace's current billing period."""

    tenant_id: uuid.UUID
    plan_name: str
    plan_tier: str

    # Document limits
    documents_count: int
    max_documents: int      # -1 = unlimited

    # Query limits
    queries_used_this_month: int
    max_queries_per_month: int   # -1 = unlimited

    # Cost tracking
    total_cost_usd_this_month: float
    total_prompt_tokens: int
    total_completion_tokens: int

    # Billing period
    current_period_start: datetime
    current_period_end: Optional[datetime]

    class Config:
        from_attributes = True


class DailyUsagePoint(BaseModel):
    """A single data point for a time-series usage chart."""

    date: str           # ISO date string "2026-07-04"
    queries: int
    cost_usd: float


class MonthlyUsagePoint(BaseModel):
    """A single data point for a monthly time-series usage chart."""

    month: str          # "YYYY-MM"
    cost_usd: float
    prompt_tokens: int
    completion_tokens: int


class UsageHistoryResponse(BaseModel):
    """List of monthly usage points for the past 6 months."""
    
    tenant_id: uuid.UUID
    history: list[MonthlyUsagePoint]

