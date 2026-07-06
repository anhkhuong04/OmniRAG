"""UsageLog model — tracks every ingest and query event per API key."""
import enum
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.api_key import APIKey
    from backend.models.tenant import Tenant
    from backend.models.workspace import Workspace
    from backend.models.document import Document


class UsageLogType(str, enum.Enum):
    """Classifies the type of usage event being logged."""

    INGEST = "ingest"   # Document upload & embedding
    QUERY = "query"     # RAG chat query


class UsageLog(SQLModel, table=True):
    """Immutable audit record of every billable event in the system.

    One row is written per API call that consumes resources:
      - INGEST: document upload → embedding API cost.
      - QUERY: RAG query → LLM token cost.

    Tenant isolation: all reads MUST filter by tenant_id.

    Attributes:
        id: Unique identifier for the log entry.
        tenant_id: FK to tenants — mandatory for isolation.
        api_key_id: FK to api_keys — nullable (JWT auth flows have no key).
        log_type: Whether this was an ingest or a query event.
        document_id: FK to documents — populated for INGEST events.
        chunks_created: Number of chunks stored — populated for INGEST events.
        prompt_tokens: Tokens in the LLM prompt — populated for QUERY events.
        completion_tokens: Tokens in the LLM response — populated for QUERY events.
        cost_usd: Estimated USD cost of this event.
        created_at: Immutable timestamp of the event.
    """

    __tablename__ = "usage_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)

    # Tenant isolation (mandatory filter on every read for billing)
    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", index=True, nullable=False)
    
    # Workspace isolation (optional for tracking usage per workspace)
    workspace_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="workspaces.id", index=True, nullable=True
    )

    # Which API key triggered this event (null for JWT-authenticated requests)
    api_key_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="api_keys.id", index=True, nullable=True
    )

    log_type: UsageLogType = Field(nullable=False)

    # --- INGEST event fields ---
    document_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="documents.id", nullable=True
    )
    chunks_created: Optional[int] = Field(default=None, nullable=True)

    # --- QUERY event fields ---
    prompt_tokens: Optional[int] = Field(default=None, nullable=True)
    completion_tokens: Optional[int] = Field(default=None, nullable=True)
    cost_usd: Optional[float] = Field(default=None, nullable=True)

    # Immutable timestamp
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    api_key: Optional["APIKey"] = Relationship(back_populates="usage_logs")
