Bộ dữ liệu đã xử lý cho đồ án quản lý kho mini tích hợp AI.

Nguồn gốc: Grocery_Inventory_and_Sales_Dataset.csv, 990 dòng thô.
Cách xử lý:
- Sửa Catagory -> Category, bổ sung danh mục thiếu cho Cabbage.
- Gộp dòng trùng theo Product_Name + Category, còn 123 sản phẩm sạch.
- Việt hóa tên sản phẩm/danh mục, chuẩn hóa đơn vị tính.
- Giảm nhà cung cấp từ dữ liệu giả lập xuống 12 nhà cung cấp mẫu hợp lý.
- Tách thành bảng categories, units, suppliers, products.
- Tạo thêm 519 đơn hàng mẫu trong 90 ngày, 1309 dòng chi tiết đơn hàng.
- Tạo 1433 lịch sử nhập/xuất kho để dashboard và AI dự báo có dữ liệu.

Thứ tự import vào Supabase:
1. categories.csv
2. units.csv
3. suppliers.csv
4. products_clean.csv
5. orders_sample.csv
6. order_items_sample.csv
7. stock_movements_sample.csv
