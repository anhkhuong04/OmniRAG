# Tenant & Workspace Architecture

OmniRAG strictly enforces a **3-tier architecture** to separate billing, management, and data isolation.

## The 3-Tier Model

1. **Platform**
   - **Scope**: The entire OmniRAG system.
   - **Management**: System Admins.
   - **Responsibilities**: Manage all Tenants, global settings, view system-wide KPIs, and configure billing Plans.

2. **Tenant (Organization)**
   - **Scope**: A billing entity or company.
   - **Management**: Tenant Owners / Admins.
   - **Responsibilities**: Holds the subscription plan, pays bills, tracks overall usage quotas (documents/queries). A Tenant can contain multiple Workspaces.

3. **Workspace**
   - **Scope**: A specific project, product, or department.
   - **Management**: Workspace Owners / Admins.
   - **Responsibilities**: Logical data boundary. Documents, API Keys, Chat Logs, and Widget configs are all scoped to a specific `workspace_id`.

## Isolation Enforcement
- **Vector DB**: All Qdrant search/upsert operations are filtered strictly by `workspace_id`.
- **SQL DB**: All Postgres queries involving business entities (documents, messages, api keys) are filtered by `workspace_id`.
- **API Routes**: Integration routes use `WorkspaceContextDep` to safely inject the `workspace_id` from the API Key or JWT token.
