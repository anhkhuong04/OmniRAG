# Nhật ký dự án OmniRAG

## Tiến độ chung

### Pha 1: Khởi tạo & Kiến trúc nền tảng (Foundation)
- [x] 1.1 Khởi tạo dự án, thiết lập overview.md & cấu hình Agent (.agents/AGENTS.md)
- [x] 1.2 Khởi tạo cấu trúc thư mục FastAPI theo Clean Architecture & cài đặt môi trường
- [x] 1.3 Thiết kế chi tiết Data Model (Postgres schema) cho `tenants`, `documents`, `api_keys`

### Pha 2: Thử nghiệm RAG Core bằng Script (Chưa viết API)
- [x] 2.1 Viết script logic Chunking (Text Splitting) và sinh Embedding
- [x] 2.2 Viết script lưu trữ vector vào Qdrant (với metadata filter `tenant_id` phục vụ cô lập dữ liệu)
- [x] 2.3 Viết script truy vấn thử nghiệm (Similarity Search + Tenant Filtering)
- [x] 2.4 Viết Unit Test cho cấu phần Chunking, Embedding và Retrieval để chạy liên tục (Đã hoàn thành và xác minh qua scripts/test_rag_core.py)

### Pha 3: Xây dựng API Layer & Cơ sở dữ liệu (Postgres + FastAPI)
- [x] 3.1 Khởi tạo kết nối Database (Postgres AsyncEngine) và cơ chế tự động sinh bảng.
- [x] 3.2 Định nghĩa Pydantic Schemas (Request/Response) cho API (DocumentUpload, Query, ChatHistory...).
- [x] 3.3 Viết Dependencies (FastAPI `Depends`) cung cấp DB Session và Mock Auth (lấy `tenant_id` từ HTTP Header).
- [x] 3.4 Bọc lõi Ingestion thành API endpoint `POST /documents/ingest` (Lưu siêu dữ liệu vào Postgres -> Nạp Vector vào Qdrant).
- [x] 3.5 Bọc lõi Query thành API endpoint `POST /chat/query` (Lưu lịch sử hội thoại vào Postgres -> RAG -> Trả về kết quả).
- [x] 3.6 Tích hợp Routers vào `main.py` và viết Integration Test giả lập gọi API để kiểm tra toàn bộ luồng.

### Pha 4: Hoàn thiện Authentication & Cách ly Tenant thực tế
- [x] 4.1 Tạo `backend/core/security.py`: Hàm sinh API Key và băm SHA-256.
- [x] 4.2 Cập nhật `backend/core/config.py`: Thêm biến `ADMIN_SECRET_KEY`.
- [x] 4.3 Viết lại `backend/api/dependencies.py`: Xác thực qua `Authorization: Bearer`, truy vấn DB, check `is_active`. Thêm `verify_admin_key` với `secrets.compare_digest()`.
- [x] 4.4 Tạo `backend/schemas/admin.py`: Pydantic schema cho Tenant và APIKey.
- [x] 4.5 Tạo `backend/api/routes/admin.py`: Endpoints tạo Tenant, tạo APIKey, Revoke APIKey.
- [x] 4.6 Cập nhật `backend/main.py`: Tích hợp router admin.
- [x] 4.7 Viết `scripts/test_auth_isolation.py`: Kiểm thử bảo mật Admin, cách ly Tenant, Revoke key.

### Pha 5: Frontend Web App / Dashboard
- [x] 5.1 Khởi tạo dự án Vite (React + TS) và cài đặt `lucide-react`, `axios`, `react-markdown`.
- [x] 5.2 Thiết lập Design System (Vanilla CSS): Cấu hình biến màu, typography, khoảng cách, micro-animations tại `index.css`.
- [x] 5.3 Xây dựng `services/api.ts` kết nối với FastAPI (Admin, Ingest, Chat). Cấu hình Proxy Vite.
- [x] 5.4 Xây dựng `AdminPage.tsx`: Giao diện Admin quản lý Tenant và API Keys.
- [x] 5.5 Xây dựng `TenantDashboard.tsx`: Giao diện khách hàng (Nhập API Key, Upload tài liệu).
### Pha 5.5: SaaS Landing Page
- [x] 5.5.1 Cập nhật `index.css`: Thêm gradient, badge-pill, glass-card styles.
- [x] 5.5.2 Xây dựng `LandingPage.tsx`: Layout 10 sections (Hero, Features, Pricing,...).
- [x] 5.5.3 Tái cấu trúc routing `App.tsx`: `/` cho Landing, `/dashboard` cho Dashboard.


### Pha 8: Phát triển nghiệp vụ SaaS (SaaS Business Flow)
**Phase 8.1: Auth, Workspace & Plan Onboarding (Các bước 1-4)**
- [x] 8.1.1 Xây dựng `User`, `UserTenantLink`, `Subscription` models (cấu hình quan hệ, RBAC roles).
- [x] 8.1.2 Xây dựng Auth Service & Routes: JWT, Register, Login.
- [x] 8.1.3 Tích hợp xác thực Email: Token có TTL, xử lý gửi OTP/Link, invalidate old tokens.
- [x] 8.1.4 Xây dựng API cho Workspace: Đảm bảo Data Isolation với Row-level Filter theo `tenant_id`.
- [x] 8.1.5 Xây dựng UI (React) cho luồng Onboarding: Auth Pages, Verify Email, Workspace Creation.

**Phase 8.2: Ingestion Pipeline & Usage Tracking (Các bước 5-11)**
- [x] 8.2.1 Bổ sung Validation giới hạn tài nguyên và xử lý Trùng lặp (Idempotency / Hash content) cho File Upload.
- [x] 8.2.2 Tách Ingestion Pipeline thành Background Jobs (Queue/Worker), thiết lập cơ chế Retry độc lập.
- [x] 8.2.3 Cấu hình API endpoints để Frontend có thể Polling/WebSocket trạng thái xử lý tài liệu.
- [x] 8.2.4 Hoàn thiện API Key Management: Giới hạn theo Workspace, Revoke, ghi Log Usage để tính phí.
- [x] 8.2.5 Mở rộng Dashboard UI: Quản lý thành viên (Invite Team), Theo dõi chi phí Token và hạn mức.

**Phase 8.3: Document Lifecycle (Retry & Re-index)**
- [x] 8.3.1 Cập nhật Endpoint `/documents/ingest` để lưu file `.txt` vật lý vào thư mục `storage/tenants/{tenant_id}/` và cập nhật trường `storage_path`.
- [x] 8.3.2 Cập nhật `document_service.py` thêm hàm `retry_ingestion` (Đọc file vật lý, đổi status `pending`, chạy lại background job).
- [x] 8.3.3 Cập nhật `document_service.py` thêm hàm `reindex_document` (Xóa vector cũ, đổi status `pending`, đọc file vật lý, chạy lại background job).
- [x] 8.3.4 Bổ sung 2 endpoint `POST /documents/{id}/retry` và `POST /documents/{id}/reindex` vào `documents.py` router.
- [x] 8.3.5 Cập nhật Frontend: Bổ sung 2 API functions trong `api.ts` và thêm nút Retry/Re-index trên UI `DocumentList.tsx`.

**Phase 8.4: Chat RAG Query & Widget Integration (Flow 06 & 07)**
- [x] 8.4.1 Xây dựng DB Models: `Conversation`, `Message`, `WidgetConfig`, `WidgetAllowedDomain`.
- [x] 8.4.2 Xây dựng LLM Service (`rag_service.py`) tích hợp OpenAI: Build prompt grounded theo context, đếm token usage.
- [x] 8.4.3 Viết `POST /chat/query` API: Validate API Key -> Check Quota -> Embed Query -> Qdrant Search (`tenant_id` filter) -> LLM -> Lưu `messages` -> Ghi Usage.
- [x] 8.4.4 Xây dựng Public Widget API (`GET /public/widgets/{widget_id}/config`, `POST /public/widgets/{widget_id}/chat`) hỗ trợ check Allowed Domains.
- [x] 8.4.5 Xây dựng UI Widget (Javascript/React): Chat UI nhúng website khách hàng.
- [x] 8.4.6 Nâng cấp `ChatWidget.tsx` trong Tenant Dashboard để sử dụng chung logic với Public Widget.

---

**Phase 8.5: Usage History & Hard Quota Enforcement (Flow 08)**
- [x] 8.5.1 Cập nhật `vector_service.py` và `document_service.py`: Trả về `prompt_tokens` khi nhúng (Embedding) và ghi nhận vào `UsageLog`.
- [x] 8.5.2 Cập nhật model `Document` (thêm `file_size_bytes`), lưu size khi upload và viết hàm `check_storage_limit` trong `plan_guard_service.py` để chặn nếu vượt `max_storage_mb` của toàn Workspace.
- [x] 8.5.3 Viết API `GET /workspaces/{id}/api-keys/usage/history` tổng hợp Usage Log theo từng tháng (YYYY-MM).
- [x] 8.5.4 Nâng cấp `UsageStatsCard.tsx` trên Frontend để hiển thị lịch sử Token/Chi phí các tháng trước.

---

**Phase 9: Admin Operations (Flow 09)**
- [x] 9.1 Cập nhật Model `User` (thêm `is_system_admin`), `Tenant` (đã có `is_active`), và tạo Model `AdminAuditLog`.
- [x] 9.2 Chặn quyền truy cập (API Key & JWT) nếu Tenant bị disable (`is_active = False`).
- [x] 9.3 Viết `admin_service.py` xử lý logic (Disable/Enable Tenant, System Usage, Failed Jobs, Retry, Audit Logs).
- [x] 9.4 Viết API Router `backend/api/routes/admin.py` bảo vệ bằng dependency `is_system_admin`.
- [x] 9.5 Xây dựng giao diện Frontend `AdminDashboard.tsx` cho phép System Admin quản lý toàn hệ thống.

## Cập nhật theo ngày

### Ngày 29/06/2026

**Kế hoạch hôm nay:**
- Khởi tạo thư mục dự án và các cấu hình Agent (`.agents/`).
- Lên kế hoạch cấu trúc thư mục cho FastAPI theo Clean Architecture.
- Đề xuất và chờ duyệt Kế hoạch triển khai cấu trúc Core RAG.
- Bắt đầu setup code nền tảng (nếu được duyệt).

**Đã hoàn thành:**
- [x] Tạo file `overview.md` (do User tạo).
- [x] Thiết lập Global Rules và Agent Skills (UI: React/TS, Backend: Clean Arch + Async).
- [x] Tạo file `task.md` theo dõi tiến độ.
- [x] Trình bày Kế hoạch triển khai Core RAG (FastAPI).
- [x] Khởi tạo thư mục và cài đặt môi trường FastAPI.

---

## Hướng dẫn Startup dự án trên máy Local

Dự án bao gồm 3 thành phần cần được khởi động theo thứ tự sau:

### 1. Khởi động các dịch vụ Hạ tầng (PostgreSQL & Qdrant)
Đảm bảo bạn đã cài đặt Docker và đang mở Docker Desktop. Khởi động cơ sở dữ liệu quan hệ và vector database bằng cách chạy lệnh sau tại thư mục gốc của dự án:
```powershell
docker compose up -d
```
*Kiểm tra:* Đảm bảo hai container `omnirag_postgres` (cổng 5432) và `omnirag_qdrant` (cổng 6333) đang ở trạng thái hoạt động (`Up`).

### 2. Khởi động Backend (FastAPI)
Mở một cửa sổ Terminal mới tại thư mục gốc dự án, sử dụng Python trong môi trường ảo `venv` để chạy máy chủ API:
```powershell
# Chạy backend qua môi trường ảo (Windows PowerShell)
.\backend\venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
*Đường dẫn truy cập:*
- Trang tài liệu API: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Khởi động Frontend (React + Vite)
Mở một cửa sổ Terminal mới, di chuyển vào thư mục `frontend` và khởi chạy máy chủ phát triển Vite:
```powershell
# Di chuyển vào thư mục frontend
cd frontend

# Khởi động dev server
npm run dev
```
*Đường dẫn truy cập:*
- Giao diện Dashboard & Landing page: [http://localhost:5173/](http://localhost:5173/)

