# SPDD Analysis: Chức năng Thông báo (Notification System)

## Original Business Requirement

Hãy thực hiện bước Phân tích và khảo sát hệ thống (Analysis) để xây dựng chức năng THÔNG BÁO (Notification), xuất ra file báo cáo đặt tên là `GGQPA-NOTI-20260711-[Analysis]-notification.md` và lưu vào đúng thư mục `spdd/analysis/`.

YÊU CẦU NGHIỆP VỤ & KỸ THUẬT CẦN KHẢO SÁT:
1. TIÊU CHÍ BACKEND & DATABASE:
   - Khảo sát DB Supabase hiện tại xem đã có bảng `notifications` chưa. Nếu chưa, đề xuất schema gồm: id, user_id, title, message, type (ORDER_NEW, PAYMENT_SUCCESS, STOCK_LOW, STOCK_IMPORT, STOCK_EXPORT), is_read, related_link, created_at.
   - Phân tích giải pháp kết nối Realtime: Đánh giá phương án dùng Supabase Realtime (Listen insertions trên bảng notifications) so với Polling (gọi API mỗi 30s) về mặt performance và độ phức tạp.
   - Xác định các vị trí trong Backend cần trigger tạo thông báo: Khi tạo đơn hàng mới, cập nhật thanh toán, khi kho chạy hàm check `stock_quantity <= reorder_level`, và khi phát sinh movement Nhập/Xuất kho.

2. TIÊU CHÍ FRONTEND & UI/UX:
   - Khảo sát component Header hiện tại (tìm file có chứa icon chuông báo động ở góc phải màn hình).
   - Thiết kế logic Dropdown thông báo tại icon chuông: Hiển thị badge số lượng chưa đọc (unread count), danh sách thông báo mới nhất.
   - Logic tương tác: Click "Đánh dấu đã đọc" (Update trạng thái `is_read = true` về DB via API) và click vào thông báo sẽ điều hướng `useNavigate` tới trang liên quan (ví dụ: bấm thông báo hết hàng thì nhảy sang `/ai-insights` hoặc `/low-stock`).

---

## Domain Concept Identification

### Existing Concepts (from codebase)
- **Product & Stock Monitoring**: Đối tượng hàng hóa được lưu tại bảng `products` (`database/schema.sql`). Các trường trọng yếu phục vụ cảnh báo gồm `stock_quantity` (tồn kho hiện tại) và `reorder_level` (ngưỡng an toàn tối thiểu). Theo quy tắc nghiệp vụ tại `AGENTS.md` (Quy tắc 9), điều kiện cảnh báo sắp hết hàng được định nghĩa chuẩn là: `stock_quantity <= reorder_level`.
- **Order & Payment Lifecycle**: Quy trình tạo đơn hàng và thanh toán được quản lý tại `backend/src/services/OrderService.js`. Khi tạo đơn (`createOrder`), hệ thống sinh `order_code` và ghi nhận trạng thái `UNPAID` / `PENDING_PAYMENT` / `PAID`. Khi thanh toán thành công qua PayOS (`processSuccessfulPayment`), trạng thái chuyển sang `PAID`.
- **Stock Movements (Nhập / Xuất kho)**: Quá trình biến động tồn kho được xử lý tại hai vị trí chính:
  1. `backend/src/controllers/InventoryController.js -> createMovement`: Xử lý các phiếu `IMPORT` (nhập kho) và `EXPORT` (xuất kho thủ công), cập nhật trực tiếp `stock_quantity` và ghi nhận vào bảng `stock_movements`.
  2. `OrderService.js -> deductStockAndRecordMovements`: Xử lý tự động trừ kho và tạo phiếu `EXPORT` (`type: 'SALE'`) khi phát sinh đơn hàng bán lẻ hoặc thanh toán thành công.
- **Topbar & Header Layout**: Component thanh điều hướng phía trên màn hình nằm tại `frontend/src/components/Topbar.jsx`. Hiện tại icon chuông (`Bell` từ thư viện `lucide-react`, dòng 59-62) đang là một button tĩnh với một chấm đỏ fixed (`span.bg-red-500`) chưa có logic state hay dropdown.
- **Layered Architecture & API Client**: Backend tuân thủ nghiêm ngặt kiến trúc nhiều lớp (`routes -> controllers -> services -> repositories -> Supabase`). Frontend kết nối thông qua Axios instance tập trung tại `frontend/src/services/api.js` với Base URL là `http://localhost:5000/api`.

### New Concepts Required
- **Notification Entity (`notifications` table)**: Thực thể lưu trữ danh sách thông báo hệ thống được sinh ra từ các trigger nghiệp vụ, ánh xạ trực tiếp đến người dùng và các liên kết nghiệp vụ liên quan (`related_link`).
- **Notification Dropdown Menu**: UI Popover/Dropdown mở rộng ngay tại icon chuông trong `Topbar.jsx`, hiển thị danh sách các thông báo mới nhất kèm phân loại màu sắc/icon theo `type`.
- **Unread Badge Counter**: Số lượng thông báo chưa đọc (`unreadCount`), hiển thị động trên icon chuông (ví dụ: `1`, `5`, `9+`), ẩn đi khi `unreadCount === 0`.
- **Notification Service Layer (Backend & Frontend)**:
  - Backend: `NotificationService.js`, `NotificationController.js`, `notificationRepository.js`, và `notificationRoutes.js`.
  - Frontend: `frontend/src/services/notificationService.js` (giao tiếp API) và có thể mở rộng qua `NotificationContext.jsx` hoặc custom hook `useNotifications()` để chia sẻ state giữa Topbar và các trang khác.

### Key Business Rules
- **Quy tắc tạo thông báo tự động (Event-driven Triggering Rules)**:
  1. `ORDER_NEW`: Trigger khi một đơn bán hàng mới được tạo thành công trong `OrderService.createOrder()`.
  2. `PAYMENT_SUCCESS`: Trigger khi webhook PayOS hoặc giao dịch xác nhận thanh toán thành công trong `OrderService.processSuccessfulPayment()`.
  3. `STOCK_IMPORT`: Trigger khi phiếu nhập kho (`type === 'IMPORT'`) được tạo thành công tại `InventoryController.createMovement()`.
  4. `STOCK_EXPORT`: Trigger khi phiếu xuất kho (`type === 'EXPORT'` hoặc `SALE`) được thực thi tại `InventoryController.createMovement()` hoặc `OrderService.deductStockAndRecordMovements()`.
  5. `STOCK_LOW`: Trigger ngay sau mỗi lần cập nhật giảm `stock_quantity` (do bán hàng hoặc xuất kho) nếu thỏa mãn `new_quantity <= reorder_level`. Để tránh spam thông báo liên tục cho cùng một sản phẩm mỗi khi bán thêm 1 cái, cần áp dụng logic chống trùng lặp (Cooldown/Deduping: ví dụ không tạo thêm thông báo `STOCK_LOW` mới cho cùng `product_id` nếu đã có thông báo chưa đọc trong vòng 24 giờ qua).
- **Quy tắc trạng thái đọc (Read Status Lifecycle)**:
  - Mặc định khi tạo mới, thông báo có trạng thái `is_read = false`.
  - Người dùng có thể đánh dấu đã đọc từng thông báo (`PUT /api/notifications/:id/read`) hoặc đánh dấu tất cả đã đọc (`PUT /api/notifications/read-all`).
- **Quy tắc phân quyền (User Mapping Rule)**:
  - Thông báo có thể gắn với một `user_id` cụ thể hoặc gán giá trị `user_id = 'ALL'` / `'ADMIN'` để toàn bộ nhân viên quản lý kho/admin đều nhìn thấy các cảnh báo trọng yếu (như đơn hàng mới, hết kho).

---

## Strategic Approach

### Solution Direction
1. **Database Schema Setup (`database/schema.sql` & Supabase Migration)**:
   - Bổ sung bảng `notifications` với đầy đủ chỉ mục (`INDEX`) trên `user_id`, `is_read`, và `created_at` để đảm bảo tốc độ truy vấn danh sách thông báo cực nhanh.
2. **Backend API & Service Integration**:
   - Xây dựng module API `GET /api/notifications` (lấy danh sách thông báo mới nhất + số lượng chưa đọc), `PUT /api/notifications/:id/read`, và `PUT /api/notifications/read-all`.
   - Cấy ghép (Inject) lời gọi `NotificationService.createNotification(...)` vào đúng 4 vị trí trọng yếu đã khảo sát trong `OrderService.js` và `InventoryController.js`.
3. **Frontend UI Dropdown & Interactive Navigation (`Topbar.jsx`)**:
   - Nâng cấp `Topbar.jsx`: Thêm state quản lý `isOpen`, `notifications`, `unreadCount`, `loading`.
   - Khi bấm vào icon chuông, mở Dropdown hiển thị danh sách thông báo phân theo icon/màu sắc (`ORDER_NEW`: màu xanh dương, `PAYMENT_SUCCESS`: màu xanh lá, `STOCK_LOW`: màu đỏ/charmed, `STOCK_IMPORT`/`STOCK_EXPORT`: màu cam/tím).
   - Tích hợp `useNavigate()`: Khi click vào một item thông báo, gọi API cập nhật `is_read = true`, đồng thời điều hướng tới `related_link` (ví dụ: `/alerts`, `/ai`, `/sales`, `/inventory-ops`).

### Key Design Decisions

#### 1. Đánh giá giải pháp kết nối Realtime vs Polling
| Tiêu chí | Phương án A: Supabase Realtime (Listen Insertions) | Phương án B: Polling (Gọi API mỗi 30s via Axios) | Phương án C: Server-Sent Events (SSE) qua Express |
|---|---|---|---|
| **Cơ chế hoạt động** | Frontend kết nối trực tiếp WebSocket tới Supabase (`postgres_changes` trên bảng `notifications`). | Frontend dùng `setInterval` gọi `GET /api/notifications` mỗi 30 giây. | Frontend mở connection `EventSource` tới `GET /api/notifications/stream` trên Express; Backend lắng nghe Supabase Realtime và push qua SSE. |
| **Độ trễ (Latency)** | Cực thấp (< 100ms). | Tối đa 30 giây (hoặc ngay lập tức khi user chuyển trang/tương tác). | Cực thấp (< 200ms). |
| **Độ phức tạp kỹ thuật** | **Cao**. Kiến trúc hiện tại Frontend chỉ kết nối tới Express (`http://localhost:5000/api`) và không cài đặt Supabase SDK (`axios` only). Nếu dùng, phải cài `@supabase/supabase-js` lên Frontend, quản lý Auth Token/RLS của Supabase song song với Express JWT auth. | **Rất thấp**. Tận dụng 100% kiến trúc Axios API client (`api.js`) và tầng Service/Controller hiện có của Express. Không cần thay đổi config mạng hay thư viện. | **Trung bình**. Giữ được mô hình Frontend -> Express, nhưng cần xử lý kết nối nối dài (keep-alive connections) và quản lý bộ nhớ trên Node.js. |
| **Tải hệ thống & Tài nguyên** | Tiết kiệm HTTP request khi idle, nhưng giữ kết nối WebSocket liên tục. | Tốn khoảng 2 request/phút/client. Với quy mô cửa hàng bán lẻ mini (1-5 nhân viên), tải trên Server/DB là hoàn toàn không đáng kể (< 0.1% CPU). | Tiết kiệm request, nhưng chiếm giữ kết nối HTTP mở trên server Express. |
| **Độ tin cậy & Khả năng bảo trì** | Phụ thuộc vào cấu hình Replication trên Supabase và RLS policies. Khó debug khi mất kết nối mạng. | Rất cao, dễ debug trong Network tab của Chrome DevTools, tự động phục hồi khi mạng gián đoạn. | Phụ thuộc vào độ ổn định của SSE stream giữa Node.js và Supabase. |

- **👉 Khuyến nghị chiến lược (Recommendation)**: **Áp dụng Phương án B (Polling 30s + Event-driven Refresh) làm giải pháp nền tảng chính thức**. 
  - *Lý do*: Đảm bảo sự nhất quán tuyệt đối với kiến trúc `Frontend <-> Express API <-> Supabase` của dự án (`AGENTS.md` Quy tắc Frontend 2 & Backend 1). Việc thêm `@supabase/supabase-js` vào Frontend chỉ để nghe thông báo sẽ làm phá vỡ ranh giới encapsulation của Backend (đang giấu `SUPABASE_SERVICE_ROLE_KEY` và truy vấn DB). Polling 30s kết hợp với việc tự động re-fetch danh sách thông báo mỗi khi người dùng thực hiện một hành động (như tạo đơn, nhập kho, chuyển trang) đảm bảo trải nghiệm gần như "thời gian thực" (Near-Realtime) mà không mang lại bất kỳ sự phức tạp nào về hạ tầng WebSocket.

#### 2. Cơ chế chống trùng lặp cảnh báo tồn kho (`STOCK_LOW` Deduplication)
- **Vấn đề**: Nếu một sản phẩm có `reorder_level = 10` và `stock_quantity = 8`, mỗi lần bán 1 sản phẩm (tồn kho giảm xuống 7, 6, 5...), hàm kiểm tra `stock_quantity <= reorder_level` lại chạy và sinh ra 1 thông báo mới. Điều này làm tràn ngập hòm thư thông báo của admin.
- **👉 Khuyến nghị giải pháp**: Trong `NotificationService.createNotification()`, khi `type === 'STOCK_LOW'`, trước khi `insert` vào DB, thực hiện kiểm tra nhanh: *Chiếc `product_id` này đã có thông báo `STOCK_LOW` nào với trạng thái `is_read = false` trong vòng 24 giờ qua chưa?* Nếu đã có, bỏ qua tạo mới (hoặc chỉ cập nhật nội dung/thời gian). Logic này đảm bảo hệ thống thông minh, tinh gọn và không gây phiền toái.

### Alternatives Considered
- **Sử dụng Supabase Database Triggers (PL/pgSQL) để tự động sinh notifications**:
  - *Lý do loại bỏ*: Mặc dù có thể viết Trigger trên bảng `products`, `orders`, `stock_movements` dưới DB để tự động `INSERT INTO notifications`, nhưng việc đặt logic nghiệp vụ dưới DB Triggers làm phân mảnh codebase (một phần logic ở Node.js `OrderService.js`, một phần ở PostgreSQL trigger), gây khó khăn cực lớn cho việc debug, testing, và bảo trì sau này (`AGENTS.md` khuyến nghị giữ logic trong các `services`). Do đó, tạo notification trực tiếp từ tầng Application Service (`Node.js Express`) là phương án tối ưu.

---

## Risk & Gap Analysis

### Requirement Ambiguities
- **Định danh `user_id` cho Thông báo**: Hệ thống hiện có bảng `app_users` nhưng trong các thao tác kho và bán hàng (ví dụ `OrderService`), đơn hàng có thể được tạo bởi `Nhân viên bán hàng` hoặc Admin. Cần làm rõ thông báo được gửi cho ai:
  - *Phân tích & Hướng giải quyết*: Vì đây là hệ thống quản lý kho mini dành cho cửa hàng bán lẻ (`Smart Retail Inventory AI`), các cảnh báo như `STOCK_LOW`, `ORDER_NEW`, `STOCK_IMPORT` là thông tin vận hành chung mà tất cả các tài khoản quản trị (Admin / Warehouse Manager) đều cần nắm rõ. Do đó, trường `user_id` trong bảng `notifications` sẽ được thiết kế hỗ trợ giá trị `'ALL'` (dành cho toàn bộ hệ thống) hoặc mã user cụ thể, đảm bảo mọi nhân viên đăng nhập đều nhìn thấy các cảnh báo quan trọng này.

### Edge Cases
- **Xóa sản phẩm hoặc đơn hàng (`Soft Delete / Rollback`)**: Nếu một đơn hàng vừa tạo xong (`ORDER_NEW`) nhưng sau đó bị lỗi thanh toán và rollback (`deleteOrder`), hoặc một sản phẩm bị soft delete (`deleted_at NOT NULL`), thông báo liên quan có thể trỏ tới một link không tồn tại.
  - *Mitigation*: Khi người dùng click vào thông báo và điều hướng tới trang liên quan (`/sales` hoặc `/alerts`), trang đích cần có khả năng xử lý graceful (ví dụ hiển thị thông báo "Đơn hàng hoặc sản phẩm không còn tồn tại") thay vì crash UI.
- **Số lượng thông báo tăng lên hàng vạn dòng theo thời gian**: Bảng `notifications` sẽ phình to rất nhanh sau nhiều tháng hoạt động.
  - *Mitigation*: Khi truy vấn danh sách thông báo cho Dropdown `Topbar`, luôn giới hạn `LIMIT 20` hoặc `LIMIT 50` và sắp xếp `ORDER BY created_at DESC`. Đồng thời có thể bổ sung một hàm dọn dẹp định kỳ (hoặc soft archive) các thông báo đã đọc quá 30 ngày.

### Technical Risks
- **Đồng bộ hóa trạng thái đếm số lượng chưa đọc (`unreadCount`) trên UI**: Khi người dùng mở Dropdown ở `Topbar` và bấm "Đánh dấu đã đọc" hoặc bấm vào một thông báo, nếu không cập nhật state local ngay lập tức mà đợi gọi API xong mới tải lại thì UI sẽ bị giật lag (delay 200-500ms).
  - *Mitigation*: Áp dụng mô hình **Optimistic UI Update** (Cập nhật giao diện lạc quan): Ngay khi user click bấm đọc, giảm `unreadCount` xuống 1 và set `is_read = true` trên UI state lập tức, song song đó gửi request `PUT /api/notifications/:id/read` dưới background.

### Acceptance Criteria Coverage

| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Khảo sát DB Supabase & Đề xuất schema bảng `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_link`, `created_at`) | Yes | Đã kiểm tra `schema.sql` xác nhận chưa có bảng; đề xuất schema DDL đầy đủ với các loại enum chuẩn xác. |
| 2 | Phân tích giải pháp kết nối Realtime: Supabase Realtime vs Polling 30s | Yes | Đã phân tích chi tiết về hiệu năng, độ trễ và độ phức tạp. Khuyến nghị Polling 30s để giữ nguyên kiến trúc Axios-Express hiện tại. |
| 3 | Xác định các vị trí trong Backend cần trigger tạo thông báo (`ORDER_NEW`, `PAYMENT_SUCCESS`, `STOCK_LOW`, `STOCK_IMPORT`, `STOCK_EXPORT`) | Yes | Đã định vị chính xác file/hàm: `OrderService.createOrder`, `OrderService.processSuccessfulPayment`, `OrderService.deductStockAndRecordMovements`, và `InventoryController.createMovement`. |
| 4 | Khảo sát Header component (`Topbar.jsx` với icon chuông `Bell`) | Yes | Đã phân tích cấu trúc hiện tại của `Topbar.jsx` (dòng 59-62) và xác định cách mở rộng thành Popover Dropdown. |
| 5 | Thiết kế logic Dropdown thông báo: hiển thị badge unread count, danh sách thông báo mới nhất | Yes | Đã thiết kế UI/UX cụ thể cho badge đỏ động và danh sách phân loại theo icon/màu sắc. |
| 6 | Logic tương tác: Click "Đánh dấu đã đọc" (API update `is_read = true`) & click điều hướng `useNavigate` tới `related_link` | Yes | Đã thiết kế trọn vẹn luồng tương tác Optimistic Update + `useNavigate()` chính xác đến các route `/alerts`, `/sales`, `/inventory-ops`. |

---

## Codebase Context Summary (Grounding Reference)

### 1. Proposed SQL Schema (`database/schema.sql`)
```sql
CREATE TABLE public.notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) DEFAULT 'ALL',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ORDER_NEW', 'PAYMENT_SUCCESS', 'STOCK_LOW', 'STOCK_IMPORT', 'STOCK_EXPORT')),
    is_read BOOLEAN DEFAULT FALSE,
    related_link VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
```

### 2. Backend Trigger Locations Details
- **`OrderService.js` (`createOrder`)**:
  ```javascript
  // Sau khi insertOrder thành công -> Tạo thông báo ORDER_NEW
  await notificationService.createNotification({
    title: `Đơn hàng mới ${order_code}`,
    message: `Khách hàng ${data.customer_name || 'Khách lẻ'} vừa đặt đơn hàng trị giá ${data.total_amount?.toLocaleString('vi-VN')}đ`,
    type: 'ORDER_NEW',
    related_link: '/sales'
  });
  ```
- **`OrderService.js` (`processSuccessfulPayment`)**:
  ```javascript
  // Sau khi cập nhật payment_status = 'PAID' -> Tạo thông báo PAYMENT_SUCCESS
  await notificationService.createNotification({
    title: `Thanh toán thành công ${order.order_code}`,
    message: `Đơn hàng ${order.order_code} đã được thanh toán qua PayOS`,
    type: 'PAYMENT_SUCCESS',
    related_link: '/sales'
  });
  ```
- **`InventoryController.js` (`createMovement`) & `OrderService.js` (`deductStockAndRecordMovements`)**:
  ```javascript
  // Khi tạo movement IMPORT hoặc EXPORT -> Tạo thông báo tương ứng
  await notificationService.createNotification({
    title: type === 'IMPORT' ? 'Nhập kho hàng hóa' : 'Xuất kho hàng hóa',
    message: `Đã ${type === 'IMPORT' ? 'nhập' : 'xuất'} ${item.quantity} sản phẩm (${item.product_id})`,
    type: type === 'IMPORT' ? 'STOCK_IMPORT' : 'STOCK_EXPORT',
    related_link: '/inventory-ops'
  });

  // Kiểm tra cảnh báo STOCK_LOW ngay sau khi cập nhật stock_quantity
  if (newStock <= p.reorder_level) {
    await notificationService.checkAndCreateLowStockAlert(item.product_id, p.product_name, newStock, p.reorder_level);
  }
  ```

### 3. Frontend `Topbar.jsx` Routing & Action Mapping
- **Badge Indicator**:
  ```jsx
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white font-bold text-[10px] flex items-center justify-center rounded-full border border-white">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )}
  ```
- **`useNavigate` Route Mapping Table**:
  | `type` | `related_link` | Trang điều hướng đích |
  |---|---|---|
  | `ORDER_NEW` | `/sales` | Đơn bán hàng |
  | `PAYMENT_SUCCESS` | `/sales` | Đơn bán hàng |
  | `STOCK_LOW` | `/alerts` | Cảnh báo tồn kho |
  | `STOCK_IMPORT` | `/inventory-ops` | Nhập / Xuất kho |
  | `STOCK_EXPORT` | `/inventory-ops` | Nhập / Xuất kho |
