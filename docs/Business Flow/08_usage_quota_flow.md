# 08 Usage & Quota Flow

## 1. Mục tiêu

Flow này xử lý việc ghi nhận, kiểm tra và giới hạn mức sử dụng tài nguyên của từng workspace trong OmniRAG SaaS.

Đây là flow bảo vệ chi phí vận hành của hệ thống vì RAG SaaS phát sinh chi phí thật từ embedding, LLM, storage và vector database.

---

## 2. Phạm vi

Flow bao gồm:

- Theo dõi số lượng chat queries
- Theo dõi token sử dụng cho LLM
- Theo dõi embedding tokens
- Theo dõi document count và storage usage
- Kiểm tra quota theo plan hiện tại
- Chặn request khi vượt giới hạn
- Ghi usage log phục vụ dashboard và billing sau này

MVP chưa cần payment thật, invoice thật hoặc cost calculation chi tiết theo provider.

---

## 3. Business Rules

### 3.1 Workspace-scoped Usage

Mọi usage phải được ghi nhận theo workspace/tenant.

Không được ghi usage ở cấp global mà không có `workspace_id` hoặc `tenant_id`.

Required scope:

```txt
workspace_id / tenant_id
plan_code
subscription_id
usage_period
```

---

### 3.2 Default Free Trial Quota

Khi workspace được tạo, hệ thống tự động assign plan `free_trial` từ `02_plan_quota_flow.md`.

Quota gợi ý cho MVP:

```txt
max_documents = 20
max_storage_mb = 50
max_monthly_queries = 1000
max_embedding_tokens = 100000
max_chat_tokens = 500000
```

Các con số có thể chỉnh bằng seed/config, không hard-code trong business logic.

---

### 3.3 Quota Check Before Expensive Operations

Phải kiểm tra quota trước các operation tốn chi phí.

Các operation bắt buộc check quota:

```txt
Upload document
Start ingestion job
Generate embedding
Call chat endpoint
Call LLM
```

Nếu quota vượt giới hạn, hệ thống phải reject request trước khi gọi provider bên ngoài.

---

### 3.4 Usage Recording After Operation

Usage chỉ được ghi nhận chính xác sau khi operation hoàn tất hoặc có kết quả đủ để tính usage.

Ví dụ:

```txt
Chat request accepted
→ Call embedding
→ Retrieve context
→ Call LLM
→ Save usage with prompt_tokens and completion_tokens
```

Nếu operation fail trước khi gọi LLM, không ghi chat token usage.

Nếu embedding đã được gọi nhưng ingestion fail ở bước sau, vẫn có thể ghi embedding token usage để phản ánh chi phí thực.

---

### 3.5 Monthly Usage Period

Usage nên được group theo tháng.

MVP dùng period dạng:

```txt
YYYY-MM
```

Ví dụ:

```txt
2026-07
```

Quota reset theo monthly period.

---

### 3.6 Hard Limit vs Soft Limit

MVP dùng hard limit.

```txt
If usage >= quota
→ Block operation
```

Production có thể bổ sung soft warning:

```txt
80% quota reached → warning
100% quota reached → block
```

---

## 4. Main Flow

```txt
[1] Receive workspace-scoped request
    ↓
[2] Resolve workspace and active subscription
    ↓
[3] Load plan quota limits
    ↓
[4] Load current monthly usage
    ↓
[5] Check requested operation against quota
    ↓
[6] If quota exceeded, reject request
    ↓
[7] Execute operation
    ↓
[8] Record usage event
    ↓
[9] Update usage aggregate
    ↓
[10] Return response with optional usage summary
```

---

## 5. Usage Types

### 5.1 Query Usage

Ghi nhận mỗi lần gọi chat API hợp lệ.

```txt
usage_type = chat_query
quantity = 1
```

---

### 5.2 LLM Token Usage

Ghi nhận token từ LLM response.

```txt
prompt_tokens
completion_tokens
total_tokens
model_name
```

---

### 5.3 Embedding Token Usage

Ghi nhận token khi tạo embedding cho document chunks hoặc user query.

```txt
usage_type = embedding_tokens
quantity = token_count
model_name
```

---

### 5.4 Storage Usage

Ghi nhận dung lượng file/document được lưu.

```txt
usage_type = storage_bytes
quantity = file_size_bytes
```

---

### 5.5 Document Count

Dùng để kiểm tra giới hạn số lượng document active trong workspace.

Chỉ tính document chưa bị deleted.

---

## 6. Alternative / Error Flows

### 6.1 Query Quota Exceeded

```txt
Chat request
→ Monthly query usage >= max_monthly_queries
→ Return 403 QUOTA_EXCEEDED
```

---

### 6.2 Document Quota Exceeded

```txt
Upload document
→ Current active documents >= max_documents
→ Return 403 DOCUMENT_QUOTA_EXCEEDED
```

---

### 6.3 Storage Quota Exceeded

```txt
Upload document
→ current_storage + new_file_size > max_storage_mb
→ Return 403 STORAGE_QUOTA_EXCEEDED
```

---

### 6.4 Subscription Inactive

```txt
Request workspace operation
→ subscription_status != active
→ Return 403 SUBSCRIPTION_INACTIVE
```

---

### 6.5 Usage Record Failure

Nếu operation thành công nhưng ghi usage thất bại:

```txt
Return operation result
Log usage recording error
Mark for retry/reconciliation
```

Không nên làm fail user request chỉ vì usage logging lỗi, trừ khi operation cần quota strict real-time.

---

## 7. Suggested Data Models

### 7.1 `plans`

```txt
id
code
name
is_active
created_at
updated_at
```

Example:

```txt
free_trial
starter
pro
enterprise
```

---

### 7.2 `plan_quotas`

```txt
id
plan_id
max_documents
max_storage_mb
max_monthly_queries
max_embedding_tokens
max_chat_tokens
max_api_keys
created_at
updated_at
```

---

### 7.3 `subscriptions`

```txt
id
workspace_id
plan_id
status
started_at
expires_at
created_at
updated_at
```

Status:

```txt
active
expired
cancelled
past_due
```

---

### 7.4 `usage_events`

```txt
id
workspace_id
subscription_id
usage_type
quantity
model_name
metadata
created_at
```

Purpose:

```txt
Immutable event log for audit, analytics and future billing.
```

---

### 7.5 `usage_monthly_aggregates`

```txt
id
workspace_id
period
chat_queries
prompt_tokens
completion_tokens
embedding_tokens
storage_bytes
document_count
created_at
updated_at
```

Purpose:

```txt
Fast quota checking and dashboard display.
```

---

## 8. Suggested API Endpoints

### 8.1 Workspace Usage

```http
GET /workspaces/{workspace_id}/usage/current
GET /workspaces/{workspace_id}/usage/history
```

---

### 8.2 Quota

```http
GET /workspaces/{workspace_id}/quota
GET /workspaces/{workspace_id}/quota/check
```

---

### 8.3 Internal Usage Recording

Internal service only, not public API:

```txt
UsageService.record_event(...)
UsageService.check_quota(...)
UsageService.increment_monthly_usage(...)
```

---

## 9. Security Requirements

- Usage data must always be scoped by `workspace_id` / `tenant_id`
- User must be a member of workspace to view usage
- Only `Owner` or `Admin` can view full usage/billing information
- Do not expose provider raw cost or internal provider metadata to unauthorized users
- Do not allow inactive workspace to consume paid resources
- Do not allow quota bypass from background jobs
- Quota checks must run before expensive external API calls

---

## 10. Dependencies

This flow depends on:

```txt
01_auth_workspace_flow.md
02_plan_quota_flow.md
03_api_key_flow.md
04_knowledge_ingestion_flow.md
06_chat_rag_query_flow.md
```

This flow provides data for:

```txt
07_widget_integration_flow.md
09_admin_operations_flow.md
Future billing/payment flow
```

Required inputs:

```txt
current_workspace_id
active_subscription
current_plan
plan_quota
operation_type
```

Required outputs:

```txt
quota_status
current_usage
usage_event
monthly_usage_aggregate
```

---

## 11. MVP Acceptance Criteria

Flow được xem là hoàn thành khi:

- Workspace có plan và quota sau khi được tạo
- Hệ thống kiểm tra quota trước upload document
- Hệ thống kiểm tra quota trước chat request
- Hệ thống ghi nhận số lượng chat queries theo tháng
- Hệ thống ghi nhận embedding token usage cơ bản
- Hệ thống ghi nhận LLM token usage cơ bản nếu provider trả về token info
- Hệ thống chặn request khi vượt quota
- User có thể xem current usage của workspace
- Usage query luôn filter theo workspace/tenant
- Coding agent không cần đoán nơi check quota trong ingestion/chat flow

---

## 12. Coding Agent Directives

Khi implement flow này:

1. Không hard-code quota trong service logic.
2. Load quota từ plan/subscription configuration.
3. Tạo `UsageService` riêng, không đặt logic usage trong router.
4. Gọi `UsageService.check_quota()` trước operation tốn chi phí.
5. Gọi `UsageService.record_event()` sau operation có usage thực tế.
6. Dùng monthly aggregate để check quota nhanh.
7. Giữ `usage_events` như immutable audit log.
8. Mọi usage query phải filter theo `workspace_id` / `tenant_id`.
9. Không cho inactive subscription sử dụng ingestion/chat.
10. Trả lỗi bằng `HTTPException` với error code rõ ràng.

---

## 13. Recommended Error Codes

```txt
QUOTA_EXCEEDED
DOCUMENT_QUOTA_EXCEEDED
STORAGE_QUOTA_EXCEEDED
QUERY_QUOTA_EXCEEDED
EMBEDDING_TOKEN_QUOTA_EXCEEDED
CHAT_TOKEN_QUOTA_EXCEEDED
SUBSCRIPTION_INACTIVE
PLAN_NOT_FOUND
PLAN_QUOTA_NOT_FOUND
USAGE_RECORD_FAILED
USAGE_ACCESS_DENIED
```

---

## 14. Implementation Notes

### 14.1 Recommended Quota Check Points

```txt
Document upload:
- max_documents
- max_storage_mb

Ingestion:
- max_embedding_tokens

Chat:
- max_monthly_queries
- max_chat_tokens
```

---

### 14.2 Recommended Usage Event Metadata

```json
{
  "source": "chat_api",
  "conversation_id": "uuid",
  "model": "gpt-4o-mini",
  "api_key_id": "uuid"
}
```

For ingestion:

```json
{
  "source": "ingestion_job",
  "document_id": "uuid",
  "model": "text-embedding-3-small",
  "chunk_count": 42
}
```

---

### 14.3 Recommended Response Shape

```json
{
  "period": "2026-07",
  "plan": "free_trial",
  "usage": {
    "chat_queries": 120,
    "documents": 8,
    "storage_mb": 12.5,
    "embedding_tokens": 32000,
    "chat_tokens": 88000
  },
  "limits": {
    "chat_queries": 1000,
    "documents": 20,
    "storage_mb": 50,
    "embedding_tokens": 100000,
    "chat_tokens": 500000
  }
}
```

---

## 15. Output Of This Flow

Sau khi hoàn thành flow này, hệ thống phải cung cấp được:

```txt
Current workspace usage
Current quota limits
Quota check result
Usage event logs
Monthly usage aggregate
```

Các flow ingestion, chat, widget và admin sẽ dùng output này để kiểm soát chi phí và hiển thị usage dashboard.
