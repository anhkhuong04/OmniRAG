from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env file."""

    PROJECT_NAME: str = "OmniRAG API"
    VERSION: str = "0.1.0"

    # --- Database Connections ---
    POSTGRES_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/omnirag"

    # --- Qdrant Vector DB ---
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "omnirag_documents"
    QDRANT_VECTOR_SIZE: int = 1536  # Must match the embedding model output dimensions

    # --- OpenAI ---
    OPENAI_API_KEY: str = ""
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    LLM_MODEL: str = "gpt-4o-mini"

    # --- RAG Chunking Parameters ---
    CHUNK_SIZE: int = 600
    CHUNK_OVERLAP: int = 120
    RAG_TOP_K: int = 5  # Number of context chunks to retrieve per query

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
