import datetime
import uuid
from typing import Optional

from pydantic import BaseModel, Field

# ─── Requests ─────────────────────────────────────────────────────────────────


class DocumentIngestRequest(BaseModel):
    """Payload for ingesting a document via raw text."""

    filename: str = Field(..., description="Document title or original filename")
    text: str = Field(..., description="Raw text content to be chunked and embedded")
    metadata: Optional[dict] = Field(default=None, description="Optional extra metadata per chunk")


# ─── Responses ────────────────────────────────────────────────────────────────


class DocumentStatusResponse(BaseModel):
    """Full status representation of a document, including processing progress."""

    id: uuid.UUID
    tenant_id: uuid.UUID
    filename: str
    file_type: str
    status: str          # "pending" | "processing" | "completed" | "failed"
    chunk_count: int
    content_hash: Optional[str]
    error_message: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class DocumentIngestResponse(BaseModel):
    """Returned immediately (202 Accepted) after queuing the ingestion background task."""

    document_id: uuid.UUID
    status: str = "pending"
    message: str = "Document queued for processing. Poll /documents/{id}/status for updates."


class DocumentListResponse(BaseModel):
    """Paginated list of documents for a tenant."""

    items: list[DocumentStatusResponse]
    total: int


# Keep backward-compatible alias
DocumentResponse = DocumentStatusResponse
