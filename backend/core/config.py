from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OmniRAG API"
    VERSION: str = "0.1.0"
    
    # Future DB connection strings
    QDRANT_URL: str = "http://localhost:6333"
    POSTGRES_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/omnirag"
    OPENAI_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
