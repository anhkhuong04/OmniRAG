# Database Design (PostgreSQL)

OmniRAG uses PostgreSQL (via SQLModel) as the primary metadata and relational data store.

## Core Entities

### User & Authentication
- **User**: System users (`id`, `email`, `hashed_password`, `is_system_admin`).

### Hierarchy & Organization
- **Tenant**: The billing organization (`id`, `name`, `is_active`).
- **Workspace**: Project/Data container (`id`, `tenant_id`, `name`, `is_active`).
- **UserTenantLink**: Maps Users to Tenants with roles (`owner`, `admin`, `member`).
- **UserWorkspaceLink**: Maps Users to Workspaces with roles (`owner`, `admin`, `member`, `viewer`).

### Billing & Quotas
- **Plan**: Defines limits (`tier`, `price`, `max_documents`, `max_queries_per_month`, `max_file_size_mb`).
- **Subscription**: Links a Tenant to a Plan (`tenant_id`, `plan_id`, usage counters).
- **UsageLog**: Immutable ledger for API/RAG usage tracking (Tokens, Costs) bound to `workspace_id`.

### Knowledge Base & RAG
- **APIKey**: Workspace-scoped API keys for integration (`key_hash`, `workspace_id`).
- **Document**: Uploaded files (`id`, `workspace_id`, `status`, `content_hash`).
- **DocumentChunk**: Text chunks for Full-Text Search (Sparse vector) (`workspace_id`, `document_id`, `text`).
- **Conversation / Message**: Chat history mapping (`workspace_id`, `conversation_id`, `content`, `sender`).

### Frontend Integration
- **WidgetConfig**: Customization settings for the embeddable chat widget (`workspace_id`, `public_token`, `bot_name`, `colors`).

## Indexes & Constraints

To ensure data integrity and query performance, the following constraints and indexes are enforced:

### Constraints (Uniqueness)
- `users`: `email` (UNIQUE)
- `tenants`: `name` (UNIQUE, optional)
- `workspaces`: `tenant_id`, `name` (UNIQUE)
- `user_tenant_link`: `user_id`, `tenant_id` (UNIQUE)
- `user_workspace_link`: `user_id`, `workspace_id` (UNIQUE)
- `api_keys`: `key_hash` (UNIQUE)
- `documents`: `workspace_id`, `content_hash` (UNIQUE)
- `widget_configs`: `workspace_id` (UNIQUE)
- `subscriptions`: `tenant_id` (UNIQUE for active subscription)

### Indexes (Query Optimization)
Crucial for RAG performance and dashboard analytics:
- `documents`: `workspace_id` (INDEX)
- `document_chunks`: `workspace_id` (INDEX)
- `document_chunks`: `document_id` (INDEX)
- `usage_logs`: `workspace_id` (INDEX)
- `messages`: `conversation_id` (INDEX)

## Design Principles
- **Strict Isolation**: Every data table explicitly stores `workspace_id` or `tenant_id` to prevent cross-tenant leakage.
- **Async First**: All database operations use `AsyncSession` to handle high concurrency.
