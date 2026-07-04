import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.document import Document


class DocumentChunk(SQLModel, table=True):
    """Stores individual text chunks from an ingested document.

    This table is required for Hybrid Search (Full-Text Search on Postgres
    combined with Dense Vector Search on Qdrant, merged via RRF).

    Attributes:
        id: Unique identifier for the chunk.
        tenant_id: Foreign key for mandatory tenant isolation on every query.
        document_id: Foreign key mapping to the source Document.
        text: The raw text content of this chunk.
        chunk_index: The sequential index of this chunk within the document.
        source: The source filename/URL for citation purposes.
        created_at: Timestamp when the chunk was created.
    """

    __tablename__ = "document_chunks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", index=True, nullable=False)
    document_id: uuid.UUID = Field(foreign_key="documents.id", index=True, nullable=False)
    text: str = Field(nullable=False)
    chunk_index: int = Field(nullable=False)
    source: str = Field(default="", max_length=512, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
