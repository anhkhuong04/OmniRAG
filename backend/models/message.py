import uuid
from datetime import datetime
from typing import TYPE_CHECKING
# pyrefly: ignore [missing-import]
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.conversation import Conversation


class Message(SQLModel, table=True):
    """Represents an individual message within a conversation session.
    
    Attributes:
        id: Unique identifier for the message.
        conversation_id: Foreign key mapping to the Conversation session.
        tenant_id: Foreign key mapping to the Tenant (acts as redundant tenant filter validation).
        sender: The sender role, typically 'user', 'assistant', or 'system'.
        content: The message text content.
        created_at: Timestamp when the message was sent.
    """
    
    __tablename__ = "messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    conversation_id: uuid.UUID = Field(foreign_key="conversations.id", index=True, nullable=False)
    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", index=True, nullable=False)
    sender: str = Field(nullable=False, max_length=50)
    content: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    conversation: "Conversation" = Relationship(back_populates="messages")
