from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import admin, auth, chat, documents, workspace, widget
from backend.api.routes import api_keys
from backend.core.database import create_db_and_tables, async_session_maker
from backend.services.vector_service import vector_service
from backend.services.workspace_service import seed_plans


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await create_db_and_tables()
    await vector_service.create_collection_if_not_exists()
    # Seed default billing plans (FREE / PRO / ENTERPRISE) if not present
    async with async_session_maker() as session:
        await seed_plans(session)
    yield
    # Shutdown actions (if any)


app = FastAPI(
    title="OmniRAG API",
    description="Multi-Tenant RAG API Service",
    version="0.2.0",
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
app.include_router(auth.router)        # /auth/*
app.include_router(workspace.router)   # /workspaces/*
app.include_router(api_keys.router)    # /workspaces/{id}/api-keys/*
app.include_router(admin.router)       # /admin/*
app.include_router(documents.router)   # /documents/*
app.include_router(chat.router)        # /chat/*
app.include_router(widget.router)      # /workspaces/*/widget and /public/widgets/*


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": app.version}
