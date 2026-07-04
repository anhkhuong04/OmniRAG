import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict


class WidgetConfigBase(BaseModel):
    bot_name: str
    welcome_message: str
    placeholder_text: str
    primary_color: str
    position: str
    avatar_url: Optional[str] = None
    allowed_domains: Optional[str] = None


class WidgetConfigCreate(WidgetConfigBase):
    pass


class WidgetConfigUpdate(BaseModel):
    bot_name: Optional[str] = None
    welcome_message: Optional[str] = None
    placeholder_text: Optional[str] = None
    primary_color: Optional[str] = None
    position: Optional[str] = None
    avatar_url: Optional[str] = None
    allowed_domains: Optional[str] = None
    is_active: Optional[bool] = None


class WidgetConfigResponse(WidgetConfigBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    public_token: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class PublicWidgetConfigResponse(BaseModel):
    bot_name: str
    welcome_message: str
    placeholder_text: str
    primary_color: str
    position: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PublicWidgetChatRequest(BaseModel):
    query: str
    conversation_id: Optional[uuid.UUID] = None
    stream: bool = False
