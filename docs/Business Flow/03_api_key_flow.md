# 03 API Key Flow

## 1. Muc tieu

Flow nay quan ly API Key de tenant/workspace tich hop OmniRAG vao website hoac he thong ben ngoai.

API Key la co che xac thuc chinh cho cac public runtime API nhu Chat API, Widget API va mot so endpoint ingestion neu cho phep tich hop may-to-machine.

Flow nay phu thuoc vao:

```txt
01_auth_workspace_flow.md
02_plan_quota_flow.md
```

---

## 2. Pham vi

Flow bao gom:

- Tao API Key cho workspace
- Hien thi raw API Key mot lan duy nhat
- Hash API Key truoc khi luu database
- Liet ke API Keys cua workspace
- Revoke API Key
- Rotate API Key
- Validate API Key tu request ben ngoai
- Resolve workspace/tenant tu API Key
- Kiem tra workspace, subscription va quota truoc khi cho phep request tiep tuc

Ngoai pham vi MVP:

- Fine-grained API scope phuc tap
- IP allowlist
- Domain allowlist nang cao
- Organization-level service account
- Webhook signing secret

---

## 3. Business Rules

### 3.1 API Key Ownership

Moi API Key phai thuoc ve mot workspace/tenant.

```txt
workspace_id / tenant_id is required
```

User chi duoc tao, revoke hoac rotate API Key neu co quyen trong workspace.

MVP role duoc phep quan ly API Key:

```txt
Owner
Admin
```

---

### 3.2 API Key Creation

Khi tao API Key:

- User phai authenticated
- Workspace phai active
- Subscription phai active
- User phai co role hop le
- Ten key phai ro rang, vi du `Production Key`, `Dev Key`, `Website Widget Key`
- He thong sinh raw API Key random, do entropy cao
- Chi hien thi raw API Key mot lan duy nhat sau khi tao
- Database chi luu `key_hash`, khong luu raw key

Recommended key format:

```txt
omnirag_sk_<environment>_<random_secret>
```

Vi du:

```txt
omnirag_sk_dev_xxxxxxxxxxxxxxxxxxxxx
omnirag_sk_live_xxxxxxxxxxxxxxxxxxxxx
```

---

### 3.3 API Key Storage

Khong bao gio luu raw API Key.

Database nen luu:

```txt
key_hash
key_prefix
name
workspace_id / tenant_id
is_active
expires_at
last_used_at
created_at
revoked_at
```

`key_prefix` dung de hien thi trong dashboard, vi du:

```txt
omnirag_sk_live_abcd...wxyz
```

---

### 3.4 API Key Validation

Client goi API bang header:

```http
X-API-Key: <raw_api_key>
```

Backend validation:

```txt
Read raw API Key from header
→ Hash raw API Key
→ Find matching key_hash
→ Check key is active
→ Check not expired
→ Load workspace/tenant
→ Check workspace is active
→ Check subscription is active
→ Return API key context
```

Output cua validation dependency:

```txt
api_key_id
workspace_id / tenant_id
plan_code
subscription_status
```

---

### 3.5 Tenant Resolution Rule

Khi request dung API Key, server phai resolve tenant/workspace tu API Key.

Khong tin `tenant_id` hoac `workspace_id` client gui len body/query/header.

Dung sai:

```txt
Client sends tenant_id
Backend trusts tenant_id
```

Dung dung:

```txt
Client sends API Key
Backend resolves tenant_id from API Key
All queries use resolved tenant_id
```

---

### 3.6 API Key Revocation

Revoke API Key la thao tac vo hieu hoa key.

Khi revoke:

- Set `is_active = false`
- Set `revoked_at = now`
- Raw key khong the dung lai
- Khong xoa hard delete trong MVP de giu audit/history

---

### 3.7 API Key Rotation

Rotate API Key gom 2 cach.

MVP recommended:

```txt
Create new API Key
→ User update website/widget config
→ Revoke old API Key
```

Khong can implement one-click rotation phuc tap trong MVP.

---

### 3.8 API Key Expiration

`expires_at` co the nullable.

MVP:

```txt
expires_at = null
```

Production-ready:

```txt
expires_at = optional datetime
```

Neu key expired, request phai bi reject.

---

### 3.9 API Key Usage Tracking

Moi request thanh cong qua API Key nen cap nhat:

```txt
last_used_at
last_used_ip optional
usage counter optional
```

Usage chi tiet se duoc xu ly trong:

```txt
08_usage_quota_flow.md
```

---

## 4. Main Flow

### 4.1 Create API Key

```txt
[1] Authenticated user requests create API Key
    ↓
[2] Resolve current workspace
    ↓
[3] Check membership role: Owner/Admin
    ↓
[4] Check workspace is active
    ↓
[5] Check subscription is active
    ↓
[6] Generate raw API Key
    ↓
[7] Hash raw API Key
    ↓
[8] Store key_hash and metadata
    ↓
[9] Return raw API Key once
```

---

### 4.2 Validate API Key For Chat Request

```txt
[1] External client calls Chat API with X-API-Key
    ↓
[2] Hash incoming key
    ↓
[3] Find API Key by key_hash
    ↓
[4] Check key is active and not expired
    ↓
[5] Load workspace/tenant
    ↓
[6] Check workspace is active
    ↓
[7] Check subscription/plan status
    ↓
[8] Return API key context
    ↓
[9] Continue to Chat RAG Query Flow
```

---

## 5. Alternative / Error Flows

### 5.1 Missing API Key

```txt
Request without X-API-Key
→ Return 401 API_KEY_MISSING
```

---

### 5.2 Invalid API Key

```txt
Request with unknown key
→ Return 401 API_KEY_INVALID
```

---

### 5.3 Revoked API Key

```txt
API Key found but is_active = false
→ Return 401 API_KEY_REVOKED
```

---

### 5.4 Expired API Key

```txt
API Key expires_at < now
→ Return 401 API_KEY_EXPIRED
```

---

### 5.5 Inactive Workspace

```txt
API Key valid
→ Workspace is inactive
→ Return 403 WORKSPACE_INACTIVE
```

---

### 5.6 Inactive Subscription

```txt
API Key valid
→ Subscription not active
→ Return 403 SUBSCRIPTION_INACTIVE
```

---

### 5.7 User Without Permission Creates API Key

```txt
Authenticated user requests create key
→ Role is Member/Viewer
→ Return 403 WORKSPACE_ACCESS_DENIED
```

---

## 6. Suggested Data Models

### 6.1 `api_keys`

```txt
id
workspace_id / tenant_id
key_hash
key_prefix
name
is_active
created_by_user_id
created_at
updated_at
last_used_at
expires_at
revoked_at
```

Notes:

- `key_hash` must be unique
- `workspace_id / tenant_id` must be indexed
- `key_hash` must be indexed
- `key_prefix` is safe for display
- Raw API Key must never be stored

---

## 7. Suggested API Endpoints

### 7.1 Workspace API Key Management

Authenticated dashboard endpoints:

```http
POST /workspaces/{workspace_id}/api-keys
GET /workspaces/{workspace_id}/api-keys
DELETE /workspaces/{workspace_id}/api-keys/{api_key_id}
POST /workspaces/{workspace_id}/api-keys/{api_key_id}/revoke
POST /workspaces/{workspace_id}/api-keys/{api_key_id}/rotate
```

MVP can implement only:

```http
POST /workspaces/{workspace_id}/api-keys
GET /workspaces/{workspace_id}/api-keys
POST /workspaces/{workspace_id}/api-keys/{api_key_id}/revoke
```

---

### 7.2 Runtime API Using API Key

External client endpoints:

```http
POST /v1/chat
GET /v1/widget/config
POST /v1/ingestion/events optional
```

Required header:

```http
X-API-Key: <raw_api_key>
```

---

## 8. Security Requirements

- Never store raw API Key
- Return raw API Key only once after creation
- Hash API Key before saving or comparing
- Use constant-time comparison if comparing secrets manually
- Do not trust tenant_id/workspace_id from external client request
- Resolve tenant/workspace only from validated API Key
- API Key must be revocable
- Inactive workspace must not access runtime APIs
- Inactive subscription must not access runtime APIs
- Dashboard API Key management must check workspace membership and role
- Logs must not contain raw API Key
- Error messages must not reveal whether a workspace exists

---

## 9. Dependencies For Later Flows

This flow provides required context for:

```txt
04_knowledge_ingestion_flow.md
06_chat_rag_query_flow.md
07_widget_integration_flow.md
08_usage_quota_flow.md
09_admin_operations_flow.md
```

Required output for later runtime flows:

```txt
api_key_id
workspace_id / tenant_id
workspace_status
plan_code
subscription_status
```

---

## 10. MVP Acceptance Criteria

Flow duoc xem la hoan thanh khi:

- Owner/Admin co the tao API Key cho workspace
- Raw API Key chi hien thi mot lan sau khi tao
- Database chi luu hashed key
- User co the liet ke API Keys dang co cua workspace
- List API Keys khong tra ve raw key
- Owner/Admin co the revoke API Key
- Revoked API Key khong the goi Chat API
- Chat API co the validate `X-API-Key`
- Backend resolve duoc `workspace_id / tenant_id` tu API Key
- Runtime request bi reject neu workspace inactive
- Runtime request bi reject neu subscription inactive
- Logs khong chua raw API Key

---

## 11. Coding Agent Directives

Khi implement flow nay:

1. Dung async database session cho toan bo DB operations.
2. Khong dat business logic trong router.
3. Tao dependency rieng de validate API Key, vi du `get_api_key_context`.
4. API Key generator phai dung secure random, khong dung UUID don le lam secret.
5. Chi luu `key_hash`, khong luu raw key.
6. Response list API Keys chi tra ve metadata va `key_prefix`.
7. Runtime flow khong nhan `workspace_id` tu body de xac dinh tenant.
8. Moi service sau khi co API key context phai dung `tenant_id` da resolve.
9. Revoke nen soft-delete bang `is_active = false` va `revoked_at`.
10. Tra loi loi bang `HTTPException` voi error code ro rang.

---

## 12. Recommended Error Codes

```txt
API_KEY_MISSING
API_KEY_INVALID
API_KEY_REVOKED
API_KEY_EXPIRED
API_KEY_CREATION_FORBIDDEN
API_KEY_NOT_FOUND
WORKSPACE_ACCESS_DENIED
WORKSPACE_INACTIVE
SUBSCRIPTION_INACTIVE
QUOTA_EXCEEDED
```

---

## 13. Implementation Notes

### Recommended Hash Strategy

MVP:

```txt
key_hash = SHA256(raw_api_key)
```

Production-ready:

```txt
key_hash = HMAC_SHA256(raw_api_key, server_secret_pepper)
```

Do not expose hash value to client.

---

### Recommended API Key Context Object

```txt
APIKeyContext
- api_key_id
- workspace_id / tenant_id
- plan_code
- subscription_status
- is_workspace_active
```

This object should be injected into runtime services.

---

## 14. Output Of This Flow

Sau khi hoan thanh flow nay, he thong phai cung cap duoc:

```txt
Validated API Key
Resolved workspace / tenant
API key metadata
Runtime authentication context
Base security boundary for Chat API and Widget API
```
