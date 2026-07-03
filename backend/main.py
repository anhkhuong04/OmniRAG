from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import chat, documents
from backend.core.database import create_db_and_tables
from backend.services.vector_service import vector_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await create_db_and_tables()
    await vector_service.create_collection_if_not_exists()
    yield
    # Shutdown actions (if any)


app = FastAPI(
    title="OmniRAG API",
    description="Multi-Tenant RAG API Service",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Should be restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(documents.router)
app.include_router(chat.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
