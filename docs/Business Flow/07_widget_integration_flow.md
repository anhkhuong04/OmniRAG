# 07 Widget Integration Flow

## 1. Mục tiêu

Flow này mô tả cách Tenant tích hợp OmniRAG chatbot vào website thông qua embed widget.

Widget là client runtime của Chat API. Nó không xử lý RAG logic, không truy cập trực tiếp database/vector database, và chỉ giao tiếp với backend qua public API đã được kiểm soát bằng API Key hoặc public widget token.

---

## 2. Phạm vi

Flow bao gồm:

- Tạo widget configuration cho workspace/chatbot
- Sinh embed code
- Load widget script trên website Tenant
- Khởi tạo chat session
- Gửi message đến Chat API
- Hiển thị assistant response
- Tùy chỉnh giao diện cơ bản
- Kiểm tra domain/origin nếu được cấu hình

---

## 3. Business Rules

### 3.1 Widget thuộc về workspace

Mỗi widget configuration phải thuộc về một workspace/tenant.

Widget không được phép truy cập knowledge base, conversation hoặc usage của workspace khác.

---

### 3.2 Widget dùng cho end-user

Widget được nhúng trên website của Tenant và phục vụ end-user.

End-user không cần tài khoản OmniRAG.

Thông tin định danh end-user nên dùng:

```txt
external_user_id
session_id
visitor_id
```

---

### 3.3 Embed code

Tenant lấy embed code từ dashboard hoặc playground.

Ví dụ:

```html
<script
  src="https://cdn.omnirag.dev/widget.js"
  data-widget-id="widget_xxx"
  data-api-base-url="https://api.omnirag.dev"
></script>
```

MVP có thể dùng `widget_id` để resolve workspace/chatbot config.

Không nên expose raw private API key trong frontend.

---

### 3.4 Public widget token

Nếu cần xác thực widget request, hệ thống nên dùng `public_widget_token` thay vì raw API Key.

Yêu cầu:

- Token chỉ dùng cho widget runtime
- Token bị giới hạn scope vào một workspace/chatbot
- Token có thể revoke/rotate
- Token không dùng cho admin API, ingestion API hoặc billing API

---

### 3.5 Domain / Origin Validation

Workspace có thể cấu hình danh sách allowed domains.

Nếu configured, request từ widget chỉ hợp lệ khi `Origin` hoặc `Referer` thuộc allowed domains.

Ví dụ:

```txt
https://example.com
https://shop.example.com
```

MVP có thể cho phép bỏ qua domain validation ở local/dev mode.

---

### 3.6 Widget Theme

Widget nên hỗ trợ cấu hình cơ bản:

```txt
bot_name
welcome_message
primary_color
position
avatar_url
placeholder_text
```

Không để theme config ảnh hưởng đến RAG behavior hoặc tenant isolation.

---

## 4. Main Flow

```txt
[1] Tenant opens dashboard/playground
    ↓
[2] Tenant creates or uses default widget config
    ↓
[3] System generates embed code
    ↓
[4] Tenant adds embed code to website
    ↓
[5] Browser loads widget.js
    ↓
[6] Widget reads widget_id from script attributes
    ↓
[7] Widget fetches public widget config
    ↓
[8] Widget initializes UI
    ↓
[9] End-user sends message
    ↓
[10] Widget sends message to Chat API
    ↓
[11] Backend resolves workspace/chatbot from widget_id/token
    ↓
[12] Backend runs Chat RAG Query Flow
    ↓
[13] Widget renders assistant response
```

---

## 5. Alternative / Error Flows

### 5.1 Invalid Widget ID

```txt
Widget loads
→ widget_id not found
→ Return 404 WIDGET_NOT_FOUND
→ Widget shows unavailable state
```

---

### 5.2 Inactive Widget

```txt
Widget loads
→ Widget exists but is_active = false
→ Return 403 WIDGET_INACTIVE
→ Widget does not open chat
```

---

### 5.3 Workspace Inactive

```txt
Widget sends request
→ Workspace is inactive
→ Return 403 WORKSPACE_INACTIVE
→ Widget shows service unavailable message
```

---

### 5.4 Domain Not Allowed

```txt
Widget sends request
→ Origin not in allowed_domains
→ Return 403 ORIGIN_NOT_ALLOWED
→ Widget blocks chat initialization
```

---

### 5.5 Quota Exceeded

```txt
End-user sends message
→ Workspace quota exceeded
→ Return 429 QUOTA_EXCEEDED
→ Widget shows quota limit message
```

---

### 5.6 Chat API Timeout

```txt
Widget sends message
→ Chat API timeout
→ Widget shows retryable error
→ User can resend message
```

---

## 6. Suggested Data Models

### 6.1 `widgets`

```txt
id
workspace_id
name
public_token_hash
is_active
created_at
updated_at
```

---

### 6.2 `widget_configs`

```txt
id
widget_id
bot_name
welcome_message
placeholder_text
primary_color
position
avatar_url
created_at
updated_at
```

---

### 6.3 `widget_allowed_domains`

```txt
id
widget_id
domain
created_at
```

---

### 6.4 Optional: `chatbots`

Nếu hệ thống hỗ trợ nhiều chatbot trong một workspace:

```txt
id
workspace_id
name
system_prompt
model_name
temperature
is_active
created_at
updated_at
```

Khi đó widget nên bind với `chatbot_id`.

---

## 7. Suggested API Endpoints

### 7.1 Dashboard APIs

Các endpoint này yêu cầu authenticated user và workspace membership.

```http
POST /workspaces/{workspace_id}/widgets
GET /workspaces/{workspace_id}/widgets
GET /workspaces/{workspace_id}/widgets/{widget_id}
PATCH /workspaces/{workspace_id}/widgets/{widget_id}
DELETE /workspaces/{workspace_id}/widgets/{widget_id}
POST /workspaces/{workspace_id}/widgets/{widget_id}/rotate-token
```

---

### 7.2 Public Widget APIs

Các endpoint này được browser widget gọi.

```http
GET /public/widgets/{widget_id}/config
POST /public/widgets/{widget_id}/chat
```

Optional:

```http
POST /public/widgets/{widget_id}/sessions
```

---

## 8. Security Requirements

- Không expose private API key trong frontend widget.
- Widget request phải resolve được workspace/tenant từ `widget_id` hoặc public token.
- Public token nếu lưu DB phải lưu dạng hash.
- Nếu cấu hình allowed domains, bắt buộc validate `Origin` hoặc `Referer`.
- Không cho inactive workspace sử dụng widget.
- Không cho inactive widget gửi chat request.
- Không cho widget gọi admin, ingestion, billing hoặc API key management endpoint.
- Chat request từ widget vẫn phải đi qua quota/rate limit.
- Chat RAG Query vẫn phải filter Qdrant bằng `tenant_id`.

---

## 9. Dependencies

Flow này phụ thuộc vào:

```txt
01_auth_workspace_flow.md
02_plan_quota_flow.md
03_api_key_flow.md
06_chat_rag_query_flow.md
08_usage_quota_flow.md
```

Required context:

```txt
workspace_id / tenant_id
workspace_status
widget_id
widget_status
allowed_domains
subscription_plan
quota_status
```

---

## 10. MVP Acceptance Criteria

Flow được xem là hoàn thành khi:

- Tenant có thể tạo widget config.
- Tenant có thể lấy embed code.
- Website có thể load widget script.
- Widget có thể fetch config bằng `widget_id`.
- Widget có thể hiển thị chat box cơ bản.
- End-user có thể gửi message từ widget.
- Widget nhận và render assistant response từ Chat API.
- Backend resolve đúng workspace từ widget request.
- Inactive widget không thể gửi chat.
- Inactive workspace không thể dùng widget.
- Chat request từ widget được tính vào usage/quota.
- Không có raw private API key trong embed code.

---

## 11. Coding Agent Directives

Khi implement flow này:

1. Tách rõ dashboard widget APIs và public widget APIs.
2. Không đặt RAG logic trong widget code.
3. Widget chỉ gọi backend API.
4. Không expose private API key ra browser.
5. Dùng `widget_id` hoặc public widget token để resolve workspace.
6. Public token phải được hash nếu lưu DB.
7. Validate workspace status trước khi cho chat.
8. Validate widget status trước khi cho chat.
9. Validate domain/origin nếu workspace đã cấu hình allowed domains.
10. Mọi chat request phải route về Chat RAG Query Flow.
11. Mọi chat request phải đi qua quota/rate limit check.
12. Trả error code rõ ràng để widget hiển thị đúng trạng thái.

---

## 12. Recommended Error Codes

```txt
WIDGET_NOT_FOUND
WIDGET_INACTIVE
INVALID_WIDGET_TOKEN
ORIGIN_NOT_ALLOWED
WORKSPACE_INACTIVE
CHATBOT_NOT_FOUND
CHATBOT_INACTIVE
QUOTA_EXCEEDED
RATE_LIMIT_EXCEEDED
CHAT_API_TIMEOUT
CHAT_SERVICE_UNAVAILABLE
```

---

## 13. Implementation Notes

### 13.1 MVP Widget UI

MVP chỉ cần:

```txt
Floating button
Chat panel
Message list
Input box
Loading state
Error state
```

Chưa cần:

```txt
File upload in widget
Human handoff
Voice chat
Multilingual UI config
Advanced analytics events
```

---

### 13.2 Recommended Embed Code For Local Dev

```html
<script
  src="http://localhost:5173/widget.js"
  data-widget-id="<widget_id>"
  data-api-base-url="http://localhost:8000"
></script>
```

---

### 13.3 Recommended Embed Code For Production

```html
<script
  src="https://cdn.omnirag.dev/widget.js"
  data-widget-id="<widget_id>"
  async
></script>
```

---

## 14. Output Of This Flow

Sau khi hoàn thành flow này, hệ thống phải cung cấp:

```txt
Embeddable widget script
Widget configuration
Public widget config API
Public widget chat API
Workspace-bound widget runtime
Basic website chatbot integration
```
