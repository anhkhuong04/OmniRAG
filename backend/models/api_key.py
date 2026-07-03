import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.tenant import Tenant


class APIKey(SQLModel, table=True):
    """Represents an API Key used to authenticate client requests.
    
    Attributes:
        id: Unique identifier for the API key record.
        tenant_id: Foreign key mapping to the Tenant.
        key_hash: SHA-256 hashed API key value.
        name: A friendly name for the key.
        is_active: Boolean flag indicating if the key is active.
        created_at: Timestamp when the key was created.
        expires_at: Optional timestamp when the key expires.
    """
    
    __tablename__ = "api_keys"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", index=True, nullable=False)
    key_hash: str = Field(index=True, nullable=False, unique=True)
    name: str = Field(nullable=False, max_length=100)
    is_active: bool = Field(default=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    expires_at: Optional[datetime] = Field(default=None, nullable=True)

    # Relationships
    tenant: "Tenant" = Relationship(back_populates="api_keys")
