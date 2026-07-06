import asyncio
import json
import logging
import secrets
import uuid
from typing import AsyncGenerator, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.dependencies import DBSessionDep, WorkspaceContextDep
from backend.models import Conversation, Message
from backend.models.usage_log import UsageLog, UsageLogType
from backend.models.widget import WidgetConfig
from backend.schemas.chat import ChatResponse
from backend.schemas.widget import (
    PublicWidgetChatRequest,
    PublicWidgetConfigResponse,
    WidgetConfigCreate,
    WidgetConfigResponse,
    WidgetConfigUpdate,
)
from backend.services import plan_guard_service
from backend.services.rag_service import rag_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["widget"])


# --- Dashboard APIs ---

@router.get("/workspaces/{workspace_id}/widget", response_model=WidgetConfigResponse)
async def get_widget_config(
    ctx: WorkspaceContextDep,
    session: DBSessionDep,
):
    """Lấy cấu hình Widget của Workspace."""
    workspace_uuid = uuid.UUID(ctx.workspace_id)
    result = await session.execute(
        select(WidgetConfig).where(WidgetConfig.workspace_id == workspace_uuid)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        # Tự động tạo config mặc định
        public_token = secrets.token_urlsafe(32)
        config = WidgetConfig(
            workspace_id=workspace_uuid,
            public_token=public_token,
        )
        session.add(config)
        await session.commit()
        await session.refresh(config)
        
    return config


@router.patch("/workspaces/{workspace_id}/widget", response_model=WidgetConfigResponse)
async def update_widget_config(
    update_data: WidgetConfigUpdate,
    ctx: WorkspaceContextDep,
    session: DBSessionDep,
):
    """Cập nhật cấu hình Widget."""
    workspace_uuid = uuid.UUID(ctx.workspace_id)
    result = await session.execute(
        select(WidgetConfig).where(WidgetConfig.workspace_id == workspace_uuid)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Widget config not found")
        
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(config, key, value)
        
    await session.commit()
    await session.refresh(config)
    return config


# --- Public APIs ---

def _validate_origin(config: WidgetConfig, request: Request):
    """Validate CORS / Origin for public widget."""
    if not config.allowed_domains:
        return
        
    origin = request.headers.get("origin") or request.headers.get("referer")
    if not origin:
        # Nếu không có header (VD gọi từ postman), tạm thời cho qua hoặc chặn tùy policy.
        # MVP: cho phép nếu không có origin để dễ test.
        return
        
    allowed = [d.strip() for d in config.allowed_domains.split(",")]
    if not any(origin.startswith(d) for d in allowed):
        raise HTTPException(status_code=403, detail="Origin not allowed")


@router.get("/public/widgets/{token}/config", response_model=PublicWidgetConfigResponse)
async def get_public_widget_config(
    token: str,
    request: Request,
    session: DBSessionDep,
):
    """API cho Client Widget tải config hiển thị giao diện."""
    result = await session.execute(
        select(WidgetConfig).where(WidgetConfig.public_token == token, WidgetConfig.is_active == True)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Widget not found or inactive")
        
    _validate_origin(config, request)
    return config


@router.post("/public/widgets/{token}/chat")
async def public_widget_chat(
    token: str,
    chat_request: PublicWidgetChatRequest,
    request: Request,
    session: DBSessionDep,
):
    """API chat dành riêng cho Public Widget, không cần API Key, xác thực qua token."""
    result = await session.execute(
        select(WidgetConfig).where(WidgetConfig.public_token == token, WidgetConfig.is_active == True)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Widget not found or inactive")
        
    _validate_origin(config, request)
    
    tenant_id = str(config.tenant_id)
    
    # Check quota
    await plan_guard_service.check_query_limit(session, tenant_id)
    
    # 1. Manage Conversation
    if chat_request.conversation_id:
        result = await session.execute(
            select(Conversation).where(
                Conversation.id == chat_request.conversation_id,
                Conversation.tenant_id == config.tenant_id,
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(id=uuid.uuid4(), tenant_id=config.tenant_id)
        session.add(conversation)
        await session.commit()
        await session.refresh(conversation)
        
    # 2. Save user message
    user_message = Message(
        id=uuid.uuid4(),
        conversation_id=conversation.id,
        tenant_id=config.tenant_id,
        sender="user",
        content=chat_request.query,
    )
    session.add(user_message)
    await session.commit()
    
    if chat_request.stream:
        async def event_generator() -> AsyncGenerator[str, None]:
            assistant_content = ""
            usage_data: Optional[dict] = None

            try:
                yield f"event: metadata\ndata: {json.dumps({'conversation_id': str(conversation.id)})}\n\n"

                async for chunk in rag_service.stream_answer(
                    tenant_id=tenant_id,
                    query=chat_request.query,
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

                # 3. Save AI message
                prompt_tokens = usage_data.get("prompt_tokens", 0) if usage_data else 0
                completion_tokens = usage_data.get("completion_tokens", 0) if usage_data else 0
                cost_usd = usage_data.get("cost_usd", 0.0) if usage_data else 0.0

                ai_message = Message(
                    id=uuid.uuid4(),
                    conversation_id=conversation.id,
                    tenant_id=config.tenant_id,
                    sender="assistant",
                    content=assistant_content,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    cost_usd=cost_usd,
                )
                session.add(ai_message)
                
                # Write usage log
                usage_log = UsageLog(
                    tenant_id=config.tenant_id,
                    log_type=UsageLogType.QUERY,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    cost_usd=cost_usd,
                    metadata_info={"source": "public_widget", "widget_id": str(config.id)}
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
                logger.error("Error in widget streaming generation: %s", e)
                yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")
        
    else:
        # Non-streaming
        try:
            result_data = await rag_service.generate_answer(
                tenant_id=tenant_id,
                query=chat_request.query,
                db_session=session,
            )

            prompt_tokens = result_data.get("prompt_tokens") or 0
            completion_tokens = result_data.get("completion_tokens") or 0
            cost_usd = result_data.get("cost_usd") or 0.0

            ai_message = Message(
                id=uuid.uuid4(),
                conversation_id=conversation.id,
                tenant_id=config.tenant_id,
                sender="assistant",
                content=result_data["answer"],
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                cost_usd=cost_usd,
            )
            session.add(ai_message)
            
            usage_log = UsageLog(
                tenant_id=config.tenant_id,
                log_type=UsageLogType.QUERY,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                cost_usd=cost_usd,
                metadata_info={"source": "public_widget", "widget_id": str(config.id)}
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
        except Exception as e:
            logger.error("Error generating widget answer: %s", e)
            raise HTTPException(status_code=500, detail=str(e))
