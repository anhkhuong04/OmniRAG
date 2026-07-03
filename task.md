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
- [ ] 4.1 Xây dựng hệ thống bảo mật Auth (API Key / HMAC Webhook)
- [ ] 4.2 Viết Middleware/Dependency tự động giải mã credentials để trích xuất và inject `tenant_id` vào request state
- [ ] 4.3 Viết Integration Test kiểm tra tính cách ly dữ liệu (Tenant A tuyệt đối không đọc được dữ liệu Tenant B)

### Pha 5: Frontend Web App / Dashboard
- [ ] 5.1 Khởi tạo giao diện UI bằng React/TypeScript
- [ ] 5.2 Xây dựng màn hình quản lý Documents & API keys cho Tenant
- [ ] 5.3 Thiết kế widget chat UI nhúng ngoài web, giao tiếp với API `/query` (hỗ trợ streaming)

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
