import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.tenant import Tenant


class Document(SQLModel, table=True):
    """Represents a document uploaded by a Tenant for RAG processing.
    
    Attributes:
        id: Unique identifier for the document.
        tenant_id: Foreign key mapping to the Tenant.
        filename: Original name of the uploaded file.
        file_type: File extension/type (e.g., pdf, txt, json, url).
        storage_path: Physical storage path or cloud URI of the file.
        status: Current processing status (e.g., processing, completed, failed).
        created_at: Timestamp when the document was uploaded.
        updated_at: Timestamp when the document status was last updated.
    """
    
    __tablename__ = "documents"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", index=True, nullable=False)
    filename: str = Field(nullable=False, max_length=512)
    file_type: str = Field(nullable=False, max_length=50)
    storage_path: Optional[str] = Field(default=None, nullable=True)
    status: str = Field(default="processing", max_length=50, nullable=False)
    chunk_count: int = Field(default=0, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    tenant: "Tenant" = Relationship(back_populates="documents")
