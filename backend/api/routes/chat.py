import json
import logging
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from backend.api.dependencies import DBSessionDep, TenantIDDep
from backend.models.conversation import Conversation
from backend.models.message import Message
from backend.schemas.chat import ChatResponse, QueryRequest
from backend.services.rag_service import rag_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/query")
async def chat_query(
    request: QueryRequest,
    tenant_id_str: TenantIDDep,
    session: DBSessionDep,
):
    """
    Truy vấn hệ thống RAG để lấy câu trả lời. Hỗ trợ Server-Sent Events (SSE) để streaming.
    """
    tenant_id = uuid.UUID(tenant_id_str)
    
    # 1. Quản lý Conversation
    if request.conversation_id:
        result = await session.execute(
            select(Conversation).where(
                Conversation.id == request.conversation_id,
                Conversation.tenant_id == tenant_id
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
        )
        session.add(conversation)
        await session.commit()
        await session.refresh(conversation)
        
    # 2. Lưu câu hỏi (User message) vào DB
    user_message = Message(
        id=uuid.uuid4(),
        conversation_id=conversation.id,
        tenant_id=tenant_id,
        sender="user",
        content=request.query
    )
    session.add(user_message)
    await session.commit()

    if request.stream:
        async def event_generator() -> AsyncGenerator[str, None]:
            assistant_content = ""
            
            try:
                # Trả về ID của conversation cho client biết ngay từ đầu luồng stream
                yield f"event: metadata\ndata: {json.dumps({'conversation_id': str(conversation.id)})}\n\n"
                
                async for chunk in rag_service.stream_answer(
                    tenant_id=str(tenant_id), query=request.query
                ):
                    if chunk["type"] == "sources":
                        yield f"event: sources\ndata: {json.dumps(chunk['data'])}\n\n"
                    elif chunk["type"] == "chunk":
                        content = chunk["data"]
                        assistant_content += content
                        yield f"event: message\ndata: {json.dumps({'text': content})}\n\n"
                        
                # 3. Sau khi stream xong, lưu Message của AI vào DB
                ai_message = Message(
                    id=uuid.uuid4(),
                    conversation_id=conversation.id,
                    tenant_id=tenant_id,
                    sender="assistant",
                    content=assistant_content
                )
                session.add(ai_message)
                await session.commit()
                yield "event: done\ndata: [DONE]\n\n"
                
            except Exception as e:
                logger.error(f"Error in streaming generation: {e}")
                yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    else:
        # Xử lý đồng bộ (Không stream)
        try:
            result = await rag_service.generate_answer(
                tenant_id=str(tenant_id), query=request.query
            )
            
            # Lưu AI message
            ai_message = Message(
                id=uuid.uuid4(),
                conversation_id=conversation.id,
                tenant_id=tenant_id,
                sender="assistant",
                content=result["answer"]
            )
            session.add(ai_message)
            await session.commit()
            
            return ChatResponse(
                conversation_id=conversation.id,
                answer=result["answer"],
                sources=result["sources"]
            )
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            raise HTTPException(status_code=500, detail=str(e))
