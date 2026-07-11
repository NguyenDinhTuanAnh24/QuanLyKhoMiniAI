# SPDD Analysis: Bảo vệ API và Phân quyền Backend

## Original Business Requirement
Bối cảnh:
- Hệ thống Smart Retail Inventory AI đã có các module Dashboard, Products, Inventory Ops, Sales, Alerts, Reports, AI Insights, Users và Settings.
- Trang đăng nhập đã được triển khai.
- Cần bảo vệ API backend để không thể gọi API trái phép bằng Postman hoặc gọi trực tiếp ngoài frontend.
- Không được chỉ ẩn menu hoặc button ở frontend.
- Hệ thống có các vai trò:
  1. Quản trị viên
  2. Chủ cửa hàng
  3. Nhân viên kho
  4. Nhân viên bán hàng

Mục tiêu:
Phân tích và thiết kế hệ thống middleware xác thực token và phân quyền API theo vai trò, sau đó áp dụng nhất quán cho toàn bộ route backend.

Yêu cầu phân tích:
1. Xác định cơ chế đăng nhập/token hiện tại
2. Xác định bảng người dùng hiện tại
3. Xác định tên role/status thực tế đang lưu trong DB.
4. Liệt kê toàn bộ route backend hiện có và phân nhóm
5. Thiết kế middleware
6. Thiết kế response lỗi chuẩn
7. Thiết kế permission matrix cho từng module.
8. Không tin role do frontend gửi lên.
9. Đề xuất cách xử lý các trường hợp lỗi (token hết hạn, user khóa, v.v...)
10. Đảm bảo các API public cần thiết vẫn truy cập được
11. Không làm hỏng webhook PayOS
12. Phân tích ảnh hưởng tới frontend Axios interceptor

## Domain Concept Identification

### Existing Concepts (from codebase)
- **Authentication**: Hiện đang dùng JWT stateless, được cấp phát qua `POST /api/auth/login`. Token chứa `user_id`, `email`, `role`, `full_name`.
- **App Users**: Bảng `app_users` lưu thông tin người dùng với các trường `user_id`, `email`, `role`, `status`, `deleted_at`.
- **Roles**: Các vai trò hiện tại (từ schema và yêu cầu): `Quản trị viên`, `Chủ cửa hàng`, `Nhân viên kho`, `Nhân viên bán hàng`.
- **Status**: Trạng thái `Đang hoạt động`, `Khóa`, v.v...
- **API Routes**: Các domain chia theo routes: `products`, `categories`, `units`, `suppliers`, `orders`, `payments` (bao gồm PayOS webhook), `inventory` (stock movements), `ai`, `dashboard`, `reports`, `users`, `settings`.

### New Concepts Required
- **Authorization Context**: Một middleware layer có nhiệm vụ diễn giải role từ JWT, truy xuất thông tin DB theo thời gian thực (nếu cần kiểm tra user bị xóa mềm/khóa), và ánh xạ tới quyền truy cập endpoint.
- **Permission Matrix**: Ma trận quy định vai trò nào được thực hiện thao tác (GET, POST, PUT, DELETE) trên route nào.
- **Webhook Signature Verifier**: Middleware riêng biệt xác minh webhook từ bên thứ 3 (PayOS), không sử dụng luồng JWT người dùng.

### Key Business Rules
- Chỉ có token JWT hợp lệ mới truy cập được các API nội bộ.
- Dữ liệu Role phải luôn lấy từ Token (được verify qua JWT_SECRET), hoặc tốt nhất là từ `app_users` table để đảm bảo real-time. Do cấu trúc stateless JWT hiện tại, token có chứa `role` nên ta có thể dùng `role` từ token kết hợp query DB để chặn ngay nếu user bị khoá/xoá.
- API công khai không qua middleware JWT: `/api/auth/login`, webhook từ PayOS (trong `paymentRoutes`).

## Strategic Approach

### Solution Direction
Xây dựng một hệ thống bảo vệ đa lớp (Layered Security):
1. **Lớp Xác thực (Authentication Layer)**: Cải tiến `authMiddleware` hiện tại (`backend/src/middleware/authMiddleware.js`) để kiểm tra thêm tính hợp lệ của User trong CSDL (chống trường hợp token còn hạn nhưng user đã bị xóa hoặc khóa ở backend).
2. **Lớp Phân quyền (Authorization Layer)**: Xây dựng `authorizeRoles(...roles)` middleware để chặn các request gọi vào resource không thuộc quyền quản lý.
3. **Áp dụng Nhất quán (Consistent Application)**: Cấu hình middleware ở cấp độ Router (trong từng `xxxRoutes.js`) thay vì cấu hình từng route một để giảm thiểu sai sót. Webhook sẽ được tách ra khỏi router middleware JWT.

### Key Design Decisions
- **Middleware JWT kèm DB Check**: 
  - *Trade-offs*: Tốn 1 query DB cho mỗi request. Bù lại: Loại bỏ được hoàn toàn rủi ro token còn hạn 7 ngày nhưng user đã nghỉ việc hoặc bị khóa tài khoản. Đạt độ bảo mật cao nhất cho hệ thống enterprise.
  - *Recommendation*: Cải tiến `authMiddleware` để vừa verify JWT, vừa query `UserRepository.findById` để chắc chắn user chưa bị soft-delete (`deleted_at IS NULL`) và `status === 'Đang hoạt động'`. Sau đó attach đối tượng user thật vào `req.user`.
- **PayOS Webhook Exception**: 
  - *Recommendation*: Route webhook (VD: `/api/payments/payos-webhook`) phải nằm ngoài tầm ảnh hưởng của `authMiddleware`, được bảo vệ bằng middleware verify chữ ký của PayOS.
- **Frontend Axios Interceptor**: 
  - *Recommendation*: Interceptor hiện tại đang bắt lỗi 401 để force logout. Việc trả về `401` khi token hết hạn/user bị khóa từ backend là hoàn toàn tương thích và frontend không cần sửa gì nhiều, chỉ cần hiển thị Toast hoặc redirect. Các lỗi `403` do thiếu quyền sẽ được hiển thị Toast báo lỗi.

### Permission Matrix Đề xuất
- **Quản trị viên (Admin)** & **Chủ cửa hàng (Owner)**: Toàn quyền truy cập tất cả API (Full Access).
- **Nhân viên kho (Warehouse)**: 
  - Quyền truy cập đầy đủ (GET, POST, PUT, DELETE): `products`, `categories`, `units`, `suppliers`, `inventory` (Stock Movements).
  - Quyền đọc (GET): `dashboard` (chỉ số tồn kho), `reports` (báo cáo kho).
  - Cấm (Deny): `orders` (tùy thuộc luồng kinh doanh, có thể cấm hoặc chỉ cho phép xuất hàng), `ai`, `users`, `settings`.
- **Nhân viên bán hàng (Sales)**:
  - Quyền truy cập đầy đủ (GET, POST, PUT): `orders`, `payments`.
  - Quyền đọc (GET): `products`, `categories`, `dashboard` (doanh thu cá nhân).
  - Cấm (Deny): `users`, `settings`, `ai`, cập nhật kho (chỉ hệ thống tự trừ kho khi tạo order).

### Alternatives Considered
- *Sử dụng JWT thuần túy (không check DB)*: Bị từ chối vì không đáp ứng được yêu cầu "Xử lý tài khoản bị khóa/xóa mềm". Token sống 7 ngày là quá lâu nếu user bị khóa đột xuất.

## Risk & Gap Analysis

### Requirement Ambiguities
- Yêu cầu cho "Nhân viên bán hàng" có được quyền tạo Khách hàng/Sản phẩm không? Theo chuẩn: Không được tạo Sản phẩm (chỉ đọc), nhưng được tạo Đơn bán hàng.
- Yêu cầu cho "Nhân viên kho" với module `orders` (Nhập/Xuất): Nhân viên kho có được xóa đơn hàng không? Theo chuẩn: Thường chỉ Quản trị viên mới được xóa đơn.

### Edge Cases
- **Token Format Error**: Request mang `Authorization: Bearer null` hoặc token bị hỏng.
- **Webhook PayOS**: Webhook gọi đến báo lỗi `401` nếu middleware cấu hình nhầm lên toàn bộ `app.use('/api', authMiddleware)`. 
  - *Mitigation*: Cần áp dụng middleware bên trong từng file route, hoặc trước các route cụ thể trong `server.js`, chừa lại đường dẫn public.

### Technical Risks
- Nếu có quá nhiều request liên tục, việc query DB ở mỗi request (trong `authMiddleware`) có thể gây tốn connection Supabase. Tuy nhiên, quy mô hệ thống Mini Retail là hoàn toàn có thể chấp nhận được.
- Interceptor Frontend bắt 403: Cần đảm bảo frontend không tự động chuyển hướng về `/login` nếu gặp `403` (không đủ quyền), mà chỉ nên thông báo lỗi "Không đủ quyền truy cập". (Interceptor hiện tại chỉ bắt 401, nên an toàn).

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Xác định cơ chế hiện tại | Yes | Đã xác định: JWT & app_users |
| 2 | Liệt kê toàn bộ route backend | Yes | Sẽ áp dụng role trên từng Router layer |
| 3 | Thiết kế middleware chuẩn | Yes | Sẽ tạo `authenticate` (kèm check DB) và `authorizeRoles` |
| 4 | Xử lý token hết hạn, user bị khóa | Yes | Được handle ngay trong `authMiddleware` |
| 5 | Public APIs & PayOS Webhook | Yes | Tách riêng cấu hình middleware |
| 6 | Trả về 401/403/423 không lộ stack trace | Yes | Sẽ ném error qua GlobalExceptionHandler |
