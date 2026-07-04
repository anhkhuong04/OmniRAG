# 05 Document Lifecycle Flow

## 1. Mục tiêu

Flow này mô tả vòng đời của tài liệu sau khi đã được đưa vào OmniRAG: xem trạng thái, retry, re-index, disable và delete.

Mục tiêu chính là đảm bảo Knowledge Base luôn nhất quán giữa PostgreSQL và Qdrant, tránh chatbot sử dụng dữ liệu cũ, trùng hoặc đã bị xóa.

---

## 2. Phạm vi

Flow bao gồm:

- List documents theo workspace/tenant
- Xem chi tiết document
- Retry ingestion khi failed
- Re-index document khi nội dung thay đổi
- Disable document khỏi retrieval
- Delete document metadata
- Delete vectors tương ứng trong Qdrant
- Cập nhật document status

Không bao gồm:

- Upload tài liệu mới
- Parse/chunk/embedding chi tiết
- Chat RAG query
- Billing/payment

Các phần trên thuộc các flow riêng.

---

## 3. Business Rules

### 3.1 Workspace Scope

Mọi thao tác với document phải được scope theo:

```txt
workspace_id / tenant_id
```

User chỉ được thao tác document nếu user là member của workspace hiện tại.

---

### 3.2 Document Ownership

Document luôn thuộc về một workspace/tenant.

Không được phép truy cập document chỉ bằng `document_id` mà không kiểm tra `tenant_id`.

Đúng:

```txt
WHERE document.id = document_id
AND document.tenant_id = current_tenant_id
```

Sai:

```txt
WHERE document.id = document_id
```

---

### 3.3 Document Status

Document nên có các trạng thái sau:

```txt
pending
processing
ready
failed
disabled
deleting
deleted
```

Ý nghĩa:

| Status | Ý nghĩa |
|---|---|
| `pending` | Document đã được tạo, chờ ingestion job |
| `processing` | Đang parse/chunk/embedding |
| `ready` | Đã index thành công, có thể dùng cho retrieval |
| `failed` | Ingestion thất bại |
| `disabled` | Tạm thời không dùng cho retrieval |
| `deleting` | Đang xóa metadata/vector |
| `deleted` | Đã xóa logic hoặc hoàn tất delete |

---

### 3.4 Retry Rule

Chỉ cho retry document có status:

```txt
failed
```

Không retry document đang:

```txt
pending
processing
deleting
deleted
```

Khi retry:

```txt
failed
→ pending
→ processing
→ ready / failed
```

---

### 3.5 Re-index Rule

Re-index dùng khi document đã tồn tại nhưng nội dung hoặc metadata thay đổi.

Flow bắt buộc:

```txt
Mark document as processing
→ Delete old vectors by document_id + tenant_id
→ Re-run ingestion pipeline
→ Store new vectors
→ Mark ready / failed
```

Không được insert vector mới trước khi xử lý vector cũ, vì có thể gây duplicate context.

---

### 3.6 Disable Rule

Disable document nghĩa là tài liệu vẫn còn trong hệ thống nhưng không được dùng khi retrieval.

Có 2 cách triển khai:

```txt
Option A: update document status = disabled and exclude by document status in app logic
Option B: update Qdrant payload is_active = false and filter is_active = true when search
```

MVP khuyến nghị dùng Option A nếu retrieval chỉ lấy document status từ PostgreSQL trước khi search không gây phức tạp.

Production-ready khuyến nghị dùng Option B để Qdrant filter trực tiếp:

```json
{
  "tenant_id": "...",
  "document_id": "...",
  "is_active": true
}
```

---

### 3.7 Delete Rule

Khi delete document, hệ thống phải xóa cả:

```txt
PostgreSQL document record / soft-delete marker
Qdrant vectors matching tenant_id + document_id
Physical file in storage, if any
```

Khuyến nghị MVP:

```txt
Soft delete document metadata
Hard delete vectors in Qdrant
```

Lý do: giữ audit/history trong PostgreSQL nhưng không cho chatbot retrieve dữ liệu đã xóa.

---

## 4. Main Flows

### 4.1 List Documents

```txt
[1] User requests document list
    ↓
[2] Validate authenticated user
    ↓
[3] Resolve current workspace
    ↓
[4] Check workspace membership
    ↓
[5] Query documents by tenant_id/workspace_id
    ↓
[6] Return paginated document list
```

---

### 4.2 Get Document Detail

```txt
[1] User requests document detail
    ↓
[2] Resolve current workspace
    ↓
[3] Query document by document_id + tenant_id
    ↓
[4] If not found, return 404
    ↓
[5] Return document metadata and ingestion status
```

---

### 4.3 Retry Failed Document

```txt
[1] User clicks retry
    ↓
[2] Resolve document by document_id + tenant_id
    ↓
[3] Validate status = failed
    ↓
[4] Reset error fields
    ↓
[5] Set status = pending
    ↓
[6] Create ingestion job
    ↓
[7] Background worker processes document
    ↓
[8] Update status = ready / failed
```

---

### 4.4 Re-index Document

```txt
[1] User requests re-index
    ↓
[2] Resolve document by document_id + tenant_id
    ↓
[3] Validate document is not processing/deleting
    ↓
[4] Set status = processing
    ↓
[5] Delete old vectors by tenant_id + document_id
    ↓
[6] Re-run parse/chunk/embedding
    ↓
[7] Store new vectors with tenant_id + document_id
    ↓
[8] Set status = ready / failed
```

---

### 4.5 Disable Document

```txt
[1] User disables document
    ↓
[2] Resolve document by document_id + tenant_id
    ↓
[3] Validate document exists
    ↓
[4] Set status = disabled
    ↓
[5] Exclude document from future retrieval
```

---

### 4.6 Delete Document

```txt
[1] User deletes document
    ↓
[2] Resolve document by document_id + tenant_id
    ↓
[3] Set status = deleting
    ↓
[4] Delete vectors in Qdrant by tenant_id + document_id
    ↓
[5] Delete physical file from storage, if exists
    ↓
[6] Soft delete document metadata or set status = deleted
    ↓
[7] Return success
```

---

## 5. Alternative / Error Flows

### 5.1 Document Not Found

```txt
Document not found by document_id + tenant_id
→ Return 404 DOCUMENT_NOT_FOUND
```

---

### 5.2 Access Denied

```txt
User is not member of workspace
→ Return 403 WORKSPACE_ACCESS_DENIED
```

---

### 5.3 Retry Invalid Status

```txt
Document status is not failed
→ Return 409 DOCUMENT_STATUS_NOT_RETRYABLE
```

---

### 5.4 Delete During Processing

```txt
Document is processing
→ Either reject with 409 DOCUMENT_BUSY
→ Or mark pending_delete = true and delete after job finishes
```

MVP khuyến nghị reject để giảm complexity.

---

### 5.5 Qdrant Delete Failed

```txt
PostgreSQL document set deleting
→ Qdrant delete fails
→ Mark document status = failed
→ Store error_message
→ Allow retry delete
```

Không được báo delete thành công nếu vector vẫn còn trong Qdrant.

---

## 6. Data Models Liên Quan

### 6.1 `documents`

```txt
id
tenant_id
filename
file_type
storage_path
status
error_message
created_at
updated_at
deleted_at
```

---

### 6.2 Qdrant Payload

Mỗi vector chunk nên có payload:

```json
{
  "tenant_id": "workspace-or-tenant-id",
  "document_id": "document-id",
  "text": "chunk content",
  "chunk_index": 0,
  "is_active": true,
  "metadata": {
    "source": "policy.pdf",
    "page_number": 1
  }
}
```

Bắt buộc có:

```txt
tenant_id
document_id
```

Khuyến nghị có:

```txt
is_active
chunk_index
source/page_number
```

---

### 6.3 Required Qdrant Indexes

```txt
tenant_id: keyword
document_id: keyword
```

Nếu dùng disable ở Qdrant level:

```txt
is_active: bool
```

---

## 7. Suggested API Endpoints

### 7.1 Documents

```http
GET    /workspaces/{workspace_id}/documents
GET    /workspaces/{workspace_id}/documents/{document_id}
POST   /workspaces/{workspace_id}/documents/{document_id}/retry
POST   /workspaces/{workspace_id}/documents/{document_id}/reindex
POST   /workspaces/{workspace_id}/documents/{document_id}/disable
POST   /workspaces/{workspace_id}/documents/{document_id}/enable
DELETE /workspaces/{workspace_id}/documents/{document_id}
```

---

## 8. Security Requirements

- Mọi document query phải filter theo `tenant_id` / `workspace_id`
- Không được thao tác document chỉ bằng `document_id`
- Delete vectors phải filter cả `tenant_id` và `document_id`
- User phải là member của workspace
- Workspace inactive không được list, retry, re-index hoặc delete document
- Không expose storage path nội bộ nếu không cần thiết
- Không trả raw stack trace/error từ parser, embedding hoặc Qdrant

---

## 9. Dependencies

### Depends On

```txt
01_auth_workspace_flow.md
02_plan_quota_flow.md
04_knowledge_ingestion_flow.md
```

### Provides For

```txt
06_chat_rag_query_flow.md
08_usage_quota_flow.md
09_admin_operations_flow.md
```

Output quan trọng:

```txt
document_status
valid_document_set
qdrant_vectors_by_document_id
knowledge_base_consistency
```

---

## 10. MVP Acceptance Criteria

Flow được xem là hoàn thành khi:

- User có thể list documents trong workspace hiện tại
- User không thể thấy document của workspace khác
- User có thể xem trạng thái document
- User có thể retry document failed
- User có thể delete document
- Delete document xóa đúng vectors trong Qdrant theo `tenant_id + document_id`
- Chatbot không retrieve dữ liệu từ document đã deleted/disabled
- Re-index không tạo duplicate vectors
- Lỗi Qdrant/delete được ghi lại rõ ràng

---

## 11. Coding Agent Directives

Khi implement flow này:

1. Luôn resolve `current_workspace_id` trước khi query document.
2. Mọi PostgreSQL query phải filter theo `tenant_id` / `workspace_id`.
3. Mọi Qdrant delete/search liên quan document phải filter cả `tenant_id` và `document_id`.
4. Không đặt business logic trong router.
5. Tách document lifecycle logic vào `document_service`.
6. Tách Qdrant operations vào `vector_service`.
7. Dùng async DB session và async Qdrant client.
8. Không hard delete metadata nếu cần audit; ưu tiên soft delete trong MVP.
9. Không cho retry/re-index/delete khi document đang `processing`, trừ khi có cơ chế job cancellation rõ ràng.
10. Return error code nhất quán bằng `HTTPException`.

---

## 12. Recommended Error Codes

```txt
DOCUMENT_NOT_FOUND
DOCUMENT_BUSY
DOCUMENT_ALREADY_DELETED
DOCUMENT_STATUS_NOT_RETRYABLE
DOCUMENT_STATUS_NOT_REINDEXABLE
DOCUMENT_DELETE_FAILED
VECTOR_DELETE_FAILED
WORKSPACE_ACCESS_DENIED
WORKSPACE_INACTIVE
```

---

## 13. Implementation Notes

### Recommended MVP Strategy

```txt
Soft delete document metadata in PostgreSQL
Hard delete document vectors in Qdrant
Reject delete/re-index while document is processing
Support retry only for failed documents
```

---

### Recommended Delete Filter For Qdrant

```txt
must:
  tenant_id == current_tenant_id
  document_id == target_document_id
```

Không bao giờ delete vector chỉ theo `document_id`.

---

### Recommended Retrieval Rule

Chat/RAG flow chỉ được retrieve từ document có trạng thái usable.

```txt
Allowed:
  ready

Not allowed:
  pending
  processing
  failed
  disabled
  deleting
  deleted
```

---

## 14. Output Of This Flow

Sau khi hoàn thành flow này, hệ thống phải đảm bảo:

```txt
Documents can be listed by workspace
Documents can be retried when failed
Documents can be re-indexed safely
Documents can be disabled from retrieval
Documents can be deleted without leaving stale vectors
Qdrant and PostgreSQL document state remain consistent
```
