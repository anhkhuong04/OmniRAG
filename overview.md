# PROJECT OVERVIEW: OmniRAG SaaS

## 1. Project Objective & Context

**OmniRAG** is a Multi-Tenant Retrieval-Augmented Generation (RAG) "Chatbot-as-a-Service" backend platform.

The primary goal is to provide a centralized AI service that allows multiple external websites (Tenants) to integrate a smart, context-aware chatbot. The system must securely isolate knowledge bases, ensuring that a chatbot operating on Tenant A's website (e.g., an E-commerce store) only retrieves and generates answers based on Tenant A's data, without ever leaking Tenant B's data (e.g., a Logistics system).

## 2. Target Audience & Roles

- **Tenants (Clients):** System administrators or business owners of various domains (E-commerce, Logistics, SaaS). They use the platform to upload their private documents (PDFs, URLs, text) and obtain an `API_KEY` to embed the chatbot on their platforms.
- **End-Users:** Customers or employees who interact with the chatbot widget on the Tenants' websites.

## 3. Core Functionalities

The system acts as a headless API service divided into the following functional domains:

- **Multi-Tenancy & Authentication:**
  - Authenticate incoming requests using an `API_KEY`.
  - Strictly bind all data ingestion and retrieval operations to a specific `tenant_id`.
- **Data Ingestion Pipeline (Knowledge Management):**
  - Endpoints to accept raw documents (PDF, text) or JSON payloads (e.g., product catalogs).
  - Process data: Parse, chunk (text splitting), generate vector embeddings, and store them in a Vector Database with `tenant_id` attached as metadata.
- **Conversational RAG Pipeline (Query API):**
  - Endpoint to receive user chat messages alongside the Tenant's authentication.
  - Convert the query to an embedding.
  - Perform a similarity search in the Vector Database with a strict **metadata filter** (`tenant_id == current_tenant`).
  - Inject the retrieved context into a prompt template and route it to an LLM (OpenAI/Gemini) to generate the final response.

## 4. Tech Stack Definition

This project strictly adheres to a high-performance, asynchronous Python ecosystem.

- **Core Language:** Python 3.11+
- **Web Framework:** FastAPI (Leveraging `asyncio` for high concurrency).
- **RAG Orchestration:** LangChain (Handling chunking, prompt management, and LLM chains).
- **Vector Database:** Qdrant (Chosen for its robust payload/metadata filtering capabilities for multi-tenancy).
- **Relational Database:** PostgreSQL (Stores tenant configurations, API keys, and chat history).
- **ORM:** SQLModel (Combines SQLAlchemy and Pydantic for seamless FastAPI integration).
- **AI Models:** OpenAI API (GPT-4o-mini for generation, `text-embedding-3-small` for embeddings) OR Gemini API.
- **Infrastructure:** Docker & Docker Compose (Containerizing FastAPI, PostgreSQL, and Qdrant for easy deployment).

## 5. Architectural Blueprint (Clean Architecture)

The codebase should follow a layered architecture to separate routing, business logic, and data access:

- **`api/` (Routing Layer):** Defines FastAPI routers, endpoints, and dependency injections (e.g., Auth/API Key validation).
- **`services/` (Business Logic Layer):** Contains the core logic (`rag_service`, `vector_service`, `document_service`). This layer connects LangChain with the databases.
- **`models/` (Database Layer):** SQLModel classes representing database tables.
- **`schemas/` (Validation Layer):** Pydantic DTOs for validating incoming request bodies and formatting outgoing API responses.
- **`core/` (Configuration Layer):** Environment variables parsing, security hashing, and database connection initializations.

## 6. Coding Agent Directives (System Instructions)

When generating code for this project, the agent must:

1.  **Prioritize Security:** Never execute a Vector DB query without injecting the `tenant_id` payload filter.
2.  **Use Async/Await:** Ensure all I/O operations (database calls, LLM API requests) utilize asynchronous drivers (e.g., `AsyncQdrantClient`, `AsyncSession` for SQLAlchemy, async LangChain methods).
3.  **Type Hinting:** Maintain strict Python type hinting across all functions and methods.
4.  **Error Handling:** Use FastAPI's `HTTPException` to gracefully handle unauthorized access or LLM timeout errors.
