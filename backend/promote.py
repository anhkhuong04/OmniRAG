import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.core.config import settings
from backend.models.user import User
from backend.core.security import hash_password
import uuid

async def main():
    engine = create_async_engine(settings.POSTGRES_URL)
    
    async with engine.begin() as conn:
        from sqlalchemy import text
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_system_admin BOOLEAN NOT NULL DEFAULT FALSE;"))
        except Exception as e:
            pass
            
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Check if admin user exists
        result = await session.execute(select(User).where(User.email == "admin@omnirag.com"))
        admin_user = result.scalar_one_or_none()
        
        if admin_user:
            admin_user.is_system_admin = True
            await session.commit()
            print("Admin user already exists. Set is_system_admin to True.")
        else:
            admin_user = User(
                id=uuid.uuid4(),
                email="admin@omnirag.com",
                hashed_password=hash_password("admin123"),
                full_name="System Administrator",
                is_active=True,
                is_verified=True,
                is_system_admin=True
            )
            session.add(admin_user)
            await session.commit()
            print("Created new admin user: admin@omnirag.com / admin123")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
