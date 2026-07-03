import datetime
import uuid
from typing import List, Optional

from pydantic import BaseModel, Field

# ----------------------------------------------------------------
# Requests
# ----------------------------------------------------------------

class QueryRequest(BaseModel):
    """Payload for asking a question."""
    query: str = Field(..., description="Câu hỏi của người dùng")
    conversation_id: Optional[uuid.UUID] = Field(
        default=None, 
        description="ID của hội thoại nếu muốn tiếp tục context cũ. Nếu rỗng, hệ thống sẽ tạo hội thoại mới."
    )
    stream: bool = Field(default=False, description="Nếu True, API sẽ trả về Server-Sent Events (SSE)")

# ----------------------------------------------------------------
# Responses
# ----------------------------------------------------------------

class MessageResponse(BaseModel):
    """Represents a single message in a conversation."""
    id: uuid.UUID
    sender: str
    content: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    """Response returned for a non-streaming query."""
    conversation_id: uuid.UUID
    answer: str
    sources: List[dict] = Field(default_factory=list, description="Danh sách các chunk tài liệu được tham chiếu")

