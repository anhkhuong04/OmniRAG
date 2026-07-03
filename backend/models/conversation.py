import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.tenant import Tenant
    from backend.models.message import Message


class Conversation(SQLModel, table=True):
    """Represents a chat conversation session between an end-user and the assistant.
    
    Attributes:
        id: Unique identifier for the conversation session.
        tenant_id: Foreign key mapping to the Tenant.
        external_user_id: Optional client-defined user identifier for tracking history.
        created_at: Timestamp when the conversation started.
    """
    
    __tablename__ = "conversations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", index=True, nullable=False)
    external_user_id: Optional[str] = Field(default=None, index=True, max_length=255, nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    tenant: "Tenant" = Relationship(back_populates="conversations")
    messages: List["Message"] = Relationship(
        back_populates="conversation", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
