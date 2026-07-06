import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.workspace import Workspace
    from backend.models.user_tenant import UserTenantLink
    from backend.models.subscription import Subscription


class Tenant(SQLModel, table=True):
    """Represents a Tenant (Client) in the Multi-Tenant SaaS RAG platform.
    
    Attributes:
        id: Unique identifier for the tenant.
        name: Name of the tenant organization.
        is_active: Boolean flag indicating if the tenant is active.
        created_at: Timestamp when the tenant was created.
        updated_at: Timestamp when the tenant was last updated.
    """
    
    __tablename__ = "tenants"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    name: str = Field(nullable=False, max_length=255)
    is_active: bool = Field(default=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    workspaces: List["Workspace"] = Relationship(
        back_populates="tenant", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    member_links: List["UserTenantLink"] = Relationship(
        back_populates="tenant",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    subscription: Optional["Subscription"] = Relationship(
        back_populates="tenant",
        sa_relationship_kwargs={"uselist": False, "cascade": "all, delete-orphan"}
    )
