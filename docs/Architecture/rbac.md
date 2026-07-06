# Role-Based Access Control (RBAC)

Access control in OmniRAG operates at 3 levels corresponding to the architecture model.

## 1. System Admin (Platform Level)
- **Field**: `users.is_system_admin = True`
- **Permissions**: Full access to the Admin Dashboard (`/admin/*`). Can disable Tenants, configure billing Plans, and view system health.
- **Dependency**: `SystemAdminDep`

### Support Access Rule
- System Admin is **not** automatically a member of any Tenant or Workspace.
- By default, System Admins can only view operational metadata such as tenant status, usage, quota, job status, and audit logs.
- Customer workspace content access must be implemented through a dedicated **Admin Read-Only Support View** with strict audit logging. Impersonation of user actions is generally discouraged unless strictly necessary.

## 2. Tenant Roles (Organization Level)
Managed via `user_tenant_link` table.
- **Owner**: Full control over the Tenant. Can manage billing, create Workspaces, and invite other members to the Tenant.
- **Admin**: Can manage Workspaces and invite members, but cannot alter billing/subscription.
- **Billing Manager**: Can manage subscriptions, invoices, and billing settings.
- **Member**: Can view the Tenant dashboard and access Workspaces they are assigned to.

## 3. Workspace Roles (Data Level)
Managed via `user_workspace_link` table.
- **Admin**: Can generate/revoke API Keys, configure Widgets, manage (upload/delete) Documents in the Knowledge Base, and invite users to the Workspace.
- **Editor**: Can manage Documents and test the Chat Playground, but cannot manage API Keys, Widgets or Members.
- **Member**: Can upload Documents and use the Chat Playground.
- **Viewer**: Read-only access to Chat Playground. Cannot alter Knowledge Base or settings.

## API Authentication
- **Dashboard API**: Uses **JWT Bearer Tokens**. Issued via login, validated via `get_current_user`.
- **Integration API**: Uses **API Keys**. Bound to a specific `workspace_id`. Validated via `WorkspaceContextDep`.
