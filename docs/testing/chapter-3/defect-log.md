# Sổ tay lỗi (Defect Log)

Bảng dưới đây ghi nhận lại các lỗi phát hiện được trong đợt kiểm thử cuối cùng (Final Testing Phase) và trạng thái khắc phục.

| Defect ID | Module | Mức độ (Severity) | Mô tả | Trạng thái |
|---|---|---|---|---|
| DEF-001 | Bán hàng (Sales) | High | Khi truyền mã sản phẩm không tồn tại hoặc mua quá số lượng tồn kho (TC-SALE-03), hệ thống báo lỗi 500 thay vì 400. | **FIXED** (Cập nhật GlobalExceptionHandler nhận diện `err.statusCode`) |
| DEF-002 | AI Import Plan | High | Tính năng Bulk Apply (TC-AIP-01) báo lỗi "Không có gợi ý cần nhập hàng nào hợp lệ" do sai cấu trúc Mock Data (`suggested_quantity` thay vì `suggested_import_quantity`). | **FIXED** (Sửa cấu trúc Mock Data và cập nhật logic kiểm tra) |
| DEF-003 | AI Import Plan | Medium | Nếu gọi Bulk Apply lần thứ 2 với cùng một `run_id`, hệ thống chưa chặn triệt để hoặc trả về lỗi không thống nhất. | **FIXED** (Bổ sung TC-AIP-02 để chặn trùng lặp, trả về 400 nếu gợi ý đã được `APPLIED`) |
| DEF-004 | Authentication | Medium | Payload đăng nhập chứa các trường thừa không bị loại bỏ. | **OPEN** (Không ảnh hưởng bảo mật do Zod strip, nhưng cần làm sạch payload ở frontend) |
