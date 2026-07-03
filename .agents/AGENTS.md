# Định hướng chung cho OmniRAG (Global Rules)

1. **Bảo mật Multi-Tenancy (Quan trọng nhất):** Tuyệt đối không được phép sinh code truy vấn Vector Database (Qdrant) hay Relational Database (PostgreSQL) mà thiếu màng lọc (filter) `tenant_id`.
2. **Clean Code:** Đặt tên biến, hàm rõ nghĩa (tiếng Anh). Viết docstring mô tả ngắn gọn cho các class/hàm xử lý logic phức tạp.
3. **Ngôn ngữ:** Trao đổi với người dùng bằng tiếng Việt, nhưng code, tên file và comment trong code phải bằng tiếng Anh.
4. **Async First:** Vì đây là hệ thống Chatbot với nhiều request đồng thời, hãy ưu tiên sử dụng cú pháp `async/await` và các thư viện hỗ trợ bất đồng bộ (asyncpg, httpx, aioqdrant).
