import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.tenant import Tenant


class WidgetConfig(SQLModel, table=True):
    """Represents a chat widget configuration for a tenant."""
    __tablename__ = "widget_configs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", index=True, nullable=False, unique=True)
    public_token: str = Field(nullable=False, max_length=255, index=True, unique=True)
    
    # Customization
    bot_name: str = Field(default="OmniRAG Assistant", max_length=100)
    welcome_message: str = Field(default="Hello! How can I help you today?", max_length=500)
    placeholder_text: str = Field(default="Type your message...", max_length=100)
    primary_color: str = Field(default="#3B82F6", max_length=20)
    position: str = Field(default="right", max_length=20)  # left or right
    avatar_url: Optional[str] = Field(default=None, max_length=1000)
    
    # Security
    is_active: bool = Field(default=True, nullable=False)
    allowed_domains: Optional[str] = Field(default=None, max_length=1000) # Comma separated domains

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    tenant: "Tenant" = Relationship()
