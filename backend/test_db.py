import asyncio
import os
import sys

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from backend.core.database import Base
from backend.core.config import settings

# This script is to test if we can run the database check without errors.
async def test_db():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        from backend.models.workspace import Workspace
        from backend.models.tenant import Tenant
        from sqlalchemy import select
        
        result = await session.execute(select(Tenant).limit(1))
        tenant = result.scalar_one_or_none()
        print(f"Tenant: {tenant}")
        
        if tenant:
            result = await session.execute(select(Workspace).where(Workspace.tenant_id == tenant.id).limit(1))
            workspace = result.scalar_one_or_none()
            print(f"Workspace: {workspace}")

if __name__ == "__main__":
    asyncio.run(test_db())
