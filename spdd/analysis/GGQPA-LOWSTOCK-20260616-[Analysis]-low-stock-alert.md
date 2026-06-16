# SPDD Analysis: Low Stock Alert

## Original Business Requirement
Hãy thực hiện bước Phân tích Nghiệp vụ (Analysis) cho tính năng mới "Cảnh báo tồn kho" (Low Stock Alert) dựa theo ảnh thiết kế giao diện. 

Nhiệm vụ của bạn là khảo sát hệ thống và xuất ra một file đặc tả chính thức đặt tên là `GGQPA-LOWSTOCK-20260616-[Analysis]-low-stock-alert.md` nằm trong thư mục `spdd/analysis/`. File xuất ra phải bao gồm đầy đủ các mục sau:

1. TỔNG QUAN & MỤC TIÊU:
   - Mô tả mục đích tính năng: Cảnh báo hàng hóa sắp hết để lên kế hoạch nhập hàng kịp thời.

2. KHẢO SÁT HỆ THỐNG HIỆN TẠI (REUSE LAYOUT):
   - Quét qua codebase để tìm cấu trúc Layout chung (Navbar, Sidebar các trang khác đang dùng file nào, nằm ở đâu). 
   - Đưa ra phân tích cách nhúng trang mới vào Layout này để giữ nguyên thanh điều hướng, tránh code đè hay viết lại giao diện Sidebar của nhóm.

3. CẤU TRÚC DỮ LIỆU & SCHEMA (ENTITY RELATIONSHIP):
   - Dựa vào ảnh `image_4a9b89.png` và cấu trúc bảng `products` thực tế trên Supabase, định nghĩa các trường dữ liệu cần xử lý.
   - Làm rõ logic thêm cột `min_stock_level` (mức an toàn) và trạng thái hiển thị trên bảng:
     + Trạng thái "Rất nguy cấp": khi tồn kho thực tế ở mức báo động (Ví dụ: <= 20% của min_stock_level hoặc còn dưới 5 sản phẩm).
     + Trạng thái "Sắp hết hàng": khi tồn kho thực tế nhỏ hơn min_stock_level nhưng chưa chạm ngưỡng nguy cấp.

4. THIẾT KẾ DATA CONTRACT (API SPECIFICATION):
   - Mô tả API `GET /api/inventory/low-stock-alerts`.
   - Cấu trúc JSON trả về phải bao gồm: Các trường thống kê tổng hợp (KPI Cards) cho 3 thẻ đầu trang (Tổng sản phẩm trong kho, Sản phẩm sắp hết hàng, Danh mục cần lưu ý) và mảng danh sách chi tiết các mặt hàng tồn thấp để render lên bảng.

Hãy tự động chạy phân tích hệ thống local và ghi file đặc tả này vào đúng thư mục `spdd/analysis/` giúp tôi!

## Domain Concept Identification

### Existing Concepts (from codebase)
- **Product**: Core entity representing an item in inventory. Mapped to the `products` table. Key attributes include `product_id`, `sku`, `product_name`, `category_name`, `stock_quantity`.
- **Reorder Level**: Represents the safe stock threshold. Currently exists in the `products` table as `reorder_level` (which satisfies the business concept of `min_stock_level` mentioned in the requirement and `AGENTS.md`).
- **Layout Infrastructure**: Existing layout structure uses `MainLayout.jsx` which coordinates `Sidebar.jsx` and `Topbar.jsx`. Routing is managed via `react-router-dom` in `App.jsx`.

### New Concepts Required
- **Low Stock Alert Dashboard**: The new UI view to present the alerts, which will be plugged into the existing `MainLayout`.
- **KPI Summary Metrics**: Aggregated data points including "Total products in stock" (Tổng sản phẩm), "Low stock products" (Sản phẩm sắp hết hàng), and "Categories needing attention" (Danh mục cần lưu ý).
- **Alert Status**: A computed derived state for each product to determine urgency ("Rất nguy cấp" or "Sắp hết hàng").

### Key Business Rules
- **Safe Level Mapping**: The UI's concept of `min_stock_level` maps directly to the existing `reorder_level` database field.
- **"Rất nguy cấp" (Critical) Rule**: Triggered when `stock_quantity <= (0.2 * reorder_level)` OR `stock_quantity < 5`.
- **"Sắp hết hàng" (Warning) Rule**: Triggered when `stock_quantity < reorder_level` but the condition for "Rất nguy cấp" is NOT met.

## Strategic Approach

### Solution Direction
- **Frontend Integration**: Implement a new React component (e.g., `AlertsDashboard.jsx`) in `frontend/src/components/`. Map it in `App.jsx` under the `/alerts` route. Wrap the new component inside `<MainLayout activePage="alerts">` to inherit the standard navigation. The `Sidebar.jsx` already has an entry for `id: 'alerts'` (Cảnh báo tồn kho), so no changes to Sidebar are needed besides ensuring it navigates correctly.
- **Backend Implementation**: Create a new API endpoint `GET /api/inventory/low-stock-alerts`. The controller/service will query the Supabase `products` table to fetch inventory data, calculate the required KPIs on the backend, and map the items to their respective alert statuses based on the defined thresholds.

### Key Design Decisions
- **Status Calculation (Backend vs Frontend)** -> **Recommendation: Backend**. Calculating the "Rất nguy cấp" and "Sắp hết hàng" status on the backend ensures business logic is centralized. The frontend only needs to render the status string or badge color based on the API response.
- **KPI Aggregation (Backend DB Query vs In-Memory)** -> **Recommendation: Backend**. The API should return the KPI summary object alongside the detailed list of low-stock items. This prevents the frontend from downloading the entire product catalog just to count the total number of products.

### Alternatives Considered
- **Persisting Alert Status in Database** -> **Rejected**. Creating a scheduled cron job or DB trigger to constantly update a status column adds unnecessary overhead. Since stock levels change frequently, computing the status dynamically on read is more efficient and maintains real-time accuracy.

## Risk & Gap Analysis

### Requirement Ambiguities
- **"Tổng sản phẩm trong kho"**: Does this mean the total count of unique product SKUs (e.g., 150 items) or the sum of all physical units in the warehouse (e.g., 8,405 physical items as seen in the mockup)? Given the large number in the mockup, it implies the sum of all `stock_quantity`. This needs confirmation during implementation.
- **"Danh mục cần lưu ý"**: This likely means the count of unique `category_id` values among the products that are in a low stock state.

### Edge Cases
- **Missing or Zero Reorder Level**: If `reorder_level` is 0 or null for a product, it should ideally not trigger alerts, but the `< 5` absolute rule might inadvertently flag it. Logic needs to handle products that shouldn't be tracked for reordering.
- **Negative Stock**: If `stock_quantity` goes negative due to a syncing issue, it must be treated as "Rất nguy cấp".

### Technical Risks
- **Performance of KPI Calculation**: Calculating the sum of all stock quantities and counting distinct categories across a very large `products` table could be slow if not indexed properly. Mitigation: Use efficient aggregate SQL queries in Supabase or caching if data grows large.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Mô tả mục đích tính năng | Yes | Covered in general approach. |
| 2 | Khảo sát hệ thống hiện tại (Reuse Layout) | Yes | Sidebar and MainLayout identified and reuse path is clear. |
| 3 | Cấu trúc dữ liệu & Schema | Yes | Mapped `min_stock_level` to `reorder_level`, status logic defined. |
| 4 | Thiết kế Data Contract (API Spec) | Yes | API structure for KPIs and item list is outlined. |
