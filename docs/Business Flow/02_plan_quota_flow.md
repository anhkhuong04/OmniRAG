# 02 Plan & Quota Flow

## 1. Muc tieu

Flow nay quan ly goi dich vu, subscription va quota cua tung workspace trong OmniRAG SaaS.

Day la flow nen duoc thuc hien ngay sau `01_auth_workspace_flow.md`, vi moi workspace moi tao can duoc gan plan mac dinh va quota ban dau truoc khi upload tai lieu, tao API key hoac goi Chat API.

---

## 2. Pham vi

Flow bao gom:

- Tu dong gan `free_trial` plan khi workspace duoc tao
- Quan ly plan hien tai cua workspace
- Quan ly subscription status
- Khoi tao quota theo plan
- Kiem tra quota truoc cac hanh dong ton tai nguyen
- Cho phep nang cap/ha cap plan o muc business rule
- Ho tro mo rong thanh billing/payment flow sau nay

Ngoai pham vi MVP:

- Thanh toan that qua Stripe/VNPay
- Invoice
- Refund
- Tax
- Payment webhook production

---

## 3. Business Rules

### 3.1 Default Plan

Khi workspace duoc tao thanh cong, he thong tu dong gan plan mac dinh:

```txt
plan_code = free_trial
subscription_status = active
```

Khong bat user chon plan trong MVP.

Ly do:

- Giam friction trong onboarding
- Cho user nhanh chong upload tai lieu va test chatbot
- Tap trung vao core RAG flow truoc billing

---

### 3.2 Plan Definition

Plan dinh nghia gioi han tai nguyen cho workspace.

Vi du MVP:

```txt
free_trial:
  max_documents = 20
  max_monthly_queries = 1000
  max_storage_mb = 50
  max_api_keys = 3
  max_team_members = 2
  max_chatbots = 1
```

Cac plan co the mo rong:

```txt
free_trial
starter
pro
business
enterprise
```

---

### 3.3 Subscription Status

Moi workspace co mot subscription hien tai.

Trang thai co ban:

```txt
active
expired
canceled
past_due
suspended
```

MVP bat buoc xu ly:

```txt
active
expired
suspended
```

Quy tac:

- `active`: workspace co the su dung dich vu trong gioi han quota
- `expired`: free trial het han hoac subscription het han
- `suspended`: workspace bi khoa boi system admin hoac do vi pham quota/policy

---

### 3.4 Quota Enforcement

Quota phai duoc kiem tra truoc cac action ton tai nguyen.

Can check quota truoc:

```txt
Upload document
Create API key
Send chat query
Invite member
Create chatbot
```

Neu vuot quota:

```txt
Return 403 QUOTA_EXCEEDED
```

Khong nen chi log warning ma van cho phep tiep tuc trong MVP, vi embedding va LLM co chi phi that.

---

### 3.5 Monthly Usage Reset

Query quota nen tinh theo thang.

Quy tac MVP:

```txt
usage_period = current month
monthly_query_count reset theo tung thang
```

Co the reset bang:

- scheduled job
- lazy reset khi co request moi
- tinh theo `period_start` va `period_end`

Khuyen nghi MVP: dung `period_start` va `period_end`, khong can job reset phuc tap.

---

### 3.6 Upgrade / Downgrade

MVP co the chi mo phong upgrade plan, chua can payment that.

Upgrade:

```txt
User selects new plan
→ Validate workspace owner/admin
→ Update subscription plan_code
→ Apply new quota limits
→ Keep usage counters
```

Downgrade:

```txt
User selects lower plan
→ Validate current usage against new quota
→ If current usage exceeds new quota, block downgrade
```

Vi du:

```txt
Workspace has 15 documents
Target plan allows 10 documents
→ Downgrade denied
```

---

## 4. Main Flow

```txt
[1] Workspace created
    ↓
[2] Create default subscription
    ↓
[3] Assign plan_code = free_trial
    ↓
[4] Initialize quota limits
    ↓
[5] Workspace can use SaaS features
    ↓
[6] Before each resource action, check quota
    ↓
[7] Allow action or return quota error
```

---

## 5. Quota Check Flow

```txt
[1] User requests resource action
    ↓
[2] Resolve current workspace
    ↓
[3] Load active subscription
    ↓
[4] Load plan quota limits
    ↓
[5] Load current usage
    ↓
[6] Compare usage with limit
    ↓
[7] Allow or reject action
```

Example:

```txt
POST /documents/upload
→ Check workspace active
→ Check subscription active
→ Check document count < max_documents
→ Check storage usage < max_storage_mb
→ Allow upload
```

---

## 6. Alternative Flows

### 6.1 Workspace Has No Subscription

```txt
Request uses workspace
→ No subscription found
→ Return 403 SUBSCRIPTION_REQUIRED
```

This should not happen if workspace creation is correct.

---

### 6.2 Free Trial Expired

```txt
Request uses workspace
→ Subscription status = expired
→ Return 403 SUBSCRIPTION_EXPIRED
```

Allowed actions after expiration:

```txt
View dashboard
View billing page
Upgrade plan
Export data
```

Blocked actions:

```txt
Upload document
Create API key
Send chat query
Create chatbot
```

---

### 6.3 Quota Exceeded

```txt
Request action
→ Current usage >= quota limit
→ Return 403 QUOTA_EXCEEDED
```

Response should include:

```txt
quota_type
current_usage
limit
upgrade_required
```

---

### 6.4 Workspace Suspended

```txt
Request uses workspace
→ Workspace/subscription suspended
→ Return 403 WORKSPACE_SUSPENDED
```

System admin can unsuspend workspace later.

---

## 7. Suggested Data Models

### 7.1 `plans`

```txt
id
code
name
description
is_active
created_at
updated_at
```

Example:

```txt
code = free_trial
name = Free Trial
```

---

### 7.2 `plan_limits`

```txt
id
plan_id
max_documents
max_monthly_queries
max_storage_mb
max_api_keys
max_team_members
max_chatbots
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

MVP default:

```txt
status = active
plan_code = free_trial
```

---

### 7.4 `usage_records`

```txt
id
workspace_id
period_start
period_end
document_count
monthly_query_count
storage_used_mb
api_key_count
team_member_count
chatbot_count
created_at
updated_at
```

Note:

- `document_count`, `api_key_count`, `team_member_count`, `chatbot_count` can be computed from database.
- `monthly_query_count` should be persisted for fast quota check.
- Token usage can be added later in `08_usage_quota_flow.md`.

---

## 8. Suggested API Endpoints

### 8.1 Plans

```http
GET /plans
GET /plans/{plan_code}
```

---

### 8.2 Workspace Subscription

```http
GET /workspaces/{workspace_id}/subscription
PATCH /workspaces/{workspace_id}/subscription/plan
```

---

### 8.3 Quota

```http
GET /workspaces/{workspace_id}/quota
GET /workspaces/{workspace_id}/usage
```

---

## 9. Security Requirements

- Only workspace `Owner` or `Admin` can change plan
- All subscription and quota queries must filter by `workspace_id`
- User must be a member of workspace before viewing subscription/usage
- Inactive plans cannot be assigned to new subscriptions
- Suspended workspace must be blocked from resource-consuming actions
- Quota check must run server-side, never rely on frontend validation

---

## 10. Dependencies

Depends on:

```txt
01_auth_workspace_flow.md
```

Provides context for:

```txt
03_api_key_flow.md
04_knowledge_ingestion_flow.md
06_chat_rag_query_flow.md
07_widget_integration_flow.md
08_usage_quota_flow.md
09_admin_operations_flow.md
```

Required input:

```txt
current_user
current_workspace_id
current_role
workspace_status
```

Required output:

```txt
current_plan
subscription_status
quota_limits
current_usage
```

---

## 11. MVP Acceptance Criteria

Flow duoc xem la hoan thanh khi:

- Workspace moi duoc auto-assign `free_trial`
- He thong co plan va quota limits mac dinh
- Co the lay subscription hien tai cua workspace
- Co the lay quota hien tai cua workspace
- Upload document bi chan khi vuot `max_documents`
- Chat query bi chan khi vuot `max_monthly_queries`
- Create API key bi chan khi vuot `max_api_keys`
- Workspace expired/suspended khong the dung API key, ingestion hoac chat
- Owner/Admin co the doi plan o muc mock/manual
- Tat ca query subscription/usage deu scope theo `workspace_id`

---

## 12. Coding Agent Directives

Khi implement flow nay:

1. Khong hard-code quota truc tiep trong service logic.
2. Dinh nghia quota thong qua `plans` va `plan_limits`.
3. Workspace creation service phai tao subscription mac dinh trong cung transaction neu co the.
4. Moi resource-consuming action phai goi quota guard truoc khi xu ly.
5. Quota guard phai nhan `workspace_id` va `quota_type` ro rang.
6. Khong cho inactive/suspended workspace thuc hien action ton tai nguyen.
7. Khong cho user khong thuoc workspace xem subscription hoac usage.
8. Dung async database session cho toan bo DB operations.
9. Khong dat business logic trong router.
10. Tra loi loi bang `HTTPException` kem error code ro rang.

---

## 13. Recommended Error Codes

```txt
PLAN_NOT_FOUND
PLAN_INACTIVE
SUBSCRIPTION_REQUIRED
SUBSCRIPTION_EXPIRED
SUBSCRIPTION_INACTIVE
WORKSPACE_SUSPENDED
QUOTA_EXCEEDED
PLAN_CHANGE_DENIED
DOWNGRADE_NOT_ALLOWED
WORKSPACE_ACCESS_DENIED
```

---

## 14. Implementation Notes

### Recommended Default Config

```env
DEFAULT_PLAN_CODE=free_trial
FREE_TRIAL_DAYS=14
```

### Recommended MVP Free Trial Limits

```txt
max_documents = 20
max_monthly_queries = 1000
max_storage_mb = 50
max_api_keys = 3
max_team_members = 2
max_chatbots = 1
```

### Recommended Quota Guard Interface

```txt
check_quota(workspace_id, quota_type, increment=1)
```

Example quota types:

```txt
document_count
monthly_query_count
storage_used_mb
api_key_count
team_member_count
chatbot_count
```

---

## 15. Output Of This Flow

Sau khi hoan thanh flow nay, he thong phai cung cap duoc cac dependency sau cho flow tiep theo:

```txt
Active subscription
Current plan
Quota limits
Current usage counters
Quota guard service
Plan change rule
```
