## Flow đăng ký & sử dụng dịch vụ end-to-end

[1] Sign Up
│ (email/password hoặc OAuth Google/GitHub)
▼
[2] Verify Email
│ (click link xác nhận / OTP)
▼
[3] Onboarding: Tạo Workspace/Organization
│ (tên workspace, mục đích sử dụng)
▼
[4] Chọn Plan
│ ├─ Free Trial (giới hạn: X docs, Y queries/tháng)
│ └─ Paid Plan → [4a] Nhập payment method (Stripe/VNPay...)
▼
[5] Kết nối nguồn dữ liệu (Data Source)
│ ├─ Upload file (PDF/DOCX/TXT/CSV)
│ ├─ Crawl URL/website
│ └─ Connect integration (Notion, Google Drive, Confluence...)
▼
[6] Ingestion Pipeline (bất đồng bộ - background job)
│ Parse → Clean → Chunk → Embedding → Lưu Vector DB
│ (trạng thái: Pending → Processing → Ready/Failed)
▼
[7] Tạo Knowledge Base (KB) sẵn sàng
▼
[8] Sinh API Key / Widget Embed Code
▼
[9] Test trong Playground (chat thử với KB)
▼
[10] Go Live
│ ├─ Gắn widget vào website / gọi API từ app khác
│ └─ Invite thành viên team vào workspace
▼
[11] Sử dụng & Theo dõi (Dashboard) - Usage/quota, chi phí token, logs truy vấn

## Phân tích chi tiết từng bước

### [1-2] Sign up & Verify Email

Business rule: phải verify email trước khi được tạo workspace (chống spam account, đảm bảo liên hệ được để gửi invoice/cảnh báo quota).
Kỹ thuật: token verify nên có TTL (15-30 phút), sinh lại được nhưng invalidate token cũ để tránh replay.

[3] Tạo Workspace/Organization

Đây là ranh giới multi-tenant quan trọng nhất. Mọi dữ liệu (KB, API key, usage) đều phải scope theo workspace_id.
Điểm hay để nói khi interview: cách bạn đảm bảo tenant isolation ở tầng data (row-level filter theo workspace_id, hoặc namespace riêng trong Vector DB).

[4] Chọn Plan

Free trial cần giới hạn cứng: số document tối đa, số query/tháng, để tránh lạm dụng tài nguyên embedding (chi phí thật, không giống app CRUD thông thường).
Nếu chọn Paid: giống flow VNPay bạn đã làm ở e-commerce — nên tách "đăng ký subscription" và "callback xác nhận thanh toán" (webhook là nguồn sự thật, không phải redirect UI).

[5] Kết nối nguồn dữ liệu — bước khác biệt lớn nhất so với SaaS thường

Cần validate: định dạng file, kích thước tối đa, số lượng file theo plan.
Với crawl URL: cần rate-limit, tôn trọng robots.txt, xử lý timeout trang lỗi.
Idempotency: nếu user upload lại file trùng nội dung → nên detect (hash content) để tránh index trùng, tốn tiền embedding vô ích.

[6] Ingestion Pipeline — trái tim nghiệp vụ

Đây nhất định phải là background job/queue (không xử lý sync trong HTTP request), vì:

Parse + chunk + gọi embedding API tốn thời gian (giây đến phút tùy dung lượng).
Cần retry riêng cho từng bước nếu fail (ví dụ embedding API rate limit).

Trạng thái nên expose real-time cho user (qua polling status endpoint hoặc WebSocket/SignalR) — vì đây là điểm UX quan trọng: user cần biết "dữ liệu của tôi đã sẵn sàng chưa".
Đây cũng là chỗ dễ bị hỏi sâu trong interview: chiến lược chunking (size, overlap), chọn embedding model, và cách xử lý file lớn (streaming vs load full).

[7-8] Knowledge Base Ready & API Key

API key nên có scope theo KB/workspace, hỗ trợ revoke, và log usage theo key (để tính billing theo lượng query/token).

[9] Playground

Bước này giúp user tự tin trước khi go-live — về nghiệp vụ, đây cũng là nơi bạn có thể theo dõi "conversion funnel": bao nhiêu user tạo workspace nhưng chưa từng test query (điểm rớt phổ biến trong RAG SaaS thật).

[10-11] Go Live & Dashboard

Invite team: cần phân quyền role (Owner/Admin/Member) trong workspace — tương tự pattern 4 role bạn đã làm ở logistics project.
Dashboard usage: theo dõi token cost là bắt buộc vì đây là mô hình có chi phí biến đổi theo usage (khác hẳn CRUD app thường).
