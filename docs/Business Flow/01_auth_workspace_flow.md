# 01 Auth & Workspace Flow

## 1. Mục tiêu

Flow này xử lý nền tảng xác thực và khởi tạo tenant/workspace cho OmniRAG SaaS.

Đây là flow bắt buộc phải hoàn thành trước các flow khác như API Key, Upload Document, Ingestion, Chat RAG và Usage Tracking.

## 2. Phạm vi

Flow bao gồm:

- Đăng ký tài khoản
- Xác thực email
- Đăng nhập
- Tạo workspace
- Gán user vào workspace với role `Owner`
- Resolve workspace hiện tại cho các request sau này

## 3. Business Rules

### 3.1 Register

User đăng ký bằng email/password.

Yêu cầu:

- Email phải unique
- Password phải được hash
- User mới tạo mặc định `is_email_verified = false`
- Chưa cho phép tạo workspace nếu email chưa verify

### 3.2 Verify Email

Sau khi đăng ký, hệ thống tạo email verification token.

Yêu cầu:

- Token có TTL, ví dụ 15–30 phút
- Token cũ bị invalidate khi tạo token mới
- Sau khi verify thành công:
  - `is_email_verified = true`
  - Token không còn sử dụng lại được

Dev mode:

- Email verification link được log ra console

Production-ready:

- Email provider phải được thiết kế dạng pluggable để sau này thay bằng SMTP/SendGrid/Mailgun.

### 3.3 Login

User chỉ được login nếu:

- Email/password hợp lệ
- Tài khoản chưa bị khóa
(Lưu ý: Không bắt buộc email đã được verify mới cho login. User chưa verify email vẫn login được để vào Dashboard nhưng sẽ bị chặn ở các tính năng cốt lõi như tạo Workspace).

Sau khi login thành công, hệ thống trả về:

- `access_token`
- `refresh_token`
(Frontend sẽ tự gọi thêm API `/auth/me` và `/workspaces` để lấy thông tin profile và danh sách tenant).

### 3.4 Create Workspace

User đã verify email có thể tạo workspace.

Khi tạo workspace:

- Tạo record workspace/tenant
- Gán user hiện tại làm `Owner`
- Tự động assign default plan: `free_trial`
- Workspace mặc định `is_active = true`

### 3.5 Workspace Membership

Một user có thể thuộc nhiều workspace.

Một workspace có thể có nhiều user.

Role cơ bản:

```txt
Owner
Admin
Member
Viewer
```

MVP bắt buộc có ít nhất:

```txt
Owner
Member
```

### 3.6 Current Workspace Context

Các API sau khi đăng nhập cần xác định workspace hiện tại.

Có thể truyền qua:

```http
X-Workspace-Id: <workspace_id>
```

Hoặc dùng workspace mặc định của user nếu chỉ có một workspace.

Mọi business query phía sau phải được scope theo:

```txt
current_workspace_id / tenant_id
```

## 4. Main Flow

```txt
[1] User Register
    ↓
[2] Create user with is_email_verified = false
    ↓
[3] Generate verification token
    ↓
[4] Send/log verification email
    ↓
[5] User verifies email
    ↓
[6] Mark user as verified
    ↓
[7] User login
    ↓
[8] Create workspace
    ↓
[9] Create membership with Owner role
    ↓
[10] Assign Free Trial plan
    ↓
[11] User can access SaaS dashboard
```

## 5. Alternative Flows

### 5.1 Resend Verification Email

```txt
User requests resend
→ Invalidate old token
→ Generate new token
→ Send/log new verification link
```

### 5.2 Login Before Email Verification

```txt
User login
→ Credentials valid
→ Trả về JWT Access Token & Refresh Token bình thường
→ Frontend gọi `/auth/me` thấy `is_email_verified = false`
→ Frontend hiển thị màn hình bắt buộc Verify Email (chặn không cho làm thao tác khác)
```

### 5.3 Create Workspace Before Email Verification

```txt
User requests create workspace
→ Check email verification
→ If not verified, return 403 EMAIL_NOT_VERIFIED
```

### 5.4 User Has No Workspace

Sau login, nếu user chưa có workspace:

```txt
Return requires_workspace_setup = true
```

Frontend redirect user đến onboarding workspace screen.

## 6. Suggested Data Models

### users

```txt
id
email
password_hash
full_name
is_email_verified
is_active
created_at
updated_at
```

### email_verification_tokens

```txt
id
user_id
token_hash
expires_at
used_at
created_at
```

### workspaces / tenants

```txt
id
name
slug
is_active
created_at
updated_at
```

### workspace_memberships

```txt
id
workspace_id
user_id
role
created_at
updated_at
```

### subscriptions

```txt
id
workspace_id
plan_code
status
started_at
expires_at
created_at
updated_at
```

## 7. Suggested API Endpoints

### Auth

```http
POST /auth/register
POST /auth/verify-email
POST /auth/resend-verification
POST /auth/login
POST /auth/refresh-token
POST /auth/logout
```

### Workspace

```http
POST /workspaces
GET /workspaces
GET /workspaces/{workspace_id}
PATCH /workspaces/{workspace_id}
GET /workspaces/{workspace_id}/members
```

## 8. Security Requirements

- Never store raw password
- Never store raw verification token
- Store only token hash
- Verification token must expire
- Verification token must be single-use
- Workspace access must always check membership
- All workspace-scoped queries must filter by `workspace_id` / `tenant_id`
- Inactive workspace must not be allowed to access API Key, Ingestion, Chat or Billing flows

## 9. Dependencies For Later Flows

This flow provides required context for:

```txt
02_plan_quota_flow.md
03_api_key_flow.md
04_knowledge_ingestion_flow.md
05_document_lifecycle_flow.md
06_chat_rag_query_flow.md
07_widget_integration_flow.md
08_usage_billing_flow.md
09_admin_operations_flow.md
```

Required output for later flows:

```txt
current_user
current_workspace_id
current_role
workspace_status
subscription_plan
```

## 10. MVP Acceptance Criteria

Flow được xem là hoàn thành khi:

- User có thể register
- Verification email được log ra console
- User có thể verify email
- User chưa verify vẫn có thể login nhưng KHÔNG THỂ tạo workspace (Backend chặn 403 ở API tạo workspace)
- User có thể tạo workspace sau khi verify
- User tạo workspace được gán role `Owner`
- Workspace được auto-assign plan `free_trial`
- API có thể resolve `current_workspace_id`
- Middleware/dependency có thể kiểm tra user có quyền truy cập workspace hay không

## 11. Coding Agent Directives

Khi implement flow này:

1. Dùng async database session cho toàn bộ DB operations.
2. Tách rõ router, service, repository/model, schema.
3. Không để business logic trong router.
4. Không hard-code email provider.
5. Dùng `EmailProvider` abstraction.
6. Dev mode dùng `ConsoleEmailProvider`.
7. Password và token phải được hash trước khi lưu DB.
8. Mọi workspace query phải check membership.
9. Không cho inactive user hoặc inactive workspace truy cập hệ thống.
10. Trả lỗi bằng `HTTPException` với error code rõ ràng.

## 12. Recommended Error Codes

```txt
EMAIL_ALREADY_EXISTS
INVALID_CREDENTIALS
EMAIL_NOT_VERIFIED
INVALID_VERIFICATION_TOKEN
EXPIRED_VERIFICATION_TOKEN
WORKSPACE_NOT_FOUND
WORKSPACE_ACCESS_DENIED
WORKSPACE_INACTIVE
USER_INACTIVE
```
