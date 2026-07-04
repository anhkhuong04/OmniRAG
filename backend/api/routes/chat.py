import json
import logging
import uuid
from typing import AsyncGenerator, Optional

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
    Truy vấn hệ thống Advanced RAG. Hỗ trợ Server-Sent Events (SSE) để streaming.
    Tích hợp Semantic Cache, Hybrid Search, Reranking, và Token Tracking.
    """
    tenant_id = uuid.UUID(tenant_id_str)

    # 1. Quản lý Conversation
    if request.conversation_id:
        result = await session.execute(
            select(Conversation).where(
                Conversation.id == request.conversation_id,
                Conversation.tenant_id == tenant_id,
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(id=uuid.uuid4(), tenant_id=tenant_id)
        session.add(conversation)
        await session.commit()
        await session.refresh(conversation)

    # 2. Lưu câu hỏi của người dùng
    user_message = Message(
        id=uuid.uuid4(),
        conversation_id=conversation.id,
        tenant_id=tenant_id,
        sender="user",
        content=request.query,
    )
    session.add(user_message)
    await session.commit()

    if request.stream:
        async def event_generator() -> AsyncGenerator[str, None]:
            assistant_content = ""
            usage_data: Optional[dict] = None

            try:
                yield f"event: metadata\ndata: {json.dumps({'conversation_id': str(conversation.id)})}\n\n"

                async for chunk in rag_service.stream_answer(
                    tenant_id=str(tenant_id),
                    query=request.query,
                    db_session=session,
                ):
                    if chunk["type"] == "sources":
                        yield f"event: sources\ndata: {json.dumps(chunk['data'])}\n\n"
                    elif chunk["type"] == "chunk":
                        content = chunk["data"]
                        assistant_content += content
                        yield f"event: token\ndata: {json.dumps(content)}\n\n"
                    elif chunk["type"] == "usage":
                        usage_data = chunk["data"]

                # 3. Lưu câu trả lời AI vào DB, kèm token usage
                prompt_tokens = usage_data.get("prompt_tokens", 0) if usage_data else 0
                completion_tokens = usage_data.get("completion_tokens", 0) if usage_data else 0
                cost_usd = usage_data.get("cost_usd", 0.0) if usage_data else 0.0

                ai_message = Message(
                    id=uuid.uuid4(),
                    conversation_id=conversation.id,
                    tenant_id=tenant_id,
                    sender="assistant",
                    content=assistant_content,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    cost_usd=cost_usd,
                )
                session.add(ai_message)
                await session.commit()

                if usage_data:
                    yield f"event: usage\ndata: {json.dumps(usage_data)}\n\n"
                yield "event: done\ndata: [DONE]\n\n"

            except Exception as e:
                logger.error("Error in streaming generation: %s", e)
                yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    else:
        # Non-streaming path
        try:
            result_data = await rag_service.generate_answer(
                tenant_id=str(tenant_id),
                query=request.query,
                db_session=session,
            )

            ai_message = Message(
                id=uuid.uuid4(),
                conversation_id=conversation.id,
                tenant_id=tenant_id,
                sender="assistant",
                content=result_data["answer"],
                prompt_tokens=result_data.get("prompt_tokens"),
                completion_tokens=result_data.get("completion_tokens"),
                cost_usd=result_data.get("cost_usd"),
            )
            session.add(ai_message)
            await session.commit()

            return ChatResponse(
                conversation_id=conversation.id,
                answer=result_data["answer"],
                sources=result_data["sources"],
            )
        except Exception as e:
            logger.error("Error generating answer: %s", e)
            raise HTTPException(status_code=500, detail=str(e))
