import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from backend.services.vector_service import VectorService
from backend.services.rerank_service import RerankerService
from backend.core.config import settings

logger = logging.getLogger(__name__)


class HybridSearchService:
    """Combines Dense (semantic) Search from Qdrant and Sparse (Full-Text) Search
    from PostgreSQL, then merges and reranks the results.

    Pipeline:
        1. Dense Search: Embed the query and retrieve top candidates from Qdrant.
        2. Sparse Search: Run a PostgreSQL Full-Text Search on document_chunks.
        3. RRF (Reciprocal Rank Fusion): Merge the two ranked lists without requiring
           score normalization, producing a single unified ranking.
        4. Rerank: Pass the merged candidates through a cross-encoder reranker
           (if configured) to get the final, most-relevant top_k chunks.
    """

    def __init__(self, vector_service: VectorService, reranker_service: RerankerService) -> None:
        self._vector_service = vector_service
        self._reranker = reranker_service

    def _reciprocal_rank_fusion(
        self,
        dense_results: list[dict[str, Any]],
        sparse_results: list[dict[str, Any]],
        k: int = 60,
    ) -> list[dict[str, Any]]:
        """Merges two ranked lists using Reciprocal Rank Fusion (RRF).

        RRF score formula: sum(1 / (k + rank_i)) across all lists.
        This approach is robust to different score scales between dense and sparse
        retrieval, so no normalization is needed.

        Args:
            dense_results: Ordered list of chunks from Qdrant (most relevant first).
            sparse_results: Ordered list of chunks from Postgres FTS (most relevant first).
            k: RRF smoothing constant (default 60 is the standard).

        Returns:
            A merged, deduplicated, and RRF-sorted list of chunks.
        """
        scores: dict[str, float] = {}
        chunk_map: dict[str, dict[str, Any]] = {}

        # Use (document_id, chunk_index) as a stable unique key for deduplication
        def make_key(chunk: dict) -> str:
            return f"{chunk.get('document_id', '')}_{chunk.get('chunk_index', '')}"

        for rank, chunk in enumerate(dense_results, start=1):
            key = make_key(chunk)
            scores[key] = scores.get(key, 0.0) + 1.0 / (k + rank)
            chunk_map[key] = chunk

        for rank, chunk in enumerate(sparse_results, start=1):
            key = make_key(chunk)
            scores[key] = scores.get(key, 0.0) + 1.0 / (k + rank)
            if key not in chunk_map:
                chunk_map[key] = chunk

        # Sort by RRF score descending
        sorted_keys = sorted(scores.keys(), key=lambda k: scores[k], reverse=True)
        merged = [chunk_map[key] for key in sorted_keys]

        logger.debug(
            "RRF merged %d dense + %d sparse -> %d unique candidates.",
            len(dense_results), len(sparse_results), len(merged),
        )
        return merged

    async def search(
        self,
        tenant_id: str,
        query: str,
        db_session: AsyncSession,
    ) -> list[dict[str, Any]]:
        """Performs a full hybrid search and returns the final ranked chunks.

        Args:
            tenant_id: Mandatory tenant ID for data isolation in all sub-searches.
            query: The user's natural language query.
            db_session: An active async SQLAlchemy session for Postgres FTS.

        Returns:
            The final list of top_k most relevant chunks after fusion and reranking.
        """
        top_k = settings.RAG_TOP_K
        candidates_limit = settings.RERANK_CANDIDATES

        # 1. Dense Search from Qdrant
        dense_results = await self._vector_service.search_similar_chunks(
            tenant_id=tenant_id,
            query=query,
            limit=candidates_limit,
        )

        # 2. Sparse Search (Full-Text Search) from PostgreSQL
        sparse_results = await self._full_text_search(
            tenant_id=tenant_id,
            query=query,
            limit=candidates_limit,
            session=db_session,
        )

        # 3. Merge with Reciprocal Rank Fusion
        merged_candidates = self._reciprocal_rank_fusion(dense_results, sparse_results)

        if not merged_candidates:
            logger.info("No results found from hybrid search for tenant='%s'.", tenant_id)
            return []

        # 4. Rerank the merged candidates
        final_results = await self._reranker.rerank(
            query=query,
            candidates=merged_candidates,
            top_k=top_k,
        )

        logger.info(
            "Hybrid search: dense=%d, sparse=%d, merged=%d, final=%d (tenant='%s').",
            len(dense_results), len(sparse_results), len(merged_candidates),
            len(final_results), tenant_id,
        )
        return final_results

    async def _full_text_search(
        self,
        tenant_id: str,
        query: str,
        limit: int,
        session: AsyncSession,
    ) -> list[dict[str, Any]]:
        """Runs a PostgreSQL Full-Text Search on the document_chunks table.

        Uses plainto_tsquery which handles noisy user input (punctuation, stopwords).
        Falls back to a LIKE query if FTS returns no results (ensures recall).

        Args:
            tenant_id: Mandatory filter for tenant isolation.
            query: The raw user query string.
            limit: Maximum number of results to return.
            session: Active database session.

        Returns:
            A list of chunk dicts compatible with the format from VectorService.
        """
        # SECURITY: tenant_id must always be in WHERE clause — use parameterized query
        sql = text(
            "SELECT dc.text, dc.chunk_index, dc.document_id::text, dc.source, "
            "ts_rank(to_tsvector('english', dc.text), plainto_tsquery('english', :query)) AS score "
            "FROM document_chunks dc "
            "WHERE dc.tenant_id = CAST(:tenant_id AS uuid) "
            "AND to_tsvector('english', dc.text) @@ plainto_tsquery('english', :query) "
            "ORDER BY score DESC "
            "LIMIT :limit"
        )

        try:
            result = await session.execute(
                sql,
                {"tenant_id": tenant_id, "query": query, "limit": limit},
            )
            rows = result.fetchall()

            chunks = [
                {
                    "text": row.text,
                    "score": float(row.score),
                    "document_id": row.document_id,
                    "source": row.source,
                    "chunk_index": row.chunk_index,
                }
                for row in rows
            ]
            logger.debug("Postgres FTS returned %d results for tenant='%s'.", len(chunks), tenant_id)
            return chunks

        except Exception as e:
            logger.warning("Postgres FTS failed for tenant='%s': %s. Returning empty list.", tenant_id, e)
            # Rollback the aborted transaction so the session is usable again
            await session.rollback()
            return []


from backend.services.vector_service import vector_service
from backend.services.rerank_service import reranker_service

hybrid_search_service = HybridSearchService(vector_service, reranker_service)
