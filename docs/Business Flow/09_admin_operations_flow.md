# 09 Admin Operations Flow

## 1. Mục tiêu

Flow này mô tả các nghiệp vụ dành cho **System Admin** của OmniRAG SaaS.

Mục tiêu là giúp đội vận hành có thể giám sát tenant, kiểm soát usage, xử lý lỗi ingestion, khóa/mở workspace và theo dõi tình trạng hệ thống.

Flow này không dành cho Tenant Admin thông thường.

---

## 2. Phạm vi

Flow bao gồm:

- Xem danh sách workspace/tenant
- Xem chi tiết tenant
- Disable / enable tenant
- Xem usage theo tenant
- Xem document và ingestion jobs bị lỗi
- Retry failed ingestion jobs
- Quản lý plan cơ bản
- Xem audit log
- Theo dõi system health ở mức MVP

---

## 3. Actor

```txt
System Admin
```

System Admin là người vận hành nền tảng OmniRAG, có quyền truy cập dashboard nội bộ để quản lý toàn bộ tenants.

Không nhầm với:

```txt
Workspace Owner
Tenant Admin
End User
```

---

## 4. Business Rules

### 4.1 Admin Access

Chỉ user có role hệ thống mới được truy cập admin endpoints.

Role đề xuất:

```txt
system_admin
```

Mọi admin request phải kiểm tra:

```txt
current_user.is_system_admin == true
```

Hoặc kiểm tra qua bảng role/permission riêng nếu hệ thống đã hỗ trợ RBAC nâng cao.

---

### 4.2 View Tenants

System Admin có thể xem danh sách workspace/tenant.

Thông tin tối thiểu:

```txt
tenant_id / workspace_id
name
owner_email
plan_code
subscription_status
is_active
document_count
monthly_query_count
created_at
```

Hỗ trợ filter:

```txt
is_active
plan_code
subscription_status
created_at range
usage threshold
```

Hỗ trợ search theo:

```txt
workspace name
owner email
workspace_id
```

---

### 4.3 View Tenant Detail

System Admin có thể xem chi tiết một tenant.

Thông tin nên có:

```txt
workspace information
owner information
members
active API keys count
document count
failed document count
monthly usage
subscription status
latest conversations count
created_at
updated_at
```

Không hiển thị raw API key.

Không hiển thị full message content mặc định nếu không cần thiết.

---

### 4.4 Disable Tenant

System Admin có thể disable tenant khi:

```txt
abuse detected
payment issue
security issue
manual support request
policy violation
```

Khi tenant bị disable:

- Tenant dashboard không được sử dụng các chức năng chính
- API Key validation phải fail
- Chat API phải bị chặn
- Ingestion mới phải bị chặn
- Existing background jobs có thể được giữ nguyên hoặc cancel tùy policy

Trạng thái tenant:

```txt
active
suspended
disabled
```

MVP có thể dùng boolean:

```txt
is_active = false
```

Nhưng nên thiết kế mở rộng được sang status enum.

---

### 4.5 Enable Tenant

System Admin có thể enable lại tenant nếu vấn đề đã được xử lý.

Khi enable:

- API Key active có thể hoạt động lại
- Chat API được phép gọi lại
- Tenant có thể upload tài liệu mới
- Usage tracking tiếp tục hoạt động

Không tự động reset quota trừ khi Admin thực hiện hành động riêng.

---

### 4.6 View Failed Ingestion Jobs

System Admin có thể xem các document/job bị lỗi trong toàn hệ thống.

Thông tin tối thiểu:

```txt
job_id
tenant_id
document_id
filename
status
error_code
error_message
retry_count
created_at
updated_at
```

Hỗ trợ filter:

```txt
tenant_id
status
error_code
created_at range
retry_count
```

---

### 4.7 Retry Failed Job

System Admin có thể retry failed ingestion job.

Điều kiện retry:

- Tenant còn active
- Document chưa bị deleted
- Job đang ở trạng thái `failed`
- Retry count chưa vượt giới hạn

Khi retry:

```txt
failed
→ queued
→ processing
→ completed / failed
```

Phải log lại hành động retry vào audit log.

---

### 4.8 Usage Inspection

System Admin có thể xem usage của toàn hệ thống và từng tenant.

Metrics tối thiểu:

```txt
total queries
embedding tokens
prompt tokens
completion tokens
total tokens
storage used
vector count
failed jobs count
active tenants count
```

MVP có thể thống kê theo ngày/tháng.

---

### 4.9 Plan Management

MVP chỉ cần System Admin xem danh sách plan và trạng thái subscription của tenant.

Optional admin actions:

```txt
change tenant plan
extend trial
reset quota manually
mark subscription inactive
```

Mọi thay đổi plan/subscription phải được audit.

---

### 4.10 Audit Log

Các hành động quan trọng phải được ghi audit log.

Ví dụ:

```txt
tenant_disabled
tenant_enabled
plan_changed
quota_reset
failed_job_retried
api_key_revoked_by_admin
```

Audit log phải lưu:

```txt
actor_user_id
action
target_type
target_id
metadata
created_at
```

---

## 5. Main Flow

```txt
[1] System Admin login
    ↓
[2] Access admin dashboard
    ↓
[3] View tenants / system usage / failed jobs
    ↓
[4] Select tenant or failed job
    ↓
[5] Perform admin action
    ↓
[6] Validate permission and target state
    ↓
[7] Execute action
    ↓
[8] Write audit log
    ↓
[9] Return updated state
```

---

## 6. Alternative Flows

### 6.1 Unauthorized Admin Access

```txt
User requests admin endpoint
→ User is authenticated
→ User is not system admin
→ Return 403 ADMIN_ACCESS_DENIED
```

---

### 6.2 Disable Already Disabled Tenant

```txt
Admin disables tenant
→ Tenant already inactive/disabled
→ Return current state without duplicate side effects
```

---

### 6.3 Retry Job Of Inactive Tenant

```txt
Admin retries failed job
→ Tenant is inactive
→ Return 409 TENANT_INACTIVE
```

---

### 6.4 Retry Non-Failed Job

```txt
Admin retries job
→ Job status is not failed
→ Return 409 JOB_NOT_RETRYABLE
```

---

### 6.5 View Missing Tenant

```txt
Admin requests tenant detail
→ Tenant not found
→ Return 404 TENANT_NOT_FOUND
```

---

## 7. Suggested Data Models

### 7.1 `admin_audit_logs`

```txt
id
actor_user_id
action
target_type
target_id
metadata
created_at
```

---

### 7.2 `ingestion_jobs`

Nếu chưa có ở flow ingestion, nên bổ sung model này.

```txt
id
workspace_id / tenant_id
document_id
status
error_code
error_message
retry_count
started_at
finished_at
created_at
updated_at
```

---

### 7.3 `workspaces` / `tenants`

Admin flow sử dụng lại model workspace/tenant.

```txt
id
name
slug
status / is_active
created_at
updated_at
```

---

### 7.4 `usage_records`

Admin flow sử dụng lại usage data từ `08_usage_quota_flow.md`.

```txt
id
workspace_id / tenant_id
usage_type
quantity
period_start
period_end
created_at
```

---

## 8. Suggested API Endpoints

### 8.1 Tenant Operations

```http
GET /admin/tenants
GET /admin/tenants/{tenant_id}
POST /admin/tenants/{tenant_id}/disable
POST /admin/tenants/{tenant_id}/enable
```

---

### 8.2 Usage Operations

```http
GET /admin/usage/summary
GET /admin/tenants/{tenant_id}/usage
```

---

### 8.3 Ingestion Operations

```http
GET /admin/ingestion-jobs
GET /admin/ingestion-jobs/{job_id}
POST /admin/ingestion-jobs/{job_id}/retry
```

---

### 8.4 Plan Operations

```http
GET /admin/plans
GET /admin/tenants/{tenant_id}/subscription
PATCH /admin/tenants/{tenant_id}/subscription
```

---

### 8.5 Audit Operations

```http
GET /admin/audit-logs
GET /admin/tenants/{tenant_id}/audit-logs
```

---

## 9. Security Requirements

- Admin endpoints must require authenticated user
- Admin endpoints must require `system_admin` permission
- Never expose raw API keys
- Never expose password hashes or verification tokens
- Tenant disable must block runtime API access
- Admin actions must be logged in audit log
- Audit logs should be append-only
- Sensitive metadata should be redacted before returning response
- All list endpoints should support pagination

---

## 10. Dependencies

This flow depends on:

```txt
01_auth_workspace_flow.md
02_plan_quota_flow.md
03_api_key_flow.md
04_knowledge_ingestion_flow.md
08_usage_quota_flow.md
```

This flow provides operational control for:

```txt
Tenant management
Failed ingestion recovery
Usage inspection
Manual support operations
```

---

## 11. MVP Acceptance Criteria

Flow được xem là hoàn thành khi:

- System Admin có thể truy cập admin endpoints
- Non-admin user bị chặn khỏi admin endpoints
- Admin có thể xem danh sách tenants
- Admin có thể xem chi tiết tenant
- Admin có thể disable tenant
- Disabled tenant không thể dùng API Key, Chat API hoặc Ingestion API
- Admin có thể enable lại tenant
- Admin có thể xem failed ingestion jobs
- Admin có thể retry failed ingestion job hợp lệ
- Admin có thể xem usage summary cơ bản
- Admin actions được ghi audit log

---

## 12. Coding Agent Directives

Khi implement flow này:

1. Không trộn System Admin với Workspace Owner.
2. Tạo dependency riêng để kiểm tra quyền system admin.
3. Không expose raw API key trong bất kỳ admin response nào.
4. Không expose password hash, token hash hoặc secret fields.
5. Mọi admin action thay đổi state phải ghi audit log.
6. Disable tenant phải ảnh hưởng đến API key validation, ingestion và chat runtime.
7. List endpoints phải có pagination.
8. Filter và search phải được validate rõ ràng.
9. Không đặt business logic trong router.
10. Dùng async database session cho toàn bộ DB operations.

---

## 13. Recommended Error Codes

```txt
ADMIN_ACCESS_DENIED
TENANT_NOT_FOUND
TENANT_INACTIVE
TENANT_ALREADY_DISABLED
TENANT_ALREADY_ACTIVE
JOB_NOT_FOUND
JOB_NOT_RETRYABLE
JOB_RETRY_LIMIT_EXCEEDED
AUDIT_LOG_WRITE_FAILED
INVALID_ADMIN_ACTION
```

---

## 14. Output Of This Flow

Sau khi hoàn thành flow này, hệ thống có khả năng:

```txt
Operate tenants
Inspect platform usage
Recover failed ingestion jobs
Disable abusive or inactive tenants
Audit sensitive admin actions
Support production operations later
```

