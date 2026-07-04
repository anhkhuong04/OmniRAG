import json
import logging
import uuid
from typing import Any

from openai import AsyncOpenAI
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as qdrant_models

from backend.core.config import settings

logger = logging.getLogger(__name__)


class SemanticCacheService:
    """Semantic cache using Qdrant to avoid redundant LLM calls.

    Instead of exact string matching, this service embeds the query and searches
    for a semantically similar cached query belonging to the same tenant. If
    the cosine similarity exceeds RAG_CACHE_THRESHOLD, it returns the stored
    answer immediately without calling the LLM.

    This significantly reduces API costs when users ask similar questions.
    """

    def __init__(self) -> None:
        self._openai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self._qdrant = AsyncQdrantClient(url=settings.QDRANT_URL)
        self._cache_collection = settings.RAG_CACHE_COLLECTION
        self._threshold = settings.RAG_CACHE_THRESHOLD

    async def _ensure_cache_collection_exists(self) -> None:
        """Creates the cache collection in Qdrant if it does not exist."""
        collections = await self._qdrant.get_collections()
        existing_names = [c.name for c in collections.collections]

        if self._cache_collection not in existing_names:
            await self._qdrant.create_collection(
                collection_name=self._cache_collection,
                vectors_config=qdrant_models.VectorParams(
                    size=settings.QDRANT_VECTOR_SIZE,
                    distance=qdrant_models.Distance.COSINE,
                ),
            )
            await self._qdrant.create_payload_index(
                collection_name=self._cache_collection,
                field_name="tenant_id",
                field_schema=qdrant_models.PayloadSchemaType.KEYWORD,
            )
            logger.info("Created Qdrant cache collection: '%s'.", self._cache_collection)

    async def _get_embedding(self, text: str) -> list[float]:
        """Generates a single embedding vector for the given text."""
        response = await self._openai.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=[text],
        )
        return response.data[0].embedding

    async def get_cached_answer(
        self, tenant_id: str, query: str
    ) -> dict[str, Any] | None:
        """Searches for a semantically similar cached answer for this tenant.

        Args:
            tenant_id: The tenant ID for mandatory cache isolation.
            query: The user's query to look up in cache.

        Returns:
            A dict with "answer" and "sources" keys if a cache hit is found,
            or None if no sufficiently similar cached entry exists (cache miss).
        """
        if not settings.USE_SEMANTIC_CACHE:
            return None

        try:
            await self._ensure_cache_collection_exists()
            query_vector = await self._get_embedding(query)

            tenant_filter = qdrant_models.Filter(
                must=[
                    qdrant_models.FieldCondition(
                        key="tenant_id",
                        match=qdrant_models.MatchValue(value=tenant_id),
                    )
                ]
            )

            results = await self._qdrant.query_points(
                collection_name=self._cache_collection,
                query=query_vector,
                query_filter=tenant_filter,
                limit=1,
                with_payload=True,
            )

            if results.points and results.points[0].score >= self._threshold:
                hit = results.points[0]
                logger.info(
                    "Cache HIT for tenant='%s' (score=%.4f, query='%s...').",
                    tenant_id, hit.score, query[:50],
                )
                return {
                    "answer": hit.payload.get("answer", ""),
                    "sources": json.loads(hit.payload.get("sources_json", "[]")),
                    "from_cache": True,
                }

            logger.debug("Cache MISS for tenant='%s' (query='%s...').", tenant_id, query[:50])
            return None

        except Exception as e:
            logger.warning("Cache lookup failed: %s. Proceeding without cache.", e)
            return None

    async def set_cached_answer(
        self,
        tenant_id: str,
        query: str,
        answer: str,
        sources: list[dict[str, Any]],
    ) -> None:
        """Stores a query-answer pair in the semantic cache for this tenant.

        Args:
            tenant_id: The owning tenant ID.
            query: The original user query (used to generate the cache key vector).
            answer: The LLM-generated answer to cache.
            sources: The list of source chunks returned alongside the answer.
        """
        if not settings.USE_SEMANTIC_CACHE:
            return

        try:
            await self._ensure_cache_collection_exists()
            query_vector = await self._get_embedding(query)

            point = qdrant_models.PointStruct(
                id=str(uuid.uuid4()),
                vector=query_vector,
                payload={
                    "tenant_id": tenant_id,
                    "query": query,
                    "answer": answer,
                    "sources_json": json.dumps(sources),
                },
            )
            await self._qdrant.upsert(
                collection_name=self._cache_collection,
                points=[point],
            )
            logger.info(
                "Cached answer for tenant='%s' (query='%s...').", tenant_id, query[:50]
            )
        except Exception as e:
            logger.warning("Failed to store cache entry: %s.", e)

    async def invalidate_tenant_cache(self, tenant_id: str) -> None:
        """Deletes all cached entries for a tenant.

        Should be called whenever a tenant uploads or deletes a document to
        prevent stale cache entries from being served.

        Args:
            tenant_id: The tenant whose cache entries should be purged.
        """
        if not settings.USE_SEMANTIC_CACHE:
            return

        try:
            await self._ensure_cache_collection_exists()
            delete_filter = qdrant_models.Filter(
                must=[
                    qdrant_models.FieldCondition(
                        key="tenant_id",
                        match=qdrant_models.MatchValue(value=tenant_id),
                    )
                ]
            )
            await self._qdrant.delete(
                collection_name=self._cache_collection,
                points_selector=qdrant_models.FilterSelector(filter=delete_filter),
            )
            logger.info("Invalidated all cache entries for tenant='%s'.", tenant_id)
        except Exception as e:
            logger.warning("Failed to invalidate cache for tenant='%s': %s.", tenant_id, e)


# Singleton instance
cache_service = SemanticCacheService()
