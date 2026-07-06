import json
import logging
from typing import Any, AsyncIterator

import tiktoken
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import settings
from backend.services.cache_service import SemanticCacheService
from backend.services.search_service import HybridSearchService

logger = logging.getLogger(__name__)

# Pricing per million tokens for gpt-4o-mini (as of 2025)
_PRICE_PER_1M_INPUT = 0.150   # USD
_PRICE_PER_1M_OUTPUT = 0.600  # USD

# Maximum token budget for chat history before compression kicks in
_MAX_HISTORY_TOKENS = 2000

SYSTEM_PROMPT = """You are a helpful AI assistant. Answer the user's question strictly based on the provided context.
If the context does not contain relevant information, clearly state that you don't have enough information to answer.
Do NOT make up information that is not supported by the context.

CONTEXT:
{context}
"""


def _count_tokens(messages: list[dict[str, str]], model: str = "gpt-4o-mini") -> int:
    """Estimates the total token count for a list of messages.

    Args:
        messages: A list of OpenAI-format message dicts.
        model: The model name used to select the correct tokenizer.

    Returns:
        Estimated total token count.
    """
    try:
        enc = tiktoken.encoding_for_model(model)
    except KeyError:
        enc = tiktoken.get_encoding("cl100k_base")

    # Each message has ~4 overhead tokens plus role + content
    total = sum(4 + len(enc.encode(m.get("role", ""))) + len(enc.encode(m.get("content", ""))) for m in messages)
    return total + 2  # reply priming overhead


def _compress_chat_history(
    history: list[dict[str, str]],
    max_tokens: int = _MAX_HISTORY_TOKENS,
    model: str = "gpt-4o-mini",
) -> list[dict[str, str]]:
    """Trims the oldest messages from chat history to stay within the token budget.

    Preserves the most recent turns (LIFO compression). The user's most recent
    message is NOT passed through history — it is appended separately — so this
    function only operates on the prior conversation context.

    Args:
        history: The full chat history as a list of message dicts.
        max_tokens: Maximum total tokens allowed for history.
        model: Tokenizer to use.

    Returns:
        A trimmed version of the history that fits within max_tokens.
    """
    if not history:
        return []

    compressed = list(history)
    while _count_tokens(compressed) > max_tokens and len(compressed) > 0:
        compressed.pop(0)  # Remove the oldest message

    if len(compressed) < len(history):
        logger.info(
            "Compressed chat history from %d to %d messages to fit token budget.",
            len(history), len(compressed),
        )
    return compressed


def _calculate_cost(prompt_tokens: int, completion_tokens: int) -> float:
    """Calculates the USD cost of an LLM call based on token counts.

    Args:
        prompt_tokens: Number of tokens in the prompt (input).
        completion_tokens: Number of tokens in the response (output).

    Returns:
        Estimated cost in USD.
    """
    return (
        prompt_tokens / 1_000_000 * _PRICE_PER_1M_INPUT
        + completion_tokens / 1_000_000 * _PRICE_PER_1M_OUTPUT
    )


class RAGService:
    """Orchestrates the full Advanced RAG pipeline.

    Enhanced Pipeline for each query:
        1. Cache Check: Look up a semantically similar cached answer (avoids LLM call).
        2. Hybrid Search: Combined Dense (Qdrant) + Sparse (Postgres FTS) retrieval with RRF.
        3. Augment: Build a structured prompt injecting the retrieved context.
        4. Generate: Call the LLM, tracking token usage and cost.
        5. Cache Store: Save the new answer into the semantic cache.
    """

    def __init__(
        self,
        hybrid_search_service: HybridSearchService,
        cache_service: SemanticCacheService,
    ) -> None:
        self._openai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self._hybrid_search = hybrid_search_service
        self._cache = cache_service

    def _build_context(self, chunks: list[dict[str, Any]]) -> str:
        """Formats the retrieved chunks into a numbered context block."""
        return "\n\n---\n\n".join(
            f"[Source: {chunk['source']}, Chunk #{chunk['chunk_index']}]\n{chunk['text']}"
            for chunk in chunks
        )

    async def generate_answer(
        self,
        workspace_id: str,
        query: str,
        db_session: AsyncSession,
        chat_history: list[dict[str, str]] | None = None,
    ) -> dict[str, Any]:
        """Runs the full Advanced RAG pipeline and returns the answer with metadata.

        Args:
            workspace_id: The workspace ID for scoping all retrieval and cache operations.
            query: The user's question string.
            db_session: Active DB session for Postgres hybrid search.
            chat_history: Optional previous conversation messages.

        Returns:
            A dict with: "answer", "sources", "model", "prompt_tokens",
            "completion_tokens", "cost_usd", "from_cache".
        """
        # Step 1: Check semantic cache
        cached = await self._cache.get_cached_answer(tenant_id, query)
        if cached:
            return {**cached, "model": settings.LLM_MODEL, "prompt_tokens": 0, "completion_tokens": 0, "cost_usd": 0.0}

        # Step 2: Hybrid retrieval (Dense + Sparse + Rerank)
        context_chunks = await self._hybrid_search.search(
            tenant_id=tenant_id,
            query=query,
            db_session=db_session,
        )

        if not context_chunks:
            logger.info("No relevant context found for query='%s...' (tenant='%s').", query[:50], tenant_id)
            return {
                "answer": "I could not find any relevant information in the knowledge base to answer your question.",
                "sources": [],
                "model": settings.LLM_MODEL,
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "cost_usd": 0.0,
                "from_cache": False,
            }

        # Step 3: Augment — format context and compress history
        system_message = SYSTEM_PROMPT.format(context=self._build_context(context_chunks))
        compressed_history = _compress_chat_history(chat_history or [])

        messages: list[dict[str, str]] = [{"role": "system", "content": system_message}]
        messages.extend(compressed_history)
        messages.append({"role": "user", "content": query})

        # Step 4: Generate
        response = await self._openai.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=messages,
            temperature=0.2,
        )

        answer = response.choices[0].message.content or ""
        prompt_tokens = response.usage.prompt_tokens if response.usage else 0
        completion_tokens = response.usage.completion_tokens if response.usage else 0
        cost_usd = _calculate_cost(prompt_tokens, completion_tokens)

        logger.info(
            "Generated answer: model='%s', prompt_tokens=%d, completion_tokens=%d, cost=$%.6f.",
            settings.LLM_MODEL, prompt_tokens, completion_tokens, cost_usd,
        )

        # Step 5: Store in cache
        await self._cache.set_cached_answer(tenant_id, query, answer, context_chunks)

        return {
            "answer": answer,
            "sources": context_chunks,
            "model": settings.LLM_MODEL,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "cost_usd": cost_usd,
            "from_cache": False,
        }

    async def stream_answer(
        self,
        tenant_id: str,
        query: str,
        db_session: AsyncSession,
        chat_history: list[dict[str, str]] | None = None,
    ) -> AsyncIterator[dict]:
        """Runs the Advanced RAG pipeline and streams the LLM response token by token.

        Yields dicts of type:
            {"type": "sources", "data": [...]}
            {"type": "chunk", "data": "<token>"}
            {"type": "usage", "data": {"prompt_tokens": N, "completion_tokens": N, "cost_usd": N}}

        Args:
            tenant_id: The tenant ID for isolation.
            query: The user's question.
            db_session: Active DB session for hybrid search.
            chat_history: Optional previous messages.
        """
        # Step 1: Check semantic cache
        cached = await self._cache.get_cached_answer(tenant_id, query)
        if cached:
            yield {"type": "sources", "data": cached["sources"]}
            # Stream cached answer word-by-word for consistent UX
            for word in cached["answer"].split(" "):
                yield {"type": "chunk", "data": word + " "}
            yield {"type": "usage", "data": {"prompt_tokens": 0, "completion_tokens": 0, "cost_usd": 0.0, "from_cache": True}}
            return

        # Step 2: Hybrid retrieval
        context_chunks = await self._hybrid_search.search(
            tenant_id=tenant_id,
            query=query,
            db_session=db_session,
        )

        if not context_chunks:
            yield {"type": "chunk", "data": "I could not find any relevant information in the knowledge base to answer your question."}
            yield {"type": "usage", "data": {"prompt_tokens": 0, "completion_tokens": 0, "cost_usd": 0.0, "from_cache": False}}
            return

        yield {"type": "sources", "data": context_chunks}

        # Step 3: Augment
        system_message = SYSTEM_PROMPT.format(context=self._build_context(context_chunks))
        compressed_history = _compress_chat_history(chat_history or [])

        messages: list[dict[str, str]] = [{"role": "system", "content": system_message}]
        messages.extend(compressed_history)
        messages.append({"role": "user", "content": query})

        # Count prompt tokens before streaming starts
        prompt_tokens = _count_tokens(messages)

        # Step 4: Stream generation
        full_answer = ""
        async with await self._openai.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=messages,
            temperature=0.2,
            stream=True,
            stream_options={"include_usage": True},
        ) as stream:
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    full_answer += token
                    yield {"type": "chunk", "data": token}
                # Capture actual usage from the final chunk if available
                if hasattr(chunk, "usage") and chunk.usage:
                    prompt_tokens = chunk.usage.prompt_tokens
                    completion_tokens = chunk.usage.completion_tokens
                    cost_usd = _calculate_cost(prompt_tokens, completion_tokens)
                    yield {"type": "usage", "data": {
                        "prompt_tokens": prompt_tokens,
                        "completion_tokens": completion_tokens,
                        "cost_usd": cost_usd,
                        "from_cache": False,
                    }}

        # Step 5: Store in cache (fire-and-forget)
        await self._cache.set_cached_answer(tenant_id, query, full_answer, context_chunks)


from backend.services.search_service import hybrid_search_service
from backend.services.cache_service import cache_service

rag_service = RAGService(hybrid_search_service, cache_service)
