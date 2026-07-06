# UI Design - Workspace

## 1. Purpose

Workspace UI is where users actually use OmniRAG.

A workspace represents an isolated knowledge area inside a tenant. It contains documents, collections, embeddings, chat sessions, prompt settings, retrieval settings, and workspace-level members.

## 2. Scope

Workspace manages:

- Knowledge base
- Documents
- Collections
- Ingestion jobs
- Chat / RAG query
- Prompt configuration
- Retrieval configuration
- Workspace members
- Workspace usage
- Workspace settings

Workspace does not manage billing, subscription plans, or tenant-wide users.

## 3. Main Navigation

```text
Workspace
├── Dashboard
├── Knowledge Base
├── Documents
├── Collections
├── Chat / Playground
├── Prompt Settings
├── Retrieval Settings
├── Members
├── Usage
├── Activity Logs
└── Settings
```

## 4. Dashboard

### Goal

Show the health and readiness of the workspace knowledge system.

### Main Widgets

```text
Documents
Collections
Chunks
Storage Used
Indexed Documents
Failed Documents
Monthly Questions
Average Response Time
```

### Recommended Layout

```text
+----------------------------------------------------+
| Workspace KPI Cards                                |
+----------------------------------------------------+
| Indexing Status          | Query Usage             |
+----------------------------------------------------+
| Recent Documents         | Recent Chat Sessions    |
+----------------------------------------------------+
| Failed Jobs              | Retrieval Quality Notes |
+----------------------------------------------------+
```

### Important States

```text
Empty Workspace
Indexing In Progress
Ready
Partial Failure
No Documents
Quota Blocked
```

## 5. Knowledge Base Page

### Goal

Give users a high-level view of all knowledge available in the workspace.

### Sections

```text
Knowledge Summary
Collections
Recent Documents
Indexing Status
Data Sources
```

### Knowledge Summary

```text
Total Documents
Indexed Documents
Pending Documents
Failed Documents
Total Chunks
Last Updated
```

### Agent Notes

Knowledge Base is an overview page. Actual file operations happen in Documents and Collections.

## 6. Documents Page

### Goal

Upload, manage, and track document processing.

### Table Columns

```text
Document Name
Type
Collection
Uploaded By
Size
Status
Chunks
Updated At
```

### Document Status

```text
Uploaded
Processing
Chunking
Embedding
Indexed
Failed
Archived
Deleted
```

### Actions

```text
Upload Document
View Detail
Reprocess
Move to Collection
Archive
Delete
Download Original
```

### Document Detail Tabs

```text
Overview
Chunks
Metadata
Ingestion Logs
Related Chat References
```

### Upload Flow

```text
Select Files
Choose Collection
Add Metadata
Upload
Create Ingestion Job
Process Document
Generate Chunks
Generate Embeddings
Mark as Indexed
```

### Supported File Types

```text
PDF
DOCX
TXT
Markdown
CSV
HTML
```

## 7. Collections Page

### Goal

Group documents by topic, department, source, or use case.

### Table Columns

```text
Collection Name
Description
Documents
Status
Created By
Updated At
```

### Actions

```text
Create Collection
Edit Collection
Move Documents
Archive Collection
Delete Collection
```

### Business Rule

A document should belong to one primary collection. Future versions may support multiple tags or labels.

## 8. Chat / Playground Page

### Goal

Allow users to ask questions against workspace knowledge and validate RAG quality.

### Main Components

```text
Question Input
Conversation History
Answer Panel
Citations
Source Documents
Retrieval Debug Panel
Model Settings
```

### Basic User Flow

```text
User asks question
System retrieves relevant chunks
System builds prompt
LLM generates answer
System shows answer with citations
User can inspect sources
```

### Answer Requirements

A good answer should show:

```text
Final Answer
Citations
Source Document Names
Confidence / Relevance Indicator
Generated Time
Model Used
```

### Retrieval Debug Panel

For Admin or Editor only.

```text
Retrieved Chunks
Similarity Scores
Reranking Scores
Prompt Preview
Token Usage
Latency
```

## 9. Prompt Settings Page

### Goal

Configure workspace-level behavior of the AI assistant.

### Fields

```text
System Prompt
Answer Style
Citation Requirement
Fallback Message
Language Preference
Max Answer Length
```

### Example Settings

```text
Require Citations: Enabled
Fallback when no context: "I do not have enough information in this workspace."
Default Language: Vietnamese
```

### Permission Rule

Only Workspace Admin can edit prompt settings.

## 10. Retrieval Settings Page

### Goal

Configure how the workspace retrieves knowledge.

### Fields

```text
Retrieval Mode
Top K
Similarity Threshold
Reranker Enabled
Hybrid Search Enabled
Metadata Filters
Chunk Size
Chunk Overlap
```

### Retrieval Modes

```text
Vector Search
Keyword Search
Hybrid Search
```

### Agent Notes

Changing retrieval settings may affect future queries. Changing chunking settings may require document reprocessing.

## 11. Members Page

### Goal

Manage access inside the workspace.

### Table Columns

```text
Name
Email
Workspace Role
Added By
Status
Last Active
```

### Workspace Roles

```text
Workspace Admin
Editor
Member
Viewer
```

### Actions

```text
Add Member
Change Role
Remove From Workspace
```

### Permission Matrix

```text
Capability             Admin   Editor   Member   Viewer
Manage Settings         Yes     No       No       No
Manage Members          Yes     No       No       No
Upload Documents        Yes     Yes      No       No
Edit Documents          Yes     Yes      No       No
Chat                    Yes     Yes      Yes      Yes
View Sources            Yes     Yes      Yes      Yes
View Debug Panel         Yes     Yes      No       No
```

## 12. Usage Page

### Goal

Show workspace-level usage and cost drivers.

### Metrics

```text
Questions
Input Tokens
Output Tokens
Embedding Tokens
Documents Uploaded
Storage Used
Average Latency
Failed Queries
```

### Breakdown

```text
By User
By Date
By Model
By Collection
```

## 13. Activity Logs Page

### Goal

Track workspace-level operations.

### Common Events

```text
Document Uploaded
Document Indexed
Document Failed
Document Deleted
Collection Created
Prompt Updated
Retrieval Settings Updated
Member Added
Question Asked
```

### Table Columns

```text
Time
Actor
Action
Resource
Result
```

## 14. Settings Page

### Settings Groups

```text
General
Models
Data Retention
Access Control
Danger Zone
```

### General

```text
Workspace Name
Description
Default Language
Workspace Icon
```

### Models

```text
Default LLM Model
Default Embedding Model
Reranker Model
```

### Danger Zone

```text
Archive Workspace
Delete Workspace
```

## 15. UX Principles

- Workspace UI should focus on knowledge readiness and RAG usage.
- Chat should always expose citations and source documents.
- Upload status must be visible and traceable.
- Admin-only diagnostic details should not clutter the normal user chat experience.
- Separate document management from chat experience.
- Every destructive action must require confirmation.
