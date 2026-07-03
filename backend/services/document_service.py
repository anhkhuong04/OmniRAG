import logging
from typing import Any

from langchain_text_splitters import RecursiveCharacterTextSplitter

from backend.core.config import settings
from backend.services.vector_service import VectorService

logger = logging.getLogger(__name__)


class DocumentService:
    """Handles document ingestion: chunking text and coordinating with VectorService.

    Responsibilities:
        - Accept raw text content from various sources (PDF-parsed, URL-scraped, etc.).
        - Split text into semantically meaningful chunks using LangChain's splitter.
        - Build metadata per chunk and delegate vector storage to VectorService.
    """

    def __init__(self, vector_service: VectorService) -> None:
        self._vector_service = vector_service
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
        extra_metadata: dict[str, Any] | None = None,
    ) -> int:
        """Ingests raw text by chunking it and storing vectors in Qdrant.

        Args:
            tenant_id: The tenant ID owning the document. Injected into all vectors.
            document_id: The document ID for this ingestion batch.
            text: The raw text content to process.
            filename: The source filename, stored in chunk metadata for citation.
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

        await self._vector_service.upsert_chunks(
            tenant_id=tenant_id,
            document_id=document_id,
            chunks=chunks,
            metadata_list=metadata_list,
        )

        return len(chunks)

from backend.services.vector_service import vector_service
document_service = DocumentService(vector_service)
