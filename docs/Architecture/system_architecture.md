# System Architecture

OmniRAG is a robust, multi-tenant Retrieval-Augmented Generation (RAG) platform.

## High-Level Components

- **Frontend (React + Vite)**: Provides the Dashboard for Platform Admins, Tenant Owners, and Workspace Members. Includes Chat Playground, Knowledge Base management, and Settings.
- **Backend (FastAPI)**: Python-based API service handling business logic, authentication (JWT/API Keys), quota enforcement, and RAG pipelines.
- **Database (PostgreSQL via SQLModel)**: Stores metadata, user data, configurations, and sparse vectors (FTS) for hybrid search.
- **Vector DB (Qdrant)**: Stores dense document embeddings.
- **Cache (Redis - Optional)**: Semantic caching for identical or highly similar queries.
- **Background Jobs**: 
  - **MVP**: FastAPI BackgroundTasks or Asyncio worker.
  - **Recommended**: Redis Queue / Celery / Arq for retryable ingestion jobs.

## Core Workflows

1. **Document Ingestion**: 
   - `POST /api/workspaces/{workspace_id}/documents/ingest` (Via JWT) or `POST /api/documents/ingest` (Via API Key which implicitly resolves `workspace_id`).
   - Validates file size and plan limits.
   - Saves file and returns 202 Accepted.
   - Background task parses, chunks, embeds, and upserts into Qdrant & Postgres.
2. **Chat Query**:
   - `POST /api/workspaces/{workspace_id}/chat/query` (Via JWT) or `POST /api/chat/query` (Via API Key resolving `workspace_id`).
   - Validates query limits.
   - Generates embedding for user query.
   - Performs Hybrid Search (Dense in Qdrant + Sparse in Postgres).
   - Reranks results.
   - Streams LLM response back to client via SSE.
