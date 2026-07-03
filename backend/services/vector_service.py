import logging
import uuid
from typing import Any

from openai import AsyncOpenAI
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as qdrant_models

from backend.core.config import settings

logger = logging.getLogger(__name__)


class VectorService:
    """Handles all interactions with the Qdrant vector database and OpenAI embeddings.

    Responsibilities:
        - Generate vector embeddings using the configured OpenAI embedding model.
        - Ensure the Qdrant collection exists with the correct configuration.
        - Upsert chunked document text and metadata into Qdrant.
        - Perform tenant-isolated similarity searches.
        - Delete vectors belonging to a specific document.

    All operations that touch Qdrant MUST include a tenant_id filter to
    guarantee strict data isolation between tenants.
    """

    def __init__(self) -> None:
        self._openai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self._qdrant = AsyncQdrantClient(url=settings.QDRANT_URL)
        self._collection = settings.QDRANT_COLLECTION

    async def create_collection_if_not_exists(self) -> None:
        """Creates the Qdrant collection and payload indexes if they do not exist.

        The collection is configured with:
            - Cosine distance metric for semantic similarity.
            - A Keyword index on 'tenant_id' for fast multi-tenant filtering.
            - A Keyword index on 'document_id' for fast document-level deletion.
        """
        collections = await self._qdrant.get_collections()
        existing_names = [c.name for c in collections.collections]

        if self._collection not in existing_names:
            await self._qdrant.create_collection(
                collection_name=self._collection,
                vectors_config=qdrant_models.VectorParams(
                    size=settings.QDRANT_VECTOR_SIZE,
                    distance=qdrant_models.Distance.COSINE,
                ),
            )
            logger.info("Created Qdrant collection: '%s'", self._collection)

            # Create payload indexes for fast tenant and document filtering
            await self._qdrant.create_payload_index(
                collection_name=self._collection,
                field_name="tenant_id",
                field_schema=qdrant_models.PayloadSchemaType.KEYWORD,
            )
            await self._qdrant.create_payload_index(
                collection_name=self._collection,
                field_name="document_id",
                field_schema=qdrant_models.PayloadSchemaType.KEYWORD,
            )
            logger.info("Created payload indexes on 'tenant_id' and 'document_id'.")
        else:
            logger.debug("Collection '%s' already exists. Skipping creation.", self._collection)

    async def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Generates vector embeddings for a list of texts using OpenAI API.

        Args:
            texts: A list of text strings to embed.

        Returns:
            A list of embedding vectors (each vector is a list of floats).
        """
        response = await self._openai.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=texts,
        )
        vectors = [item.embedding for item in response.data]
        logger.debug("Generated %d embeddings using model '%s'.", len(vectors), settings.EMBEDDING_MODEL)
        return vectors

    async def upsert_chunks(
        self,
        tenant_id: str,
        document_id: str,
        chunks: list[str],
        metadata_list: list[dict[str, Any]],
    ) -> None:
        """Generates embeddings for chunks and upserts them into Qdrant with tenant metadata.

        Args:
            tenant_id: The unique ID of the owning tenant. Stored in vector payload.
            document_id: The unique ID of the source document. Stored in vector payload.
            chunks: A list of text chunk strings to be embedded and stored.
            metadata_list: A list of dicts (one per chunk) containing extra metadata
                           (e.g., page_number, source filename).
        """
        if not chunks:
            logger.warning("upsert_chunks called with an empty chunk list. Skipping.")
            return

        logger.info(
            "Generating embeddings for %d chunks (tenant='%s', document='%s')...",
            len(chunks), tenant_id, document_id,
        )
        vectors = await self.get_embeddings(chunks)

        points = [
            qdrant_models.PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "tenant_id": tenant_id,
                    "document_id": document_id,
                    "text": chunk,
                    "chunk_index": idx,
                    **meta,
                },
            )
            for idx, (chunk, vector, meta) in enumerate(zip(chunks, vectors, metadata_list))
        ]

        await self._qdrant.upsert(collection_name=self._collection, points=points)
        logger.info(
            "Upserted %d vectors into collection '%s' for tenant='%s'.",
            len(points), self._collection, tenant_id,
        )

    async def search_similar_chunks(
        self,
        tenant_id: str,
        query: str,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        """Finds the most semantically similar chunks for a query, scoped to a tenant.

        SECURITY: This method enforces tenant isolation by applying a mandatory
        FieldCondition filter on 'tenant_id' in every Qdrant search request.

        Args:
            tenant_id: The tenant ID to scope the search to.
            query: The user's query string.
            limit: Maximum number of results to return. Defaults to settings.RAG_TOP_K.

        Returns:
            A list of dicts, each containing 'text', 'score', and other metadata
            from the matched vector's payload.
        """
        top_k = limit or settings.RAG_TOP_K
        query_vector = (await self.get_embeddings([query]))[0]

        # MANDATORY tenant isolation filter — never remove this filter
        tenant_filter = qdrant_models.Filter(
            must=[
                qdrant_models.FieldCondition(
                    key="tenant_id",
                    match=qdrant_models.MatchValue(value=tenant_id),
                )
            ]
        )

        results = await self._qdrant.query_points(
            collection_name=self._collection,
            query=query_vector,
            query_filter=tenant_filter,
            limit=top_k,
            with_payload=True,
        )

        logger.info(
            "Similarity search found %d results for tenant='%s' (query='%s...').",
            len(results.points), tenant_id, query[:50],
        )

        return [
            {
                "text": hit.payload.get("text", ""),
                "score": hit.score,
                "document_id": hit.payload.get("document_id"),
                "source": hit.payload.get("source", "unknown"),
                "chunk_index": hit.payload.get("chunk_index"),
            }
            for hit in results.points
        ]

    async def delete_document_vectors(self, tenant_id: str, document_id: str) -> None:
        """Deletes all vectors associated with a specific document for a tenant.

        Args:
            tenant_id: The tenant ID owning the document.
            document_id: The document ID whose vectors will be deleted.
        """
        delete_filter = qdrant_models.Filter(
            must=[
                qdrant_models.FieldCondition(
                    key="tenant_id",
                    match=qdrant_models.MatchValue(value=tenant_id),
                ),
                qdrant_models.FieldCondition(
                    key="document_id",
                    match=qdrant_models.MatchValue(value=document_id),
                ),
            ]
        )

        await self._qdrant.delete(
            collection_name=self._collection,
            points_selector=qdrant_models.FilterSelector(filter=delete_filter),
        )
        logger.info(
            "Deleted vectors for document_id='%s' belonging to tenant='%s'.",
            document_id, tenant_id,
        )

# Create singleton instance
vector_service = VectorService()
