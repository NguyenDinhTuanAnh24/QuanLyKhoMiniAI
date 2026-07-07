# BÁO CÁO TIẾN ĐỘ CÔNG VIỆC
**Dự án:** Hệ thống Smart Retail Inventory AI (Quản lý kho Mini tích hợp AI)
**Ngày thực hiện:** 17/06/2026
**Phần công việc:** Hoàn thiện toàn bộ Module Dashboard (Tổng quan) theo thiết kế Figma.

---

## I. Tổng quan kết quả đạt được
Đã xây dựng thành công trang Dashboard từ Frontend đến Backend. Trang Dashboard không chỉ hiển thị giao diện bám sát bản thiết kế Figma gốc mà còn có khả năng kết nối dữ liệu thật (Real-time data polling), tự động tính toán thống kê và đưa ra các Insight AI cho quản lý. Toàn bộ code đã được đẩy (push) lên nhánh `feat/dashboard-overview` trên GitHub.

## II. Chi tiết các phần đã làm (Backend)

**1. Khởi tạo cấu trúc API Dashboard**
- **File mới tạo:** `dashboardRoutes.js`, `DashboardController.js`, `DashboardService.js`, `DashboardRepository.js`.
- **Cập nhật:** Đã gắn (mount) route `GET /api/dashboard/overview` vào file `server.js` chính.

**2. Xây dựng truy vấn dữ liệu (DashboardRepository.js)**
Đã viết các truy vấn tương tác với cơ sở dữ liệu Supabase:
- **Thống kê tổng quan:** Lọc và tính toán `total_products` (số sản phẩm còn hoạt động), `total_stock` (tổng tồn), `inventory_value` (giá trị kho), `today_orders` và `today_revenue` (doanh thu trong ngày).
- **Phân tích doanh thu 7 ngày:** Nhóm dữ liệu đơn hàng (`orders`) theo từng ngày trong 7 ngày gần nhất để vẽ biểu đồ. *Đã xử lý triệt để lỗi chênh lệch múi giờ (Timezone bug)* đảm bảo dữ liệu "ngày hôm nay" chính xác với giờ Local.
- **Top sản phẩm bán chạy:** Kết hợp `order_items`, `products`, `categories` để xếp hạng các mặt hàng đem lại doanh thu và số lượng bán tốt nhất.
- **Cảnh báo tồn kho:** Lọc các sản phẩm có `stock_quantity <= reorder_level` để báo động cho quản trị viên.
- **Lịch sử hoạt động:** Kết hợp log từ `orders` và `stock_movements` (nhập/xuất) để tạo dòng thời gian (timeline) hoạt động gần nhất.

**3. Xây dựng logic AI Insight (DashboardService.js)**
- Tổng hợp dữ liệu tồn kho để sinh ra thông báo tự động (Ví dụ: *"AI phát hiện 102 sản phẩm có nguy cơ thiếu hàng..."*).
- Gợi ý cụ thể danh sách 3 sản phẩm cần ưu tiên nhập (kèm số lượng cần nhập dựa trên `reorder_quantity`).

## III. Chi tiết các phần đã làm (Frontend)

**1. Kết nối dữ liệu API**
- **File mới tạo:** `frontend/src/services/dashboardService.js`.
- Hàm gọi API được thiết kế kèm theo tính năng bắt lỗi mạng (Error handling).

**2. Giao diện người dùng (DashboardPage.jsx)**
Đã code hoàn thiện trang `DashboardPage.jsx` thay thế hoàn toàn cho trang Placeholder cũ trong `App.jsx`. Giao diện được thiết kế hiện đại, bám sát Figma:
- **Header:** Hiển thị tự động ngày tháng hiện tại.
- **Thẻ thống kê (Summary Cards):** 4 thẻ (Doanh thu, Đơn hàng, Cảnh báo, Giá trị kho) kèm icon màu sắc theo bộ quy chuẩn (Lucide-React) và badge nổi bật.
- **Biểu đồ doanh thu 7 ngày:** Tự code bằng HTML/CSS thuần (Tailwind) dưới dạng cột (Bar Chart), giúp hệ thống nhẹ nhàng, không bị phụ thuộc vào các thư viện bên thứ 3 dễ gây lỗi dependency.
- **Khu vực AI Insights:** Tạo layout màu xanh nhạt làm điểm nhấn, hiển thị phân tích dữ liệu tự động với cấu trúc rõ ràng.
- **Giao dịch gần đây:** Xây dựng bảng (Table) liệt kê các hoạt động kèm thẻ trạng thái (Tag). Thêm tính năng click "Xem tất cả" điều hướng sang trang Đơn bán hàng (`/sales`).
- **Thanh cảnh báo kho & Top bán chạy:** Sử dụng Progress Bar (thanh chạy % màu) để trực quan hóa lượng tồn kho và số lượng đã bán.
- **Thao tác nhanh:** Bổ sung menu lối tắt giúp Admin tạo hóa đơn, nhập kho, thêm sản phẩm bằng 1 click.

**3. Tính năng tự động cập nhật (Silent Polling)**
- Ứng dụng React `useEffect` và `setInterval` để trang Dashboard tự động quét lại dữ liệu mới mỗi **10 giây**.
- **Hiệu quả:** Khi có nhân viên tạo đơn hàng mới, hay kho xuất/nhập, số lượng thẻ thống kê và biểu đồ trên màn hình người quản lý sẽ tự động nảy số mà không cần tải lại (refresh) trang.

## IV. Bug Fixing (Sửa lỗi trong ngày)
- **Lỗi 1 (Timezone):** Dữ liệu đơn hàng buổi sáng bị ghi nhận vào ngày hôm trước do hàm `toISOString()` lấy múi giờ gốc (+0). Đã khắc phục bằng hàm chuyển đổi múi giờ Local.
- **Lỗi 2 (Query Schema):** Xảy ra lỗi 500 do truy vấn thừa cột `status` trong bảng `orders`. Đã gỡ bỏ và làm sạch lại luồng query Database.
- **Lỗi 3 (Git Identity):** Lỗi không commit được trên local do máy tính mất phiên làm việc. Đã setup lại thông tin Git Name/Email và hoàn thành việc push code.

## V. Đánh giá hoàn thành
- Các tiêu chí trong yêu cầu thiết kế và SPDD đều đạt 100%.
- Không thay đổi các thư viện lõi, ứng dụng chạy ổn định và mượt mà.
- Code được tổ chức thành các Services, Repositories chuẩn mô hình MVC/Layered Architecture, rất thuận tiện để mở rộng về sau.
