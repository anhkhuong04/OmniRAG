import logging
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from backend.core.config import settings

logger = logging.getLogger(__name__)

# Create the async engine for PostgreSQL
engine = create_async_engine(
    settings.POSTGRES_URL,
    echo=False,  # Set to True to log all SQL queries (useful for debugging)
    future=True,
)

# Create a sessionmaker for AsyncSession
async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def create_db_and_tables() -> None:
    """Creates all tables in the database based on SQLModel metadata.
    
    In the initial phase, this is called at application startup.
    When the app grows, this should be replaced with Alembic migrations.
    """
    logger.info("Initializing database tables...")
    # Import all models to ensure they are registered with SQLModel.metadata
    from backend.models import __init__  # noqa: F401

    async with engine.begin() as conn:
        # Run synchronous create_all in the async connection
        await conn.run_sync(SQLModel.metadata.create_all)
        
    logger.info("Database tables initialized successfully.")


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency to provide a database session for a request."""
    async with async_session_maker() as session:
        yield session
