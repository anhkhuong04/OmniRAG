### Dưới đây là quy trình End-to-End (E2E) chi tiết mô tả vòng đời của một khách hàng (Tenant Owner) từ lúc biết đến sản phẩm cho tới khi triển khai thành công AI Chatbot (Widget) lên website của họ, dựa trên toàn bộ các Business Flow chúng ta đã xây dựng:

## Giai đoạn 1: Onboarding (Đăng ký & Xác thực)

- Đăng ký (Register): Người dùng truy cập trang Landing Page của OmniRAG, chọn Sign Up, nhập Email, Mật khẩu và Tên.
- Xác thực Email (Verify): Hệ thống đánh dấu tài khoản là is\*verified = False và sinh ra một Token gửi vào Email của người dùng. Người dùng click vào link trong Email để kích hoạt tài khoản (is_verified = True).
- Đăng nhập (Login): Người dùng đăng nhập bằng Email/Password. Hệ thống trả về access_token (JWT) để bắt đầu phiên làm việc an toàn.

## Giai đoạn 2: Khởi tạo Không gian làm việc (Workspace)

- Tạo Workspace: Do tài khoản mới chưa thuộc tổ chức nào, hệ thống chuyển hướng người dùng đến trang Create Workspace. Người dùng nhập tên công ty (VD: "TechCorp RAG").
- Cấp phát Tài nguyên (Provisioning):
  - Hệ thống tạo ra bản ghi Tenant.
  - Gắn User hiện tại làm Owner của Tenant đó.
  - Tự động gắn (Seed) gói cước mặc định FREE plan (với các giới hạn như: tối đa 50 documents, 1000 queries/tháng, 10MB storage) cho Workspace này dưới dạng một Subscription.

## Giai đoạn 3: Huấn luyện Kiến thức (Knowledge Ingestion)

- Vào Dashboard: Người dùng được chuyển vào Tenant Dashboard (bảng điều khiển chính).
- Tải tài liệu (Upload Documents): Người dùng chuyển sang tab Documents và upload các tài liệu (nội quy công ty, FAQ, hướng dẫn sử dụng).
- Xử lý nền (Background Ingestion):
  - Plan Guard kiểm tra xem file upload có vượt quá dung lượng (Storage Limit) hay số lượng file (Max Documents) của gói FREE không.
  - Nếu hợp lệ, hệ thống sẽ băm nhỏ (chunking) file, gọi API OpenAI (text-embedding-3-small) để tạo vector.
  - Lưu metadata vào PostgreSQL, lưu vector vào Qdrant (phân mảnh cách ly bằng tenant_id).
  - Hệ thống tính toán chi phí (Prompt Tokens) và ghi vào bảng UsageLog để phục vụ thanh toán.

## Giai đoạn 4: Tạo khóa kết nối (API Key Generation)

- Cấp phát Key: Người dùng chuyển sang tab API Keys và tạo một khóa mới (VD: "Key cho Website chính").
- Lưu trữ: Hệ thống hiển thị chuỗi API Key thô (bắt đầu bằng omnirag\*...) chỉ một lần duy nhất. Backend chỉ lưu trữ bản mã hoá (SHA-256 Hash) của Key này để chống rò rỉ.

## Giai đoạn 5: Tích hợp và Trải nghiệm (Integration & Chat)

- Chat Playground: Người dùng điền API Key vừa tạo vào ô ở góc phải trên cùng Dashboard và chuyển sang tab Chat Playground để hỏi thử xem AI có trả lời đúng dựa trên tài liệu vừa upload không.
- Tích hợp Widget (Embed): Người dùng chuyển qua tab Widget Integration, copy đoạn mã <script> hoặc thẻ <iframe> (đã được cấu hình tự động chứa API Key ẩn) và dán vào mã nguồn website (HTML/React) của công ty họ.
- Người dùng cuối (End-User) chat:
  - Khách truy cập website của TechCorp nhắn tin. Widget gọi API /chat/query về OmniRAG kèm theo API Key.
  - OmniRAG xác thực API Key, kiểm tra giới hạn (Queries Limit) của tháng hiện tại.
  - Tìm kiếm Vector (RAG) để lấy ngữ cảnh từ tài liệu của TechCorp.
  - Gọi LLM (OpenAI GPT-4o-mini) tạo câu trả lời và stream chữ về lại cho khách hàng ngay lập tức.
  - Ghi nhận completion_tokens và tổng query vào UsageLog.

## Giai đoạn 6: Giám sát và Nâng cấp (Monitoring & Scaling)

- Theo dõi chi phí: Vào cuối ngày, Owner vào lại tab Overview của Dashboard. Họ xem biểu đồ Usage History để biết hôm nay hệ thống tốn bao nhiêu token, tốn bao nhiêu USD và bao nhiêu query đã được dùng.
- Quản trị (Admin System - Tác động từ bạn): Nếu TechCorp spam hệ thống, bạn (dưới tư cách System Admin) có thể vào /system-admin, tìm TechCorp và ấn Disable. Ngay lập tức Widget chat trên website của TechCorp sẽ báo lỗi và ngừng phản hồi.
