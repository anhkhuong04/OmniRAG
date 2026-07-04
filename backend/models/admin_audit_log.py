import uuid
from datetime import datetime
from typing import Optional, Any
from sqlmodel import SQLModel, Field, JSON
from sqlalchemy.dialects.postgresql import JSONB

class AdminAuditLog(SQLModel, table=True):
    """Logs sensitive administrative actions taken by System Admins.

    Attributes:
        id: Unique identifier for the audit log entry.
        actor_user_id: UUID of the System Admin performing the action.
        action: String identifying the action (e.g., 'tenant_disabled').
        target_type: Type of resource affected (e.g., 'tenant', 'document').
        target_id: UUID of the target resource.
        metadata_json: Optional JSON context (e.g., reason, previous state).
        created_at: Timestamp of the action.
    """
    
    __tablename__ = "admin_audit_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    actor_user_id: uuid.UUID = Field(nullable=False, index=True)
    action: str = Field(nullable=False, max_length=100)
    target_type: str = Field(nullable=False, max_length=50)
    target_id: uuid.UUID = Field(nullable=False, index=True)
    
    # Store arbitrary data natively in Postgres JSONB
    metadata_json: Optional[dict[str, Any]] = Field(default=None, sa_type=JSONB)
    
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False, index=True)
