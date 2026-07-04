# 06 Chat RAG Query Flow

## 1. Mục tiêu

Flow này mô tả runtime chính của OmniRAG: nhận câu hỏi từ widget/API, xác thực tenant, truy xuất context từ Knowledge Base, gọi LLM và trả về câu trả lời cho end-user.

Mục tiêu chính là đảm bảo chatbot trả lời dựa trên dữ liệu đúng tenant, có kiểm soát quota, có lưu lịch sử hội thoại và không rò rỉ dữ liệu giữa các workspace.

---

## 2. Phạm vi

Flow bao gồm:

- Nhận chat message từ widget/API
- Validate API key
- Resolve workspace/tenant từ API key
- Check workspace, subscription và quota
- Tạo hoặc tiếp tục conversation
- Lưu user message
- Embed query
- Search Qdrant với `tenant_id` filter
- Build prompt từ retrieved context
- Gọi LLM
- Lưu assistant message
- Ghi nhận usage
- Trả response cho client

Không bao gồm:

- Upload tài liệu
- Parse/chunk/embedding document
- Quản lý API key
- Widget UI chi tiết
- Billing/payment thật

Các phần trên thuộc các flow riêng.

---

## 3. Business Rules

### 3.1 API Key Authentication

Chat API được gọi bởi website/widget của tenant, nên phải xác thực bằng API key.

Yêu cầu:

- API key phải tồn tại
- API key phải active
- API key chưa hết hạn
- Workspace/tenant sở hữu API key phải active
- Subscription của workspace phải usable

Không được cho phép chat request nếu không resolve được `tenant_id`.

---

### 3.2 Tenant Isolation

Mọi request chat phải được scope theo:

```txt
current_tenant_id / current_workspace_id
```

Khi search vector trong Qdrant, bắt buộc filter theo `tenant_id`:

```txt
tenant_id == current_tenant_id
```

Không được search Qdrant nếu thiếu tenant filter.

---

### 3.3 Quota Check

Trước khi gọi embedding hoặc LLM, hệ thống phải kiểm tra quota.

MVP nên check tối thiểu:

```txt
monthly_queries_used < monthly_queries_limit
```

Production-ready có thể check thêm:

```txt
embedding_tokens
llm_tokens
rate_limit_per_minute
storage_limit
```

Nếu vượt quota, return lỗi trước khi gọi external AI API để tránh phát sinh chi phí.

---

### 3.4 Conversation

Chat request có thể thuộc một conversation hiện có hoặc tạo conversation mới.

Quy tắc:

- Nếu `conversation_id` được gửi lên, phải kiểm tra conversation thuộc đúng tenant
- Nếu không có `conversation_id`, tạo conversation mới
- `external_user_id` là định danh user cuối trên website tenant, không phải user account của OmniRAG
- Message phải lưu kèm `tenant_id` để hỗ trợ audit và bảo mật

---

### 3.5 Retrieval

Retriever chỉ được lấy context từ các document đang usable.

Context hợp lệ nên thỏa:

```txt
tenant_id == current_tenant_id
document_status == ready
chunk_status == active
```

Với MVP, nếu Qdrant payload chưa có `document_status`, vẫn phải đảm bảo tối thiểu có `tenant_id` và `document_id`.

---

### 3.6 No Context Case

Nếu không tìm thấy context phù hợp, chatbot không nên bịa thông tin.

Response nên theo hướng:

```txt
Không tìm thấy thông tin phù hợp trong dữ liệu hiện có của workspace này.
```

Có thể vẫn gọi LLM với prompt ràng buộc chặt, hoặc return fallback response trực tiếp để tiết kiệm chi phí.

---

### 3.7 Answer Grounding

LLM phải được instruct trả lời dựa trên retrieved context.

Prompt phải yêu cầu:

- Không bịa dữ liệu ngoài context
- Không trả lời nếu context không đủ
- Trả lời ngắn gọn, đúng trọng tâm
- Có thể trả kèm sources/citations nếu có metadata

---

## 4. Main Flow

```txt
[1] Client sends chat request
    ↓
[2] Validate API key
    ↓
[3] Resolve tenant/workspace
    ↓
[4] Check workspace status and quota
    ↓
[5] Create or load conversation
    ↓
[6] Save user message
    ↓
[7] Generate query embedding
    ↓
[8] Search Qdrant with tenant_id filter
    ↓
[9] Build RAG prompt with retrieved context
    ↓
[10] Call LLM
    ↓
[11] Save assistant response
    ↓
[12] Record usage
    ↓
[13] Return answer to client
```

---

## 5. Alternative Flows

### 5.1 Invalid API Key

```txt
Client sends request
→ API key invalid or not found
→ Return 401 INVALID_API_KEY
```

---

### 5.2 Revoked API Key

```txt
Client sends request
→ API key found but inactive
→ Return 401 API_KEY_REVOKED
```

---

### 5.3 Workspace Inactive

```txt
API key valid
→ Workspace inactive
→ Return 403 WORKSPACE_INACTIVE
```

---

### 5.4 Quota Exceeded

```txt
API key valid
→ Monthly query quota exceeded
→ Return 429 QUOTA_EXCEEDED
```

---

### 5.5 Conversation Not Found

```txt
Request has conversation_id
→ Conversation not found in current tenant
→ Return 404 CONVERSATION_NOT_FOUND
```

---

### 5.6 No Relevant Context

```txt
Qdrant search returns empty / low score
→ Save user message
→ Return fallback answer
→ Record usage if needed
```

---

### 5.7 Embedding Provider Failed

```txt
Generate query embedding
→ Provider timeout/error
→ Return 503 EMBEDDING_PROVIDER_UNAVAILABLE
```

---

### 5.8 LLM Provider Failed

```txt
Context retrieved
→ LLM timeout/error
→ Return 503 LLM_PROVIDER_UNAVAILABLE
```

---

## 6. Suggested Data Models

### 6.1 `conversations`

```txt
id
tenant_id
external_user_id
created_at
updated_at
```

---

### 6.2 `messages`

```txt
id
conversation_id
tenant_id
sender
content
created_at
```

Allowed `sender` values:

```txt
user
assistant
system
```

---

### 6.3 `usage_records`

```txt
id
tenant_id
api_key_id
conversation_id
request_type
prompt_tokens
completion_tokens
embedding_tokens
total_tokens
estimated_cost
created_at
```

MVP có thể chỉ lưu:

```txt
id
tenant_id
request_type
created_at
```

---

### 6.4 Qdrant Payload

Mỗi vector chunk nên có payload tối thiểu:

```json
{
  "tenant_id": "workspace-or-tenant-id",
  "document_id": "document-id",
  "text": "chunk content",
  "chunk_index": 0,
  "metadata": {
    "source": "file-name.pdf",
    "page_number": 1
  }
}
```

---

## 7. Suggested API Endpoints

### 7.1 Chat

```http
POST /chat
```

Headers:

```http
X-API-Key: <api_key>
```

Request:

```json
{
  "message": "Chính sách đổi trả như thế nào?",
  "conversation_id": "optional-conversation-id",
  "external_user_id": "optional-end-user-id"
}
```

Response:

```json
{
  "conversation_id": "conversation-id",
  "answer": "Câu trả lời của assistant",
  "sources": [
    {
      "document_id": "document-id",
      "source": "policy.pdf",
      "page_number": 1,
      "score": 0.82
    }
  ]
}
```

---

### 7.2 Conversation History

```http
GET /conversations/{conversation_id}/messages
```

Yêu cầu:

- Endpoint dashboard dùng JWT auth và workspace context
- Endpoint widget nếu được hỗ trợ phải dùng API key và kiểm tra tenant

---

## 8. Security Requirements

- Không cho phép chat request nếu thiếu API key
- Không lưu raw API key trong database
- Không resolve conversation chỉ bằng `conversation_id` mà thiếu `tenant_id`
- Không search Qdrant nếu thiếu `tenant_id` filter
- Không inject raw user input vào prompt mà không qua prompt template
- Không expose internal error từ LLM provider ra client
- Không trả về context/raw chunks quá dài nếu không cần thiết
- Không trả dữ liệu của document thuộc tenant khác
- Nên sanitize metadata trước khi trả sources cho client

---

## 9. Dependencies

Flow này phụ thuộc vào:

```txt
01_auth_workspace_flow.md
02_plan_quota_flow.md
03_api_key_flow.md
04_knowledge_ingestion_flow.md
05_document_lifecycle_flow.md
```

Required input:

```txt
valid_api_key
current_tenant_id
workspace_status
subscription_status
quota_status
ready_documents
qdrant_vectors
```

Output cho flow sau:

```txt
conversation_history
usage_records
chat_response
widget_runtime_result
```

---

## 10. MVP Acceptance Criteria

Flow được xem là hoàn thành khi:

- Client có thể gọi `POST /chat` bằng API key hợp lệ
- API key được validate và resolve đúng tenant
- Request bị từ chối nếu API key inactive/invalid/expired
- Request bị từ chối nếu workspace inactive hoặc vượt quota
- User message được lưu vào `messages`
- Conversation mới được tạo nếu không truyền `conversation_id`
- Query được embedding thành vector
- Qdrant search luôn có `tenant_id` filter
- Retrieved chunks chỉ thuộc tenant hiện tại
- LLM trả lời dựa trên retrieved context
- Assistant response được lưu vào `messages`
- Response trả về có `conversation_id` và `answer`
- Usage cơ bản được ghi nhận

---

## 11. Coding Agent Directives

Khi implement flow này:

1. Dùng async cho database, Qdrant và LLM/embedding provider.
2. Tách rõ `chat_router`, `chat_service`, `rag_service`, `vector_service`, `usage_service`.
3. Không đặt business logic trong router.
4. Luôn validate API key trước khi xử lý message.
5. Luôn resolve `tenant_id` từ API key, không nhận `tenant_id` từ client.
6. Luôn truyền `tenant_id` vào vector search filter.
7. Không viết hàm Qdrant search mà thiếu tham số `tenant_id`.
8. Lưu user message trước khi gọi LLM để có audit trail.
9. Lưu assistant message sau khi LLM trả lời thành công.
10. Ghi usage sau mỗi request, kể cả khi LLM lỗi nếu đã phát sinh token/cost.
11. Dùng error code rõ ràng trong `HTTPException`.
12. Không expose stack trace hoặc provider raw error cho client.

---

## 12. Recommended Error Codes

```txt
MISSING_API_KEY
INVALID_API_KEY
API_KEY_REVOKED
API_KEY_EXPIRED
WORKSPACE_INACTIVE
SUBSCRIPTION_INACTIVE
QUOTA_EXCEEDED
CONVERSATION_NOT_FOUND
CONVERSATION_ACCESS_DENIED
NO_READY_KNOWLEDGE_BASE
NO_RELEVANT_CONTEXT
EMBEDDING_PROVIDER_UNAVAILABLE
LLM_PROVIDER_UNAVAILABLE
RAG_PIPELINE_FAILED
```

---

## 13. Implementation Notes

### 13.1 Tenant Filter Is Mandatory

Vector search phải có dạng logic:

```txt
search_similar_chunks(
  tenant_id=current_tenant_id,
  query_vector=query_embedding,
  limit=top_k
)
```

Không chấp nhận function search global như:

```txt
search_similar_chunks(query_vector, limit)
```

Vì dễ gây data leak giữa tenants.

---

### 13.2 Recommended Retrieval Defaults

MVP default:

```txt
top_k = 5
min_score = 0.3
```

Các giá trị này nên để trong config để dễ tuning.

---

### 13.3 Recommended Prompt Behavior

Prompt nên có rule:

```txt
Bạn là assistant của workspace hiện tại.
Chỉ sử dụng context được cung cấp.
Nếu context không đủ, hãy nói rằng chưa tìm thấy thông tin phù hợp.
Không bịa chính sách, giá, trạng thái đơn hàng hoặc dữ liệu nội bộ.
```

---

### 13.4 Conversation History Usage

MVP có thể chỉ dùng message hiện tại để retrieval.

Production-ready có thể dùng thêm:

```txt
last_n_messages = 6
conversation_summary
standalone_question_rewrite
```

Không nên đưa toàn bộ conversation history vào prompt vì dễ tăng token cost và gây nhiễu context.

---

## 14. Output Of This Flow

Sau khi hoàn thành flow này, hệ thống phải cung cấp được:

```txt
Tenant-scoped chat API
Conversation history
Assistant response grounded by tenant knowledge
Retrieved sources
Basic usage records
Runtime foundation for widget integration
```
