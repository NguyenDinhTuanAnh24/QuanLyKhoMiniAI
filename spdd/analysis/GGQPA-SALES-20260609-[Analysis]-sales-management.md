# Phân tích Nghiệp vụ - Quản lý Bán hàng (Sales Management)

## 1. Tổng quan
Tính năng Bán hàng (POS) cho phép nhân viên cửa hàng tạo hóa đơn thanh toán cho khách hàng, tự động trừ tồn kho và ghi nhận lịch sử xuất kho một cách chính xác.

## 2. Cấu trúc Thực thể (Entities & Attributes)

### 2.1. Thực thể `orders` (Hóa đơn / Đơn hàng)
Lưu trữ thông tin tổng quát của một lần thanh toán.
- `order_id` (UUID/Int, PK): Định danh duy nhất.
- `order_code` (Varchar): Mã hóa đơn hiển thị trên UI (VD: `HD-2024-0089`).
- `customer_name` (Varchar, Nullable): Tên khách hàng (VD: Khách lẻ).
- `customer_phone` (Varchar, Nullable): Số điện thoại khách hàng.
- `payment_method` (Varchar/Enum): Phương thức thanh toán (`CASH`, `BANK_TRANSFER`, `CARD`).
- `subtotal` (Decimal/Numeric): Tổng tiền trước giảm giá.
- `discount_amount` (Decimal/Numeric): Số tiền giảm giá.
- `total_amount` (Decimal/Numeric): Tổng thanh toán cuối cùng.
- `status` (Varchar/Enum): Trạng thái hóa đơn (`COMPLETED`, `CANCELLED`).
- `user_id` (UUID, FK): ID của người tạo hóa đơn.
- `created_at` (Timestamp): Ngày giờ tạo.

### 2.2. Thực thể `order_items` (Chi tiết hóa đơn)
Lưu trữ thông tin chi tiết từng mặt hàng trong hóa đơn.
- `order_item_id` (UUID/Int, PK)
- `order_id` (UUID/Int, FK): Trỏ tới bảng `orders`.
- `product_id` (UUID/Int, FK): Trỏ tới bảng `products`.
- `quantity` (Int): Số lượng bán.
- `unit_price` (Decimal/Numeric): Đơn giá bán tại thời điểm tạo hóa đơn (Snapshot giá).
- `total_price` (Decimal/Numeric): Thành tiền (`quantity * unit_price`).

### 2.3. Thực thể `products` (Sản phẩm - Tham chiếu)
Sử dụng dữ liệu sản phẩm để chọn và cập nhật số lượng tồn kho.
- `product_id` (UUID/Int, PK)
- `product_name` (Varchar): Tên sản phẩm.
- `sku` (Varchar): Mã SKU.
- `selling_price` (Decimal/Numeric): Giá bán.
- `stock_quantity` (Int): Số lượng tồn kho hiện hành.

### 2.4. Thực thể `stock_movements` (Lịch sử luân chuyển kho)
Ghi nhận các giao dịch xuất/nhập làm thay đổi số lượng tồn kho.
- `movement_id` (UUID/Int, PK)
- `product_id` (UUID/Int, FK): Trỏ tới bảng `products`.
- `movement_type` (Varchar/Enum): Loại luân chuyển (`IN` - nhập, `OUT` - xuất).
- `quantity` (Int): Số lượng thay đổi.
- `reference_id` (UUID/Int, Nullable): ID của hóa đơn hoặc phiếu nhập liên quan (`order_id`).
- `notes` (Varchar): Ghi chú (VD: "Xuất kho bán hàng HD-2024-0089").
- `created_at` (Timestamp): Thời gian giao dịch.

## 3. Quy trình Giao dịch (Transaction Flow) khi "Xác nhận Bán hàng"

Khi người dùng nhấn nút **Xác nhận bán hàng**, hệ thống (Backend) cần thực hiện một **Database Transaction** (Giao dịch nguyên tử) để đảm bảo tính toàn vẹn dữ liệu. Quy trình cụ thể như sau:

1. **Khởi tạo Transaction:** Bắt đầu phiên giao dịch trên cơ sở dữ liệu.
2. **Kiểm tra tồn kho:** Truy vấn bảng `products` để kiểm tra xem `stock_quantity` của các mặt hàng trong giỏ có đủ hay không (`stock_quantity >= quantity`). Nếu phát hiện sản phẩm hết hàng, lập tức ngắt giao dịch (Rollback) và phản hồi lỗi cho frontend.
3. **Insert bảng `orders`:**
   - Thêm một bản ghi hóa đơn mới.
   - Hệ thống tự sinh `order_code` (VD: tự động tăng theo prefix).
   - Trạng thái mặc định là `COMPLETED` (nếu thanh toán thành công).
4. **Insert bảng `order_items`:**
   - Với mỗi sản phẩm trong giỏ hàng, thêm một bản ghi vào bảng chi tiết hóa đơn.
   - Ràng buộc vào `order_id` vừa sinh ra ở Bước 3.
5. **Update bảng `products` (Trừ Tồn Kho):**
   - Cập nhật số lượng tồn kho hiện tại: `stock_quantity = stock_quantity - quantity`.
6. **Insert bảng `stock_movements` (Ghi nhận Lịch sử Xuất Kho):**
   - Thêm log xuất kho cho từng sản phẩm với `movement_type = 'OUT'`.
   - Tham chiếu `reference_id` về `order_id`.
   - Lưu trữ thông tin thay đổi.
7. **Commit Transaction:** Nếu tất cả các thao tác (từ bước 2 đến bước 6) diễn ra không có lỗi, hệ thống chốt lưu dữ liệu vĩnh viễn (Commit) và trả về kết quả thành công cho người dùng.
