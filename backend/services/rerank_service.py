import logging
from typing import Any

import httpx

from backend.core.config import settings

logger = logging.getLogger(__name__)


class RerankerService:
    """Cross-encoder reranker to improve RAG retrieval precision.

    Supports three strategies:
    - "none": No reranking; returns candidates in their original order.
    - "flashrank": Local CPU-based ONNX reranker via the flashrank library.
      Fast and free, but slightly lower accuracy than Cohere.
    - "cohere": Cloud-based Cohere Rerank API. Highest accuracy but requires
      a COHERE_API_KEY and incurs API costs.
    """

    def __init__(self) -> None:
        self._reranker_type = settings.RERANKER_TYPE.lower()
        self._flashrank_model = None

        if self._reranker_type == "flashrank":
            self._load_flashrank()

        logger.info("RerankerService initialized with type='%s'.", self._reranker_type)

    def _load_flashrank(self) -> None:
        """Lazily loads the FlashRank model on first use."""
        try:
            from flashrank import Ranker  # type: ignore
            self._flashrank_model = Ranker(model_name="ms-marco-MiniLM-L-12-v2", cache_dir="/tmp/flashrank_cache")
            logger.info("FlashRank model loaded successfully.")
        except ImportError:
            logger.warning(
                "flashrank not installed. Run: pip install flashrank. "
                "Falling back to no reranking."
            )
            self._reranker_type = "none"

    async def rerank(
        self,
        query: str,
        candidates: list[dict[str, Any]],
        top_k: int,
    ) -> list[dict[str, Any]]:
        """Reranks a list of candidate chunks by relevance to the query.

        Args:
            query: The user's natural language question.
            candidates: A list of chunk dicts (must each contain a "text" key).
            top_k: The final number of chunks to return after reranking.

        Returns:
            A re-ordered and trimmed list of the top_k most relevant chunks.
        """
        if not candidates:
            return []

        if self._reranker_type == "flashrank":
            return await self._rerank_flashrank(query, candidates, top_k)
        elif self._reranker_type == "cohere":
            return await self._rerank_cohere(query, candidates, top_k)
        else:
            # No reranking — just trim candidates to top_k
            return candidates[:top_k]

    async def _rerank_flashrank(
        self, query: str, candidates: list[dict[str, Any]], top_k: int
    ) -> list[dict[str, Any]]:
        """Reranks using the local FlashRank model (sync execution)."""
        if self._flashrank_model is None:
            return candidates[:top_k]

        try:
            from flashrank import RerankRequest  # type: ignore

            passages = [{"id": i, "text": c["text"]} for i, c in enumerate(candidates)]
            request = RerankRequest(query=query, passages=passages)
            results = self._flashrank_model.rerank(request)

            # Map reranked results back to original chunk dicts, sorted by score
            reranked = []
            for result in results[:top_k]:
                original_chunk = candidates[result["id"]]
                original_chunk["rerank_score"] = result["score"]
                reranked.append(original_chunk)

            logger.info("FlashRank reranked %d candidates -> top %d.", len(candidates), top_k)
            return reranked
        except Exception as e:
            logger.error("FlashRank reranking failed: %s. Using original order.", e)
            return candidates[:top_k]

    async def _rerank_cohere(
        self, query: str, candidates: list[dict[str, Any]], top_k: int
    ) -> list[dict[str, Any]]:
        """Reranks using the Cohere Rerank API."""
        if not settings.COHERE_API_KEY:
            logger.warning("COHERE_API_KEY not configured. Falling back to original order.")
            return candidates[:top_k]

        texts = [c["text"] for c in candidates]

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    "https://api.cohere.com/v1/rerank",
                    json={"model": "rerank-english-v3.0", "query": query, "documents": texts, "top_n": top_k},
                    headers={"Authorization": f"Bearer {settings.COHERE_API_KEY}"},
                    timeout=15.0,
                )
                response.raise_for_status()
                data = response.json()

                reranked = []
                for result in data["results"]:
                    original_chunk = candidates[result["index"]]
                    original_chunk["rerank_score"] = result["relevance_score"]
                    reranked.append(original_chunk)

                logger.info("Cohere reranked %d candidates -> top %d.", len(candidates), top_k)
                return reranked
            except Exception as e:
                logger.error("Cohere reranking failed: %s. Falling back to original order.", e)
                return candidates[:top_k]


# Singleton instance
reranker_service = RerankerService()
