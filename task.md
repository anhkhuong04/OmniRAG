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
- [ ] 2.4 Viết Unit Test cho cấu phần Chunking, Embedding và Retrieval để chạy liên tục

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

### Pha 6: Tối ưu hóa & Triển khai (Optimization & Deploy)
- [ ] 6.1 Tối ưu hóa RAG (Reranking Cross-Encoder, Hybrid Search, Caching các câu query phổ biến)
- [ ] 6.2 Tối ưu hóa chi phí token (Prompt compression, Token counter)
- [ ] 6.3 Đóng gói Docker & Docker Compose cho toàn bộ hệ thống (FastAPI, Postgres, Qdrant, UI)
- [ ] 6.4 Triển khai thực tế & Viết tài liệu bàn giao

---

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
