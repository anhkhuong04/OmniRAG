import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.workspace import Workspace
    from backend.models.usage_log import UsageLog


class Document(SQLModel, table=True):
    """Represents a document uploaded by a Tenant for RAG processing.
    
    Attributes:
        id: Unique identifier for the document.
        workspace_id: Foreign key mapping to the Workspace.
        filename: Original name of the uploaded file.
        file_type: File extension/type (e.g., pdf, txt, json, url).
        storage_path: Physical storage path or cloud URI of the file.
        content_hash: SHA-256 hash of raw content for duplicate detection.
        status: Current processing status (pending, processing, completed, failed).
        chunk_count: Number of chunks created during ingestion.
        error_message: Populated when status='failed', stores the error reason.
        created_at: Timestamp when the document was uploaded.
        updated_at: Timestamp when the document status was last updated.
    """
    
    __tablename__ = "documents"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    workspace_id: uuid.UUID = Field(foreign_key="workspaces.id", index=True, nullable=False)
    filename: str = Field(nullable=False, max_length=512)
    file_type: str = Field(nullable=False, max_length=50)
    file_size_bytes: int = Field(default=0, nullable=False)
    storage_path: Optional[str] = Field(default=None, nullable=True)
    # SHA-256 of raw text content — used for idempotency (reject duplicate uploads)
    content_hash: Optional[str] = Field(default=None, nullable=True, max_length=64, index=True)
    status: str = Field(default="pending", max_length=50, nullable=False)
    chunk_count: int = Field(default=0, nullable=False)
    error_message: Optional[str] = Field(default=None, nullable=True, max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    workspace: "Workspace" = Relationship(back_populates="documents")
