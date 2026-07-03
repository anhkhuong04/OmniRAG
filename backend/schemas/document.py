import datetime
import uuid
from typing import Optional

from pydantic import BaseModel, Field

# ----------------------------------------------------------------
# Requests
# ----------------------------------------------------------------

class DocumentIngestRequest(BaseModel):
    """Payload for ingesting a document via raw text."""
    filename: str = Field(..., description="Tên file hoặc tiêu đề tài liệu")
    text: str = Field(..., description="Nội dung văn bản cần nạp vào hệ thống")
    metadata: Optional[dict] = Field(default=None, description="Metadata bổ sung cho tài liệu")

# ----------------------------------------------------------------
# Responses
# ----------------------------------------------------------------

class DocumentResponse(BaseModel):
    """Response returned when a document is created or retrieved."""
    id: uuid.UUID
    tenant_id: uuid.UUID
    filename: str
    status: str
    chunk_count: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

