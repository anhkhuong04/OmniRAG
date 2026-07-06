"""
documents.py

Document management API routes (API-Key authenticated).

Ingestion flow (202 Accepted):
  POST /documents/ingest → validates plan limits + hash → 202 → background task
  GET  /documents/{id}/status → polling endpoint (called every 2-3s by frontend)
  GET  /documents         → list all documents for this workspace (paginated)
  DELETE /documents/{id}  → soft-delete + cleanup Qdrant + decrement subscription counter
"""
import hashlib
import logging
import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select, func

from backend.api.dependencies import DBSessionDep, WorkspaceContextDep, WorkspaceIDDep
from backend.models.document import Document
from backend.schemas.document import (
    DocumentIngestRequest,
    DocumentIngestResponse,
    DocumentListResponse,
    DocumentStatusResponse,
)
from backend.services.document_service import document_service, compute_content_hash
from backend.services import plan_guard_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])


# ─── POST /documents/ingest — Queue ingestion as background task ──────────────


@router.post(
    "/ingest",
    response_model=DocumentIngestResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def ingest_document(
    request: DocumentIngestRequest,
    ctx: WorkspaceContextDep,
    session: DBSessionDep,
):
    """Accepts a document for ingestion and returns immediately (202 Accepted).

    Pre-flight validation (synchronous, fast):
      1. Check plan document limit — raise 402 if exhausted.
      2. Check file size limit — raise 413 if too large.
      3. Check content hash for duplicate — raise 409 if already indexed.

    After validation, creates a Document record (status='pending') and schedules
    the chunking+embedding pipeline as a background asyncio task.

    The caller should poll GET /documents/{id}/status every 2–3 seconds to
    track progress until status becomes 'completed' or 'failed'.
    """
    workspace_id = ctx.workspace_id
    api_key_id = ctx.api_key_id

    tenant_id = ctx.tenant_id

    # ── 1. Plan enforcement ───────────────────────────────────────────────────
    await plan_guard_service.check_document_limit(session, tenant_id)
    await plan_guard_service.check_file_size(request.text, session, tenant_id)
    
    file_size_bytes = len(request.text.encode("utf-8"))
    await plan_guard_service.check_storage_limit(session, tenant_id, file_size_bytes)

    # ── 2. Idempotency check (content hash) ──────────────────────────────────
    content_hash = compute_content_hash(request.text)
    workspace_uuid = uuid.UUID(workspace_id)

    existing = await session.execute(
        select(Document).where(
            Document.workspace_id == workspace_uuid,
            Document.content_hash == content_hash,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A document with identical content already exists in this workspace.",
        )

    # ── 3. Create Document record (status=pending) ────────────────────────────
    doc_id = uuid.uuid4()
    
    # Save to local storage for idempotency/retry/reindex
    storage_dir = os.path.join(".storage", "workspaces", workspace_id)
    os.makedirs(storage_dir, exist_ok=True)
    storage_path = os.path.join(storage_dir, f"{doc_id}.txt")
    with open(storage_path, "w", encoding="utf-8") as f:
        f.write(request.text)

    new_doc = Document(
        id=doc_id,
        workspace_id=workspace_uuid,
        filename=request.filename,
        file_type="txt",
        file_size_bytes=file_size_bytes,
        status="pending",
        content_hash=content_hash,
        storage_path=storage_path,
    )
    session.add(new_doc)
    await session.commit()

    # ── 4. Schedule background task ───────────────────────────────────────────
    document_service.run_ingestion_background(
        workspace_id=workspace_id,
        tenant_id=tenant_id,
        document_id=str(doc_id),
        text=request.text,
        filename=request.filename,
        api_key_id=api_key_id,
        extra_metadata=request.metadata,
    )

    logger.info("Queued ingestion for document='%s' (workspace='%s').", doc_id, workspace_id)

    return DocumentIngestResponse(document_id=doc_id, status="pending")

# ─── POST /documents/{document_id}/retry — Retry failed document ──────────────


@router.post("/{document_id}/retry", response_model=DocumentStatusResponse)
async def retry_document_ingestion(
    document_id: uuid.UUID,
    ctx: WorkspaceContextDep,
    session: DBSessionDep,
):
    """Retries a failed document ingestion by re-reading its stored file."""
    doc = await document_service.retry_ingestion(
        workspace_id=ctx.workspace_id,
        tenant_id=ctx.tenant_id,
        document_id=str(document_id),
        api_key_id=ctx.api_key_id,
        db_session=session,
    )
    return DocumentStatusResponse.model_validate(doc)


# ─── POST /documents/{document_id}/reindex — Re-index existing document ───────


@router.post("/{document_id}/reindex", response_model=DocumentStatusResponse)
async def reindex_document(
    document_id: uuid.UUID,
    ctx: WorkspaceContextDep,
    session: DBSessionDep,
):
    """Re-indexes an existing document by clearing old vectors and re-running ingestion."""
    doc = await document_service.reindex_document(
        workspace_id=ctx.workspace_id,
        tenant_id=ctx.tenant_id,
        document_id=str(document_id),
        api_key_id=ctx.api_key_id,
        db_session=session,
    )
    return DocumentStatusResponse.model_validate(doc)


# ─── GET /documents — List all documents for this tenant ─────────────────────


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    tenant_id: TenantIDDep,
    session: DBSessionDep,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, le=200),
):
    """Returns a paginated list of all documents for the authenticated tenant.

    Results are ordered by created_at descending (newest first).
    Filters strictly by tenant_id — no cross-tenant data exposure.
    """
    tenant_uuid = uuid.UUID(tenant_id)

    total_result = await session.execute(
        select(func.count()).where(Document.tenant_id == tenant_uuid)
    )
    total = total_result.scalar_one()

    docs_result = await session.execute(
        select(Document)
        .where(Document.tenant_id == tenant_uuid)
        .order_by(Document.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    docs = docs_result.scalars().all()

    return DocumentListResponse(
        items=[DocumentStatusResponse.model_validate(d) for d in docs],
        total=total,
    )


# ─── GET /documents/{document_id}/status — Polling endpoint ──────────────────


@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    document_id: uuid.UUID,
    tenant_id: TenantIDDep,
    session: DBSessionDep,
):
    """Returns the current processing status of a document.

    Frontend polls this endpoint every 2–3 seconds after submitting an ingest
    request, until status equals 'completed' or 'failed'.

    Security: filters by tenant_id to prevent cross-tenant status disclosure.
    """
    result = await session.execute(
        select(Document).where(
            Document.id == document_id,
            Document.tenant_id == uuid.UUID(tenant_id),  # Tenant isolation
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    return DocumentStatusResponse.model_validate(doc)


# ─── DELETE /documents/{document_id} — Delete a document ─────────────────────


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: uuid.UUID,
    ctx: TenantContextDep,
    session: DBSessionDep,
):
    """Deletes a document: removes chunks from Postgres and vectors from Qdrant.

    Also decrements the subscription document counter.
    Only documents belonging to the authenticated tenant can be deleted.
    """
    tenant_id = ctx.tenant_id
    tenant_uuid = uuid.UUID(tenant_id)

    result = await session.execute(
        select(Document).where(
            Document.id == document_id,
            Document.tenant_id == tenant_uuid,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    # Delete vectors from Qdrant + chunks from Postgres
    await document_service.delete_document(
        tenant_id=tenant_id,
        document_id=str(document_id),
        db_session=session,
    )

    # Remove the document metadata record
    await session.delete(doc)
    await session.commit()

    # Decrement subscription counter (non-blocking)
    import asyncio
    asyncio.create_task(
        plan_guard_service.decrement_document_counter(session, tenant_id)
    )

    logger.info("Deleted document='%s' for tenant='%s'.", document_id, tenant_id)
