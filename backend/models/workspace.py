import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.tenant import Tenant
    from backend.models.api_key import APIKey
    from backend.models.document import Document
    from backend.models.conversation import Conversation
    from backend.models.user_workspace import UserWorkspaceLink
    from backend.models.widget import WidgetConfig


class Workspace(SQLModel, table=True):
    """Represents a Workspace within a Tenant.
    
    Attributes:
        id: Unique identifier for the workspace.
        tenant_id: Foreign key mapping to the Tenant.
        name: Name of the workspace (e.g., HR, Finance).
        description: Optional description of the workspace.
        is_active: Boolean flag indicating if the workspace is active.
        created_at: Timestamp when the workspace was created.
        updated_at: Timestamp when the workspace was last updated.
    """
    
    __tablename__ = "workspaces"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", index=True, nullable=False)
    name: str = Field(nullable=False, max_length=255)
    description: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    tenant: "Tenant" = Relationship(back_populates="workspaces")
    
    api_keys: List["APIKey"] = Relationship(
        back_populates="workspace", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    documents: List["Document"] = Relationship(
        back_populates="workspace", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    conversations: List["Conversation"] = Relationship(
        back_populates="workspace",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    member_links: List["UserWorkspaceLink"] = Relationship(
        back_populates="workspace",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    widget_config: Optional["WidgetConfig"] = Relationship(
        back_populates="workspace",
        sa_relationship_kwargs={"uselist": False, "cascade": "all, delete-orphan"}
    )
