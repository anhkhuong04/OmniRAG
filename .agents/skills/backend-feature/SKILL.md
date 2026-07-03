---
name: backend-feature
description: Kích hoạt kỹ năng này khi người dùng yêu cầu tạo mới hoặc chỉnh sửa API endpoints, Business Logic, cấu trúc database, hoặc tính năng Backend.
---

# Backend Architecture & Clean Code Rules

Khi phát triển tính năng backend cho OmniRAG, bạn PHẢI tuân thủ các quy chuẩn sau:

## 1. Clean Architecture (Phân lớp mã nguồn)
Mã nguồn phải được đặt đúng layer và tuân thủ dependency flow (từ ngoài vào trong):
*   **`api/` (Routing & Delivery):** Định nghĩa FastAPI routers, endpoints, dependencies (Auth, DB Session). Không viết business logic ở đây.
*   **`services/` (Business Logic):** Chứa các xử lý logic nghiệp vụ chính (`document_service`, `rag_service`, `vector_service`). Nhận đầu vào là các clean types và trả về kết quả cho routing layer.
*   **`models/` (Database Models):** Định nghĩa SQLModel classes (Postgres tables). Đảm bảo mọi model liên quan đến dữ liệu tenant đều có trường `tenant_id: UUID` (hoặc `str` tùy thiết kế).
*   **`schemas/` (Validation DTOs):** Chứa Pydantic models để validate dữ liệu đầu vào và định dạng dữ liệu đầu ra cho API.
*   **`core/` (Configurations & Shared utilities):** Chứa file `config.py` đọc cấu hình từ env, các hàm helper dùng chung.

## 2. Multi-Tenancy & Tenant Isolation (Bắt buộc)
Bảo mật phân tách dữ liệu giữa các tenants là ưu tiên số 1:
*   **PostgreSQL Query:** Mọi truy vấn đọc/ghi thông qua SQLModel `AsyncSession` tác động đến dữ liệu khách hàng đều phải áp dụng màng lọc `where(Model.tenant_id == current_tenant_id)`.
*   **Qdrant Query:** Mọi câu lệnh tìm kiếm tương đồng (similarity search) hoặc xóa/cập nhật vector trong Qdrant đều phải truyền đối tượng `Filter` lọc theo payload `tenant_id`.
    *   *Ví dụ:* `Filter(must=[FieldCondition(key="tenant_id", match=MatchValue(value=tenant_id))])`
*   **Injecting Tenant ID:** Sử dụng cơ chế FastAPI Dependency Injection để trích xuất `tenant_id` từ API Key/Token ở tầng API rồi truyền xuống Service layer dưới dạng tham số bắt buộc. Không tự ý "hardcode" hoặc bỏ qua tham số này trong service.

## 3. Asynchronous First (Bất đồng bộ)
*   Bắt buộc sử dụng `async/await` cho toàn bộ các thao tác I/O như: truy vấn Postgres (`AsyncSession`), làm việc với Qdrant (`AsyncQdrantClient`), gọi LLM APIs (OpenAI/Gemini Async Clients), đọc ghi file hoặc request ngoài.
*   Tránh sử dụng các thư viện synchronous chặn (blocking) event loop.

## 4. Coding Conventions & Typing
*   **Strict Typing:** Khai báo đầy đủ Type Hints cho tham số đầu vào và kiểu dữ liệu trả về của tất cả các hàm/phương thức.
*   **Docstrings:** Viết docstring theo chuẩn Google style cho các class phức tạp và các hàm xử lý logic RAG/Auth.
*   **Naming:** Đặt tên biến, hàm, class bằng tiếng Anh chuẩn, rõ nghĩa và tuân thủ PEP 8 (snake_case cho hàm/biến, PascalCase cho Class).

## 5. Error Handling & Logging
*   **API Errors:** Trả về `HTTPException` từ FastAPI với mã lỗi phù hợp (ví dụ: 401 khi sai API Key, 403 khi truy cập tài nguyên của tenant khác, 404 khi không tìm thấy tài liệu).
*   **RAG Logging:** Luôn log các tiến trình quan trọng ở cấp độ `INFO` hoặc `DEBUG` bằng thư viện `logging` của Python:
    *   Log số lượng chunk được sinh ra và thời gian ingest.
    *   Log số lượng context chunks tìm thấy trong Qdrant kèm độ tương đồng (score).
    *   Không log dữ liệu nhạy cảm hoặc PII của khách hàng trong production.

## 6. Testing Standards (Kiểm thử đan xen)
*   **Framework:** Sử dụng `pytest` kết hợp `pytest-asyncio` cho toàn bộ các file test trong thư mục `tests/`.
*   **Unit Tests:** Viết unit test cho các hàm logic độc lập (ví dụ: Text Splitter, Prompt Formatter). Mock các API bên thứ ba (OpenAI/Gemini) và Vector DB để test chạy nhanh mà không cần môi trường ngoài.
*   **Integration Tests:** Viết các bài test tích hợp gọi trực tiếp qua FastAPI `TestClient` / `AsyncClient` để kiểm tra hoạt động của luồng API (đặc biệt là test tính đúng đắn của middleware phân tách tenant).
