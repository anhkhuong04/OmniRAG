# UI Design - Tenant Admin

## 1. Purpose

Tenant Admin is the customer organization's administration console.

This UI is used by the company owner, team lead, or internal administrator who manages users, workspaces, quota, billing, and organization-level settings.

Tenant Admin manages the organization. It does not manage the entire SaaS platform.

## 2. Scope

Tenant Admin manages:

- Organization profile
- Tenant members
- Workspaces
- Workspace access
- Usage and quota
- Billing
- API keys
- Security settings
- Tenant audit logs

## 3. Main Navigation

```text
Tenant Admin
├── Dashboard
├── Workspaces
├── Members
├── Roles & Permissions
├── Usage & Quota
├── Billing
├── API Keys
├── Audit Logs
└── Settings
```

## 4. Dashboard

### Goal

Give the organization admin a clear view of how the company is using OmniRAG.

### Main Widgets

```text
Total Workspaces
Total Members
Total Documents
Storage Used
Monthly Requests
Token Usage
Current Plan
Quota Status
```

### Recommended Layout

```text
+----------------------------------------------------+
| Tenant KPI Cards                                   |
+----------------------------------------------------+
| Usage Trend              | Quota Status            |
+----------------------------------------------------+
| Workspace Usage          | Recent Activity         |
+----------------------------------------------------+
| Failed Ingestion Jobs    | Billing Summary         |
+----------------------------------------------------+
```

### Important States

- Near storage limit
- Near request limit
- Plan quota exceeded
- Workspace indexing failed
- Payment issue
- Inactive members

## 5. Workspaces Page

### Goal

Create and manage workspaces under the tenant.

### Table Columns

```text
Workspace Name
Description
Owner
Members
Documents
Storage Used
Status
Created At
```

### Actions

```text
Create Workspace
Open Workspace
Edit Workspace
Archive Workspace
Delete Workspace
Manage Members
View Usage
```

### Workspace Status

```text
Active
Archived
Indexing
Error
```

### Create Workspace Form

```text
Workspace Name
Description
Default Language
Owner
Permission Template
Default LLM Model
Default Embedding Model
```

### Business Rule

A tenant can have multiple workspaces. Each workspace should isolate knowledge, documents, chat history, members, and RAG configuration.

## 6. Members Page

### Goal

Manage all users who belong to the tenant.

### Table Columns

```text
Name
Email
Tenant Role
Workspace Access
Status
Last Login
Created At
```

### Actions

```text
Invite Member
Assign Tenant Role
Assign Workspace Access
Deactivate Member
Reactivate Member
Remove Member
```

### Member Status

```text
Invited
Active
Inactive
Suspended
Removed
```

### Invite Member Flow

```text
Enter Email
Select Tenant Role
Select Workspace Access
Send Invitation
User Accepts Invitation
User Becomes Active
```

## 7. Roles & Permissions Page

### Goal

Manage tenant-level and workspace-level access.

### Tenant Roles

```text
Tenant Owner
Tenant Admin
Billing Manager
Member
```

### Workspace Roles

```text
Workspace Admin
Editor
Member
Viewer
```

### Permission Matrix Example

```text
Capability                  Owner   Admin   Billing   Member
Manage Tenant Settings       Yes     Yes      No        No
Manage Billing               Yes     No       Yes       No
Create Workspace             Yes     Yes      No        No
Invite Members               Yes     Yes      No        No
View Usage                   Yes     Yes      Yes       No
```

### Agent Notes

- Tenant role controls organization-level actions.
- Workspace role controls actions inside a workspace.
- A user can be Tenant Member but Workspace Admin in a specific workspace.

## 8. Usage & Quota Page

### Goal

Show tenant-level consumption and quota status.

### Metrics

```text
Storage Used
Documents
Chunks
Requests
Input Tokens
Output Tokens
Embedding Tokens
API Calls
Active Users
```

### Breakdown

```text
By Workspace
By User
By Date
By Provider
By Model
```

### Quota Display

```text
Storage: 72GB / 100GB
Requests: 820k / 1M
Members: 45 / 50
Workspaces: 8 / 10
```

### UX Rule

Always show both absolute usage and percentage. Warn the user before quota is exceeded.

## 9. Billing Page

### Goal

Allow the tenant to understand and manage subscription.

### Sections

```text
Current Plan
Usage Summary
Payment Method
Invoices
Upgrade / Downgrade Plan
Billing Contact
```

### Important States

```text
Trial Active
Trial Expiring
Payment Failed
Past Due
Plan Active
Plan Cancelled
```

## 10. API Keys Page

### Goal

Allow tenant admins to create API keys for integrations.

### Table Columns

```text
Key Name
Scopes
Workspace Scope
Created By
Last Used
Expires At
Status
```

### Actions

```text
Create API Key
Rotate API Key
Revoke API Key
View Usage
```

### API Key Scopes

```text
Read Workspace
Write Documents
Chat Query
Manage Documents
View Usage
```

### Security Rule

The full API key is shown only once after creation.

## 11. Audit Logs Page

### Goal

Track tenant-level user and security actions.

### Table Columns

```text
Time
Actor
Action
Resource
Workspace
IP Address
Result
```

### Common Events

```text
Member Invited
Role Changed
Workspace Created
Document Uploaded
API Key Created
API Key Revoked
Billing Updated
Login Failed
```

## 12. Settings Page

### Settings Groups

```text
Organization Profile
Security
Authentication
Default Models
Data Retention
Notification
```

### Organization Profile

```text
Company Name
Logo
Timezone
Language
Billing Email
```

### Security

```text
Password Policy
Allowed Email Domains
Session Timeout
Two-Factor Authentication
SSO
```

## 13. Permission Rules

```text
Tenant Owner
- Full access to tenant, billing, members, and workspaces

Tenant Admin
- Manage members, workspaces, settings, and usage
- Cannot delete tenant unless explicitly allowed

Billing Manager
- Manage billing, invoices, and subscription
- Cannot manage documents or workspace content

Member
- Can only access assigned workspaces
```

## 14. UX Principles

- Tenant Admin UI should feel like an organization console.
- Workspace creation should be simple and guided.
- Quota and billing must be visible before the tenant hits limits.
- Member access must clearly show both tenant role and workspace role.
- Avoid mixing workspace document operations into Tenant Admin pages.
