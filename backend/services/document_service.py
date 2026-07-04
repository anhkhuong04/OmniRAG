"""
document_service.py

Handles document ingestion: chunking text, coordinating with VectorService,
and running the embedding pipeline as a background asyncio task.

Ingestion flow:
  1. Caller: validate plan limits + hash idempotency (before calling this service).
  2. Caller: create Document(status="pending") in DB.
  3. Caller: call `run_ingestion_background(...)` which schedules asyncio.create_task().
  4. HTTP response returns immediately (202 Accepted).
  5. Background task: status → "processing" → chunk+embed+upsert → "completed" or "failed".
  6. Background task: writes UsageLog, increments subscription counter.
"""
import asyncio
import hashlib
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import HTTPException, status

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_text_splitters import RecursiveCharacterTextSplitter

from backend.core.config import settings
from backend.core.database import async_session_maker
from backend.models.document import Document
from backend.models.document_chunk import DocumentChunk
from backend.models.usage_log import UsageLog, UsageLogType
from backend.services.vector_service import VectorService
from backend.services.cache_service import SemanticCacheService

logger = logging.getLogger(__name__)

# Retry configuration for the background task
_MAX_RETRIES = 3
_RETRY_DELAYS = [0.5, 1.0, 2.0]   # seconds between retry attempts


def compute_content_hash(text: str) -> str:
    """Returns the SHA-256 hex digest of the raw text content.

    Used for idempotency: if a document with the same hash already exists
    for this tenant, the upload is rejected with HTTP 409.

    Args:
        text: The raw text content to hash.

    Returns:
        64-character lowercase hex string.
    """
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


class DocumentService:
    """Handles document ingestion: chunking text and coordinating with VectorService.

    Responsibilities:
        - Accept raw text content from various sources (PDF-parsed, URL-scraped, etc.).
        - Split text into semantically meaningful chunks using LangChain's splitter.
        - Build metadata per chunk and delegate vector storage to VectorService.
        - Persist chunks to PostgreSQL (document_chunks) for Hybrid Search.
        - Invalidate the tenant's Semantic Cache on every ingest or delete.
    """

    def __init__(self, vector_service: VectorService, cache_service: SemanticCacheService) -> None:
        self._vector_service = vector_service
        self._cache_service = cache_service
        self._text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
        )

    def split_text(self, text: str) -> list[str]:
        """Splits a long text string into overlapping chunks.

        Uses RecursiveCharacterTextSplitter which tries to split on natural
        boundaries (paragraphs, sentences, words) before falling back to
        character-level splitting.

        Args:
            text: The full text content of a document.

        Returns:
            A list of text chunk strings.
        """
        chunks = self._text_splitter.split_text(text)
        logger.info(
            "Split document text into %d chunks (chunk_size=%d, overlap=%d).",
            len(chunks), settings.CHUNK_SIZE, settings.CHUNK_OVERLAP,
        )
        return chunks

    async def ingest_text(
        self,
        tenant_id: str,
        document_id: str,
        text: str,
        filename: str,
        db_session: AsyncSession,
        extra_metadata: dict[str, Any] | None = None,
    ) -> tuple[int, int]:
        """Ingests raw text synchronously (used internally by background task).

        Chunks the text, upserts embeddings to Qdrant, and persists chunks to Postgres.
        This method is called from within `_run_ingest_task` and manages its own
        DB session — do NOT call from an active HTTP request session.

        Args:
            tenant_id: The tenant ID owning the document.
            document_id: The document ID for this ingestion batch.
            text: The raw text content to process.
            filename: The source filename, stored in chunk metadata for citation.
            db_session: Active async DB session for saving chunks to Postgres.
            extra_metadata: Optional additional metadata to attach to every chunk.

        Returns:
            A tuple of (chunks_count, prompt_tokens_used).
        """
        chunks = self.split_text(text)
        if not chunks:
            logger.warning(
                "No chunks produced for document_id='%s' (tenant='%s'). Skipping ingest.",
                document_id, tenant_id,
            )
            return 0, 0

        base_meta = extra_metadata or {}
        metadata_list = [
            {"source": filename, "chunk_index": idx, **base_meta}
            for idx, _ in enumerate(chunks)
        ]

        # Step 1: Upsert embeddings into Qdrant (dense search)
        prompt_tokens = await self._vector_service.upsert_chunks(
            tenant_id=tenant_id,
            document_id=document_id,
            chunks=chunks,
            metadata_list=metadata_list,
        )

        # Step 2: Persist chunks into PostgreSQL (sparse / full-text search)
        tenant_uuid = uuid.UUID(tenant_id)
        doc_uuid = uuid.UUID(document_id)
        db_chunks = [
            DocumentChunk(
                tenant_id=tenant_uuid,
                document_id=doc_uuid,
                text=chunk,
                chunk_index=idx,
                source=filename,
            )
            for idx, chunk in enumerate(chunks)
        ]
        db_session.add_all(db_chunks)
        await db_session.commit()
        logger.info(
            "Stored %d chunks in Postgres for document='%s' (tenant='%s').",
            len(db_chunks), document_id, tenant_id,
        )

        # Step 3: Invalidate Semantic Cache for this tenant
        await self._cache_service.invalidate_tenant_cache(tenant_id)

        return len(chunks), prompt_tokens

    def run_ingestion_background(
        self,
        tenant_id: str,
        document_id: str,
        text: str,
        filename: str,
        api_key_id: Optional[str],
        extra_metadata: dict[str, Any] | None = None,
    ) -> asyncio.Task:
        """Schedules the ingestion pipeline as a non-blocking asyncio background task.

        The HTTP response (202 Accepted) is returned to the client immediately.
        The background task manages its own DB session lifecycle independently
        of the request session (which may be closed by the time the task runs).

        The task retries up to _MAX_RETRIES times with exponential backoff
        before marking the document as "failed".

        Args:
            tenant_id: The tenant ID owning the document.
            document_id: The document ID (must already exist in DB with status='pending').
            text: The raw text content to ingest.
            filename: The source filename for metadata.
            api_key_id: Optional API key ID — stored in UsageLog for billing attribution.
            extra_metadata: Optional extra chunk metadata.

        Returns:
            The scheduled asyncio.Task.
        """
        task = asyncio.create_task(
            self._run_ingest_task(
                tenant_id=tenant_id,
                document_id=document_id,
                text=text,
                filename=filename,
                api_key_id=api_key_id,
                extra_metadata=extra_metadata,
            ),
            name=f"ingest:{document_id}",
        )
        return task

    async def _run_ingest_task(
        self,
        tenant_id: str,
        document_id: str,
        text: str,
        filename: str,
        api_key_id: Optional[str],
        extra_metadata: dict[str, Any] | None,
    ) -> None:
        """Background coroutine: runs the full ingestion pipeline with retry.

        Each attempt:
          1. Opens an independent DB session.
          2. Sets document status to "processing".
          3. Calls ingest_text() for chunking+embedding.
          4. On success: sets "completed", writes UsageLog, increments subscription counter.
          5. On failure: waits _RETRY_DELAYS[attempt], retries up to _MAX_RETRIES times.
          6. After all retries exhausted: sets status to "failed" with error_message.
        """
        last_error: Optional[Exception] = None

        for attempt in range(_MAX_RETRIES):
            try:
                async with async_session_maker() as session:
                    # Mark as processing
                    doc_result = await session.execute(
                        select(Document).where(
                            Document.id == uuid.UUID(document_id),
                            Document.tenant_id == uuid.UUID(tenant_id),
                        )
                    )
                    doc = doc_result.scalar_one_or_none()
                    if not doc:
                        logger.error("Background task: document %s not found.", document_id)
                        return

                    doc.status = "processing"
                    doc.updated_at = datetime.now(timezone.utc)
                    session.add(doc)
                    await session.commit()

                    # Run the full pipeline
                    chunks_count, prompt_tokens = await self.ingest_text(
                        tenant_id=tenant_id,
                        document_id=document_id,
                        text=text,
                        filename=filename,
                        db_session=session,
                        extra_metadata=extra_metadata,
                    )

                    # Update document to completed
                    doc.status = "completed"
                    doc.chunk_count = chunks_count
                    doc.updated_at = datetime.now(timezone.utc)
                    session.add(doc)

                    # Cost: $0.02 per 1M tokens (text-embedding-3-small)
                    cost_usd = (prompt_tokens / 1_000_000.0) * 0.02
                    
                    # Write immutable UsageLog entry
                    usage_log = UsageLog(
                        tenant_id=uuid.UUID(tenant_id),
                        api_key_id=uuid.UUID(api_key_id) if api_key_id else None,
                        log_type=UsageLogType.INGEST,
                        document_id=uuid.UUID(document_id),
                        prompt_tokens=prompt_tokens,
                        cost_usd=cost_usd,
                        chunks_created=chunks_count,
                    )
                    session.add(usage_log)
                    await session.commit()

                # Increment subscription document counter (new session for isolation)
                async with async_session_maker() as session:
                    from backend.services import plan_guard_service
                    await plan_guard_service.increment_document_counter(session, tenant_id)

                logger.info(
                    "Background ingest completed: doc='%s', chunks=%d, tenant='%s'.",
                    document_id, chunks_count, tenant_id,
                )
                return  # Success — exit retry loop

            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Background ingest attempt %d/%d failed for doc='%s': %s",
                    attempt + 1, _MAX_RETRIES, document_id, exc,
                )
                if attempt < _MAX_RETRIES - 1:
                    await asyncio.sleep(_RETRY_DELAYS[attempt])

        # All retries exhausted — mark document as failed
        try:
            async with async_session_maker() as session:
                doc_result = await session.execute(
                    select(Document).where(
                        Document.id == uuid.UUID(document_id),
                        Document.tenant_id == uuid.UUID(tenant_id),
                    )
                )
                doc = doc_result.scalar_one_or_none()
                if doc:
                    doc.status = "failed"
                    doc.error_message = str(last_error)[:1000]
                    doc.updated_at = datetime.now(timezone.utc)
                    session.add(doc)
                    await session.commit()
        except Exception as cleanup_exc:
            logger.error("Failed to mark document %s as failed: %s", document_id, cleanup_exc)

        logger.error(
            "Background ingest permanently failed for doc='%s' (tenant='%s'): %s",
            document_id, tenant_id, last_error,
        )

    async def delete_document(
        self,
        tenant_id: str,
        document_id: str,
        db_session: AsyncSession,
    ) -> None:
        """Deletes all vectors and chunks associated with a document for a tenant.

        Args:
            tenant_id: The tenant ID owning the document.
            document_id: The document ID to delete.
            db_session: Active async DB session for deleting Postgres chunks.
        """
        # Delete from Qdrant
        await self._vector_service.delete_document_vectors(
            tenant_id=tenant_id,
            document_id=document_id,
        )

        # Delete from Postgres document_chunks
        from sqlalchemy import delete as sa_delete
        await db_session.execute(
            sa_delete(DocumentChunk).where(
                DocumentChunk.tenant_id == uuid.UUID(tenant_id),
                DocumentChunk.document_id == uuid.UUID(document_id),
            )
        )
        await db_session.commit()
        logger.info(
            "Deleted document document_id='%s' from Qdrant and Postgres for tenant='%s'.",
            document_id, tenant_id,
        )

        # Invalidate cache after deletion
        await self._cache_service.invalidate_tenant_cache(tenant_id)

    async def retry_ingestion(
        self,
        tenant_id: str,
        document_id: str,
        api_key_id: Optional[str],
        db_session: AsyncSession,
    ) -> Document:
        """Retries ingestion for a failed document."""
        tenant_uuid = uuid.UUID(tenant_id)
        doc_uuid = uuid.UUID(document_id)

        result = await db_session.execute(
            select(Document).where(Document.id == doc_uuid, Document.tenant_id == tenant_uuid)
        )
        doc = result.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

        if doc.status != "failed":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot retry document with status '{doc.status}'. Only 'failed' documents can be retried.",
            )

        if not doc.storage_path or not os.path.exists(doc.storage_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Original file content not found. Cannot retry.",
            )

        with open(doc.storage_path, "r", encoding="utf-8") as f:
            text = f.read()

        doc.status = "pending"
        doc.error_message = None
        doc.updated_at = datetime.now(timezone.utc)
        db_session.add(doc)
        await db_session.commit()

        self.run_ingestion_background(
            tenant_id=tenant_id,
            document_id=document_id,
            text=text,
            filename=doc.filename,
            api_key_id=api_key_id,
        )
        return doc

    async def reindex_document(
        self,
        tenant_id: str,
        document_id: str,
        api_key_id: Optional[str],
        db_session: AsyncSession,
    ) -> Document:
        """Re-indexes an existing document by deleting old vectors and chunks, then re-running ingestion."""
        tenant_uuid = uuid.UUID(tenant_id)
        doc_uuid = uuid.UUID(document_id)

        result = await db_session.execute(
            select(Document).where(Document.id == doc_uuid, Document.tenant_id == tenant_uuid)
        )
        doc = result.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

        if doc.status in ("processing", "deleting", "pending"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot re-index document while it is in '{doc.status}' status.",
            )

        if not doc.storage_path or not os.path.exists(doc.storage_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Original file content not found. Cannot re-index.",
            )

        # Mark as processing immediately to prevent overlapping operations
        doc.status = "processing"
        doc.error_message = None
        doc.updated_at = datetime.now(timezone.utc)
        db_session.add(doc)
        await db_session.commit()

        # Clean up old vectors and chunks
        await self.delete_document(tenant_id, document_id, db_session)

        # Set back to pending so the background task can pick it up
        doc.status = "pending"
        doc.updated_at = datetime.now(timezone.utc)
        db_session.add(doc)
        await db_session.commit()

        with open(doc.storage_path, "r", encoding="utf-8") as f:
            text = f.read()

        self.run_ingestion_background(
            tenant_id=tenant_id,
            document_id=document_id,
            text=text,
            filename=doc.filename,
            api_key_id=api_key_id,
        )
        return doc



from backend.services.vector_service import vector_service
from backend.services.cache_service import cache_service

document_service = DocumentService(vector_service, cache_service)
