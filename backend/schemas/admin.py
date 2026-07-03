import datetime
import uuid
from typing import Optional

from pydantic import BaseModel, Field

# ─── Tenant Schemas ────────────────────────────────────────────────────────────


class TenantCreate(BaseModel):
    """Payload for creating a new Tenant."""
    name: str = Field(..., max_length=255, description="Tên tổ chức / khách hàng")


class TenantResponse(BaseModel):
    """Public representation of a Tenant."""
    id: uuid.UUID
    name: str
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ─── API Key Schemas ───────────────────────────────────────────────────────────


class APIKeyCreate(BaseModel):
    """Payload for creating a new API key for a tenant."""
    name: str = Field(..., max_length=100, description="Tên gợi nhớ cho API key (ví dụ: 'production-chatbot')")


class APIKeyResponse(BaseModel):
    """Public representation of an API key record (without the raw secret)."""
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class APIKeyCreateResponse(APIKeyResponse):
    """Returned ONCE at creation time — includes the raw key. Never stored in DB.

    The raw_key field will NOT appear in subsequent GET requests.
    Clients must store it securely immediately.
    """
    raw_key: str = Field(..., description="Raw API key — only returned once. Store it securely!")
