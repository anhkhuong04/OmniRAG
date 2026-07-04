import logging
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from langchain_text_splitters import RecursiveCharacterTextSplitter

from backend.core.config import settings
from backend.services.vector_service import VectorService
from backend.services.cache_service import SemanticCacheService
from backend.models.document_chunk import DocumentChunk

logger = logging.getLogger(__name__)


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
    ) -> int:
        """Ingests raw text by chunking it and storing vectors in Qdrant and chunks in Postgres.

        Args:
            tenant_id: The tenant ID owning the document. Injected into all vectors.
            document_id: The document ID for this ingestion batch.
            text: The raw text content to process.
            filename: The source filename, stored in chunk metadata for citation.
            db_session: Active async DB session for saving chunks to Postgres.
            extra_metadata: Optional additional metadata to attach to every chunk.

        Returns:
            The number of chunks successfully ingested.
        """
        chunks = self.split_text(text)
        if not chunks:
            logger.warning(
                "No chunks produced for document_id='%s' (tenant='%s'). Skipping ingest.",
                document_id, tenant_id,
            )
            return 0

        base_meta = extra_metadata or {}
        metadata_list = [
            {"source": filename, "chunk_index": idx, **base_meta}
            for idx, _ in enumerate(chunks)
        ]

        # Step 1: Upsert embeddings into Qdrant (dense search)
        await self._vector_service.upsert_chunks(
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
        # (new data may change what the correct answer is)
        await self._cache_service.invalidate_tenant_cache(tenant_id)

        return len(chunks)

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


from backend.services.vector_service import vector_service
from backend.services.cache_service import cache_service

document_service = DocumentService(vector_service, cache_service)
