import logging
import uuid
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_session

logger = logging.getLogger(__name__)

# DB Session Dependency
DBSessionDep = Annotated[AsyncSession, Depends(get_session)]

async def get_current_tenant_id(
    x_tenant_id: Annotated[str, Header(
        description="Tenant ID để định danh người dùng/tổ chức (Mock Auth).",
        alias="X-Tenant-ID"
    )]
) -> str:
    """Mock Authentication Dependency.
    
    Reads the tenant ID directly from the X-Tenant-ID header.
    In Phase 4, this will be replaced with real API Key validation.
    """
    if not x_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Tenant-ID header",
        )
        
    try:
        # Validate that it's a valid UUID
        uuid.UUID(x_tenant_id)
        return x_tenant_id
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid X-Tenant-ID format (must be a valid UUID)",
        )

# Mock Auth Dependency
TenantIDDep = Annotated[str, Depends(get_current_tenant_id)]

