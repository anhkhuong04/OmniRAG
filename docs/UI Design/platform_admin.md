# UI Design - Platform Admin

## 1. Purpose

Platform Admin is the internal administration console for operating the OmniRAG SaaS platform.

This UI is used by the product owner, system operator, or internal support team. It is not used by customers. Platform Admin manages the SaaS layer, not customer knowledge data.

## 2. Scope

Platform Admin manages:

- Tenants / customer organizations
- Subscription plans
- Platform-wide usage
- Workspace overview across tenants
- System health
- Audit logs
- Support operations

Platform Admin should not behave like a normal Workspace user. It should not directly edit customer documents or chat inside customer workspaces unless a separate read-only support mode is implemented.

## 3. Main Navigation

```text
Platform Admin
├── Dashboard
├── Tenants
├── Workspaces
├── Plans
├── Usage & Quota
├── System Health
├── Audit Logs
└── Settings
```

## 4. Dashboard

### Goal

Give the system operator a quick view of platform health, business status, and abnormal usage.

### Main Widgets

```text
Total Tenants
Active Tenants
Total Workspaces
Total Users
Total Documents
Total Storage Used
Total Requests
LLM Cost
Embedding Cost
Failed Jobs
```

### Recommended Layout

```text
+----------------------------------------------------+
| KPI Cards                                          |
+----------------------------------------------------+
| Usage Chart              | Cost Chart              |
+----------------------------------------------------+
| Tenant Growth            | Workspace Health        |
+----------------------------------------------------+
| Recent Audit Events      | Failed Background Jobs  |
+----------------------------------------------------+
```

### Important States

- Normal
- High usage spike
- Tenant over quota
- Failed ingestion jobs
- Provider API error
- Storage nearing limit

## 5. Tenants Page

### Goal

Manage customer organizations.

### Table Columns

```text
Tenant Name
Owner Email
Plan
Status
Users
Workspaces
Storage Used
Monthly Requests
Created At
```

### Actions

```text
View Detail
Suspend Tenant
Reactivate Tenant
Change Plan
View Usage
View Audit Logs
```

### Tenant Status

```text
Active
Trial
Suspended
Past Due
Deleted
```

### Tenant Detail Tabs

```text
Overview
Workspaces
Members
Usage
Billing
Audit Logs
Settings
```

### Notes for Agent

- Tenant is the customer organization.
- Tenant owns users, subscription, quota, billing, and workspaces.
- Platform Admin can see all tenants.
- Platform Admin should not be modeled as a member of every tenant.

## 6. Workspaces Page

### Goal

Provide a platform-level overview of all workspaces.

### Table Columns

```text
Workspace Name
Tenant
Owner
Documents
Storage Used
Requests
Indexing Status
Created At
```

### Actions

```text
View Metadata
View Usage
View Indexing Jobs
Open Read-Only Support View
```

### Important Rule

Workspace content belongs to the tenant. Platform Admin can inspect metadata and operational status. Direct access to documents should require a dedicated support mode with audit logging.

## 7. Plans Page

### Goal

Manage subscription plans and quota limits.

### Plan Fields

```text
Plan Name
Monthly Price
Max Workspaces
Max Members
Max Storage
Max Documents
Max API Requests
Max Tokens
Allowed Models
Retention Days
```

### Actions

```text
Create Plan
Edit Plan
Archive Plan
Assign Plan to Tenant
```

### Example Plans

```text
Free
Starter
Pro
Enterprise
```

## 8. Usage & Quota Page

### Goal

Monitor usage across the entire SaaS platform.

### Metrics

```text
Requests
Input Tokens
Output Tokens
Embedding Tokens
Storage
Documents
Chunks
API Calls
Failed Jobs
```

### Breakdown Filters

```text
Date Range
Tenant
Workspace
Plan
Provider
Model
```

### Agent Notes

- Usage is aggregated at platform level.
- Tenant usage is derived from all workspaces under the tenant.
- Workspace usage is the lowest business-level aggregation.

## 9. System Health Page

### Goal

Monitor operational components.

### Sections

```text
API Server
Database
Redis / Queue
Object Storage
Vector Database
Embedding Provider
LLM Provider
Background Workers
```

### Status Values

```text
Healthy
Degraded
Down
Unknown
```

### Job Monitoring

```text
Pending Jobs
Running Jobs
Failed Jobs
Retrying Jobs
Completed Jobs
```

## 10. Audit Logs Page

### Goal

Track important administrative and security events.

### Table Columns

```text
Time
Actor
Action
Resource Type
Resource ID
Tenant
IP Address
Result
```

### Common Events

```text
Tenant Created
Tenant Suspended
Plan Changed
Quota Updated
Workspace Archived
Admin Login
API Key Revoked
Support View Opened
```

## 11. Settings Page

### Scope

Platform-level settings only.

### Settings Groups

```text
General
Provider Configuration
Default Plan
Security Policy
Email Templates
Feature Flags
```

## 12. Permission Rules

```text
System Admin
- Full access to Platform Admin console
- Can manage tenants, plans, usage, audit, and system settings

Support Admin
- Can view tenant metadata and operational logs
- Cannot change plans or delete tenants

Billing Admin
- Can view and manage plans, invoices, and payment-related settings
```

## 13. UX Principles

- Show operational status first.
- Avoid customer data exposure by default.
- Every destructive action requires confirmation.
- Every support access action must be logged.
- Use tables, filters, and drill-down pages instead of complex dashboards.
