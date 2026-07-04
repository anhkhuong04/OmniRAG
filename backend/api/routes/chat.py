import asyncio
import json
import logging
import uuid
from typing import AsyncGenerator, Optional

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from backend.api.dependencies import DBSessionDep, TenantContextDep
from backend.models.conversation import Conversation
from backend.models.message import Message
from backend.models.usage_log import UsageLog, UsageLogType
from backend.schemas.chat import ChatResponse, QueryRequest
from backend.services.rag_service import rag_service
from backend.services import plan_guard_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/query")
async def chat_query(
    request: QueryRequest,
    ctx: TenantContextDep,
    session: DBSessionDep,
):
    """
    Truy vấn hệ thống Advanced RAG. Hỗ trợ Server-Sent Events (SSE) để streaming.
    Tích hợp Semantic Cache, Hybrid Search, Reranking, và Token Tracking.
    """
    tenant_id = ctx.tenant_id
    api_key_id = ctx.api_key_id
    tenant_uuid = uuid.UUID(tenant_id)

    # Pre-flight: check monthly query quota before any expensive work
    await plan_guard_service.check_query_limit(session, tenant_id)

    # 1. Quản lý Conversation
    if request.conversation_id:
        result = await session.execute(
            select(Conversation).where(
                Conversation.id == request.conversation_id,
                Conversation.tenant_id == tenant_uuid,
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(id=uuid.uuid4(), tenant_id=tenant_uuid)
        session.add(conversation)
        await session.commit()
        await session.refresh(conversation)

    # 2. Lưu câu hỏi của người dùng
    user_message = Message(
        id=uuid.uuid4(),
        conversation_id=conversation.id,
        tenant_id=tenant_uuid,
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
                
                # Write usage log and increment quota counter
                usage_log = UsageLog(
                    tenant_id=tenant_uuid,
                    api_key_id=uuid.UUID(api_key_id),
                    log_type=UsageLogType.QUERY,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    cost_usd=cost_usd,
                )
                session.add(usage_log)
                await session.commit()

                asyncio.create_task(
                    plan_guard_service.increment_query_counter(
                        db=session, tenant_id=tenant_id
                    )
                )

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
                tenant_id=tenant_id,
                query=request.query,
                db_session=session,
            )

            prompt_tokens = result_data.get("prompt_tokens") or 0
            completion_tokens = result_data.get("completion_tokens") or 0
            cost_usd = result_data.get("cost_usd") or 0.0

            ai_message = Message(
                id=uuid.uuid4(),
                conversation_id=conversation.id,
                tenant_id=tenant_uuid,
                sender="assistant",
                content=result_data["answer"],
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                cost_usd=cost_usd,
            )
            session.add(ai_message)
            await session.commit()

            # Write usage log and increment quota counter (non-blocking)
            usage_log = UsageLog(
                tenant_id=tenant_uuid,
                api_key_id=uuid.UUID(api_key_id),
                log_type=UsageLogType.QUERY,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                cost_usd=cost_usd,
            )
            session.add(usage_log)
            await session.commit()

            asyncio.create_task(
                plan_guard_service.increment_query_counter(
                    db=session, tenant_id=tenant_id
                )
            )

            return ChatResponse(
                conversation_id=conversation.id,
                answer=result_data["answer"],
                sources=result_data["sources"],
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Error generating answer: %s", e)
            raise HTTPException(status_code=500, detail=str(e))
