# 04 Knowledge Ingestion Flow

## 1. Mục tiêu

Flow này xử lý việc đưa dữ liệu của workspace/tenant vào hệ thống RAG.

Kết quả cuối cùng của flow là tài liệu được parse, chunk, embedding và lưu vào Qdrant với metadata bắt buộc để đảm bảo multi-tenancy.

Flow này phải hoàn thành trước khi Chat/RAG Query có thể trả lời dựa trên dữ liệu tenant.

---

## 2. Phạm vi

Flow bao gồm:

- Upload file hoặc nhận dữ liệu đầu vào
- Validate định dạng, dung lượng và quota
- Tạo document record trong PostgreSQL
- Tạo ingestion job
- Parse nội dung
- Clean text
- Chunk text
- Generate embedding
- Store vectors vào Qdrant
- Cập nhật trạng thái document/job

MVP ưu tiên:

```txt
PDF
TXT
JSON payload đơn giản
```

Có thể mở rộng sau:

```txt
DOCX
CSV
URL crawler
Notion
Google Drive
Confluence
```

---

## 3. Business Rules

### 3.1 Tenant Scope

Mọi document và vector phải thuộc về một workspace/tenant cụ thể.

Các field bắt buộc:

```txt
workspace_id / tenant_id
document_id
```

Không được tạo document hoặc vector nếu không resolve được workspace hiện tại.

---

### 3.2 Upload Permission

Chỉ user thuộc workspace mới được upload tài liệu.

Role được phép upload trong MVP:

```txt
Owner
Admin
Member
```

Role `Viewer` không được upload, xóa hoặc re-index tài liệu.

---

### 3.3 Quota Check

Trước khi nhận file, hệ thống phải kiểm tra quota của workspace.

Các quota tối thiểu:

```txt
max_documents
max_storage_mb
max_file_size_mb
```

Nếu vượt quota, request phải bị từ chối trước khi xử lý file.

---

### 3.4 Supported Input Types

MVP hỗ trợ:

```txt
.pdf
.txt
.json
```

File không hỗ trợ phải trả lỗi:

```txt
UNSUPPORTED_FILE_TYPE
```

---

### 3.5 Document Status

Document phải có trạng thái rõ ràng trong toàn bộ pipeline.

```txt
pending
processing
ready
failed
deleted
```

Ý nghĩa:

| Status | Ý nghĩa |
|---|---|
| `pending` | Đã nhận request, chưa xử lý |
| `processing` | Đang parse/chunk/embed |
| `ready` | Đã lưu vector thành công, có thể dùng để chat |
| `failed` | Pipeline lỗi |
| `deleted` | Document đã bị xóa logic hoặc vật lý |

---

### 3.6 Ingestion Job

Không xử lý ingestion nặng trực tiếp trong HTTP request.

HTTP request chỉ nên:

```txt
Validate request
→ Save file/metadata
→ Create document
→ Create ingestion job
→ Return document_id + status
```

Parse, chunk, embedding và Qdrant upsert nên chạy trong background job.

MVP có thể dùng:

```txt
FastAPI BackgroundTasks
```

Production-ready có thể nâng cấp:

```txt
Celery
RQ
Dramatiq
RabbitMQ
Redis Queue
```

---

### 3.7 Idempotency / Duplicate Content

Nên tính `content_hash` cho file hoặc payload.

Nếu cùng workspace upload lại file có nội dung trùng, hệ thống có thể:

```txt
Option A: Reject duplicate
Option B: Reuse existing document
Option C: Create new version
```

MVP chọn:

```txt
Reject duplicate within same workspace
```

Lỗi đề xuất:

```txt
DUPLICATE_DOCUMENT_CONTENT
```

---

### 3.8 Vector Metadata

Mỗi chunk lưu vào Qdrant bắt buộc có payload:

```json
{
  "tenant_id": "<workspace_id>",
  "document_id": "<document_id>",
  "chunk_index": 0,
  "text": "chunk content",
  "metadata": {
    "source": "filename.pdf",
    "page_number": 1
  }
}
```

Bắt buộc có:

```txt
tenant_id
document_id
chunk_index
text
```

Không được upsert vector thiếu `tenant_id`.

---

## 4. Main Flow

```txt
[1] User uploads document / sends JSON payload
    ↓
[2] Resolve current workspace
    ↓
[3] Check membership and role
    ↓
[4] Check plan quota
    ↓
[5] Validate file type and size
    ↓
[6] Calculate content hash
    ↓
[7] Create document record with status = pending
    ↓
[8] Store raw file / payload
    ↓
[9] Create ingestion job
    ↓
[10] Return document_id and status = pending
    ↓
[11] Background job starts
    ↓
[12] Update document status = processing
    ↓
[13] Parse content
    ↓
[14] Clean text
    ↓
[15] Chunk text
    ↓
[16] Generate embeddings
    ↓
[17] Upsert vectors to Qdrant with tenant_id filter metadata
    ↓
[18] Update document status = ready
    ↓
[19] Knowledge is available for RAG query
```

---

## 5. Alternative / Error Flows

### 5.1 Unsupported File Type

```txt
Upload file
→ Validate extension/MIME type
→ Unsupported
→ Return 400 UNSUPPORTED_FILE_TYPE
```

---

### 5.2 File Too Large

```txt
Upload file
→ Check file size
→ Exceeds plan limit
→ Return 413 FILE_TOO_LARGE
```

---

### 5.3 Document Quota Exceeded

```txt
Upload file
→ Count workspace documents
→ Exceeds max_documents
→ Return 403 DOCUMENT_QUOTA_EXCEEDED
```

---

### 5.4 Storage Quota Exceeded

```txt
Upload file
→ Calculate total storage usage
→ Exceeds max_storage_mb
→ Return 403 STORAGE_QUOTA_EXCEEDED
```

---

### 5.5 Duplicate Content

```txt
Upload file
→ Calculate content_hash
→ Existing document with same hash in workspace
→ Return 409 DUPLICATE_DOCUMENT_CONTENT
```

---

### 5.6 Parse Failed

```txt
Background job starts
→ Parse file
→ Parser error
→ Mark document = failed
→ Save error_message
```

---

### 5.7 Embedding Failed

```txt
Generate embeddings
→ Embedding provider timeout/rate limit
→ Retry if retry_count < max_retry
→ If still failed, mark document = failed
```

---

### 5.8 Qdrant Upsert Failed

```txt
Upsert vectors
→ Qdrant error
→ Retry
→ If failed, mark document = failed
```

Important: không được mark document `ready` nếu vector chưa được upsert thành công.

---

## 6. Suggested Data Models

### 6.1 `documents`

```txt
id
workspace_id / tenant_id
filename
file_type
mime_type
storage_path
content_hash
file_size_bytes
status
error_message
created_by
created_at
updated_at
```

---

### 6.2 `ingestion_jobs`

```txt
id
document_id
workspace_id / tenant_id
status
retry_count
max_retries
error_message
started_at
finished_at
created_at
updated_at
```

Recommended status:

```txt
pending
processing
completed
failed
retrying
```

---

### 6.3 Qdrant Payload

```txt
tenant_id
document_id
chunk_index
text
metadata.source
metadata.page_number
metadata.file_type
```

Recommended Qdrant payload indexes:

```txt
tenant_id
document_id
```

---

## 7. Suggested API Endpoints

### 7.1 Upload Document

```http
POST /workspaces/{workspace_id}/documents
```

Request:

```txt
multipart/form-data
file=<uploaded_file>
```

Response:

```json
{
  "document_id": "uuid",
  "status": "pending",
  "message": "Document accepted for ingestion"
}
```

---

### 7.2 Upload JSON Knowledge

```http
POST /workspaces/{workspace_id}/documents/json
```

Request:

```json
{
  "name": "product-catalog",
  "items": [
    {
      "title": "Product A",
      "content": "Product description"
    }
  ]
}
```

---

### 7.3 Get Document Status

```http
GET /workspaces/{workspace_id}/documents/{document_id}
```

Response:

```json
{
  "document_id": "uuid",
  "status": "processing",
  "error_message": null
}
```

---

### 7.4 List Documents

```http
GET /workspaces/{workspace_id}/documents
```

Support query params:

```txt
status
page
page_size
```

---

## 8. Security Requirements

- User must be authenticated for dashboard upload APIs
- User must be a member of the workspace
- User role must allow document upload
- All document queries must filter by `workspace_id` / `tenant_id`
- Never trust workspace_id from body without membership check
- Do not expose storage internal path publicly
- Validate file extension and MIME type
- Enforce file size limit
- Do not upsert vector without `tenant_id`
- Do not mix vectors between tenants
- Store raw files in tenant-scoped path

Recommended storage path:

```txt
/workspaces/{workspace_id}/documents/{document_id}/{filename}
```

---

## 9. Dependencies

This flow depends on:

```txt
01_auth_workspace_flow.md
02_plan_quota_flow.md
```

Required inputs:

```txt
current_user
current_workspace_id
current_role
current_plan
quota_limits
```

This flow provides output for:

```txt
05_document_lifecycle_flow.md
06_chat_rag_query_flow.md
08_usage_quota_flow.md
09_admin_operations_flow.md
```

Required outputs:

```txt
document_id
document_status
tenant-scoped vectors
knowledge_base_ready_state
```

---

## 10. MVP Acceptance Criteria

Flow được xem là hoàn thành khi:

- Authenticated user có thể upload PDF/TXT/JSON vào workspace
- User không thuộc workspace không thể upload
- Viewer không thể upload
- File không hợp lệ bị reject
- File vượt quota bị reject
- Document record được tạo với status `pending`
- Background job xử lý parse/chunk/embed
- Vector được lưu vào Qdrant với `tenant_id` và `document_id`
- Document được mark `ready` sau khi upsert thành công
- Document được mark `failed` nếu parse/embed/upsert lỗi
- Có endpoint kiểm tra trạng thái document
- Không có vector nào được tạo nếu thiếu `tenant_id`

---

## 11. Coding Agent Directives

Khi implement flow này:

1. Dùng async database session cho toàn bộ DB operations.
2. Không xử lý parse/chunk/embed nặng trực tiếp trong router.
3. Router chỉ validate request và gọi service.
4. Business logic đặt trong service layer.
5. Repository chỉ xử lý database query.
6. Mọi query document phải filter theo `workspace_id` / `tenant_id`.
7. Trước khi upload phải check membership, role và quota.
8. Tính `content_hash` trước khi tạo document hoàn chỉnh.
9. Không upsert Qdrant nếu thiếu `tenant_id` hoặc `document_id`.
10. Mọi Qdrant payload phải chứa `tenant_id`.
11. Không mark document `ready` trước khi Qdrant upsert thành công.
12. Lỗi trong background job phải được lưu vào `error_message`.
13. Dùng error code rõ ràng qua `HTTPException`.
14. Chuẩn bị abstraction cho parser và embedding provider.

Recommended service split:

```txt
DocumentService
IngestionService
ParserService
ChunkingService
EmbeddingService
VectorService
QuotaService
```

---

## 12. Recommended Error Codes

```txt
WORKSPACE_NOT_FOUND
WORKSPACE_ACCESS_DENIED
WORKSPACE_INACTIVE
INSUFFICIENT_ROLE
PLAN_INACTIVE
DOCUMENT_QUOTA_EXCEEDED
STORAGE_QUOTA_EXCEEDED
FILE_TOO_LARGE
UNSUPPORTED_FILE_TYPE
INVALID_FILE_CONTENT
DUPLICATE_DOCUMENT_CONTENT
DOCUMENT_NOT_FOUND
INGESTION_JOB_NOT_FOUND
INGESTION_PARSE_FAILED
INGESTION_EMBEDDING_FAILED
VECTOR_UPSERT_FAILED
```

---

## 13. Implementation Notes

### 13.1 Recommended MVP Processing Mode

```txt
HTTP Request
→ Validate
→ Create document
→ Create background task
→ Return immediately
```

Do not wait for embedding completion in the upload request.

---

### 13.2 Recommended Chunking Defaults

MVP default:

```txt
chunk_size = 800 tokens
chunk_overlap = 100 tokens
```

These values can be tuned later per document type or workspace plan.

---

### 13.3 Recommended Embedding Model

Default:

```txt
OpenAI text-embedding-3-small
```

Vector size:

```txt
1536
```

If using Gemini embedding later, collection vector size must match the selected model.

---

### 13.4 Recommended Collection

Use one Qdrant collection for SaaS MVP:

```txt
omnirag_documents
```

Multi-tenancy is enforced by Qdrant payload filter using:

```txt
tenant_id
```

---

## 14. Output Of This Flow

After this flow is completed, the system must provide:

```txt
Tenant-scoped documents
Tenant-scoped vector chunks
Document ingestion status
Knowledge base ready signal
Document metadata for retrieval and lifecycle management
```

These outputs are required before implementing production-ready RAG chat.
