---
name: ui-development
description: Kích hoạt kỹ năng này khi người dùng yêu cầu thiết kế, xây dựng, hoặc chỉnh sửa Giao diện người dùng (UI), Frontend, hoặc Web views.
---

# UI/UX Design Guidelines

Khi sinh code UI/Frontend, bạn PHẢI tuân thủ các nguyên tắc sau:
1. **Thẩm mỹ (Aesthetics):** Giao diện phải mang phong cách Hiện đại (Modern), Sạch sẽ (Clean), và Thân thiện (Friendly). Tránh thiết kế rườm rà.
2. **Công nghệ:** Bắt buộc sử dụng **React** kết hợp với **TypeScript**.
3. **Responsive:** Mọi giao diện phải hoạt động hoàn hảo trên cả thiết bị di động (mobile-first approach).
4. **Trải nghiệm:** Thêm các hiệu ứng micro-animations (hover, transition) để ứng dụng trông "sống động" và cao cấp (premium).

## UI/UX Details for Devs
- **Spacing:** Use generous padding (e.g., 80px to 120px vertically between sections) to respect the minimalist, clean requirement.
- **Corners:** Apply smooth rounding (border-radius: 8px to 12px) on buttons and cards to preserve the "friendly" aesthetic.
- **Transitions:** Keep hover states subtle—such as a slight lift effect (transform: translateY(-2px)) or a soft opacity change on buttons.

## Design System (Color & Typography)
- **Primary Background:** Pure White (`#FFFFFF`) to ensure a clean, spacious look.
- **Secondary Background:** Ultra-light Mint Green (`#F4FAF7`) for subtle section separation.
- **Primary Accent (Buttons/Brand):** Emerald Green (`#00A86B`) or Forest Green (`#0A5C36`) for high visibility.
- **Text/Typography:** Deep Charcoal (`#1A1A1A`) for headers to maximize readability, and Slate Gray (`#4A4A4A`) for body text.
- **Typography Style:** Clean, modern sans-serif fonts like *Inter* or *Plus Jakarta Sans*.

## Layout System (Boxed vs. Fluid & Full-Width Rules)
Để giải quyết triệt để lỗi giao diện bị co hẹp, lùi sâu tạo khoảng trống thừa hai bên rìa (**Excessive Boxed Layout Constraint**), hãy tuân thủ:
- **Landing/Marketing Pages**: Sử dụng **Boxed Layout** (`max-width: 1180px` hoặc `1280px` căn giữa) để tập trung luồng đọc thông tin của người dùng.
- **Dashboards / Data Apps / Admin Panels**: BẮT BUỘC sử dụng **Fluid / Full-Width Layout**:
  - Đặt phần tử bao ngoài (Wrapper/Main Content) là co giãn hoàn toàn: `width: 100%; max-width: 100%;` hoặc đặt giới hạn rất rộng `max-width: 1600px` đối với màn hình cực lớn.
  - Padding hai bên rìa của phần màn hình chính chỉ nên ở khoảng `16px` đến `32px` (`padding: 0 24px` hoặc `padding: 0 var(--spacing-lg)`).
  - Sử dụng CSS Grid / Flexbox co giãn (`flex-grow: 1`) để các bảng biểu, biểu đồ tự động trải dài sát mép lề an toàn.
  - Luôn đảm bảo thẻ cha ngoài cùng (`body`, `#root`, hoặc layout cha) được reset lề: `margin: 0; padding: 0; box-sizing: border-box;`.
