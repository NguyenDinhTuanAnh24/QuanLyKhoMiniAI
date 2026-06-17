# SPDD Analysis: Phân trang cho AI Dự báo

## Original Business Requirement
Thực hiện bước Phân tích và lập Bản vẽ cấu trúc (Canvas) để bổ sung tính năng PHÂN TRANG cho trang "AI Dự báo" (/ai-insights).
1. Bảng "Dự báo nhu cầu từng sản phẩm" (Table): Phân trang dạng server-side hoặc in-memory. Giới hạn hiển thị: Đúng 5 sản phẩm/trang. Hiển thị Pagination Navigation ngay dưới chân bảng.
2. Danh sách "Gợi ý nhập hàng từ AI" (Grid Cards): Phân trang độc lập với phần 1. Giới hạn hiển thị: Đúng 8 thẻ gợi ý/trang. Hiển thị các nút điều hướng chuyển trang ở chân phân đoạn Grid Cards.
3. Bảo vệ Layout và Logic cũ: Giữ nguyên vẹn Layout chung (Sidebar, Navbar), các ô Input tìm kiếm, Select danh mục/trạng thái và logic tính toán AI/nút "Áp dụng" sẵn có của Trưởng nhóm.

## Domain Concept Identification

### Existing Concepts (from codebase)
- `AIInsightsPage`: Trang chính, gọi API `/api/ai/forecast` để lấy toàn bộ dữ liệu (`data.items`), truyền qua props xuống các component con.
- `AIProductForecastTable`: Hiển thị bảng sản phẩm kèm dự báo, tìm kiếm, lọc (category, risk). Nhận props `data` là toàn bộ danh sách items.
- `AISuggestionCards`: Hiển thị lưới thẻ các sản phẩm cần nhập hàng. Nhận props `items`, lọc ra những phần tử có `suggested_import_quantity > 0` và sort.

### New Concepts Required
- `PaginationState`: State quản lý trang hiện tại (`currentPage`), cần đặt độc lập ở từng component con để không gây render chéo.
- `PaginationUI`: Giao diện thanh chuyển trang (Prev, Next, Page numbers) được tích hợp dưới cùng của bảng và lưới thẻ.

### Key Business Rules
- Lọc (Search, Category, Risk) phải diễn ra **trước** khi tính toán phân trang ở `AIProductForecastTable`.
- Lọc `suggested_import_quantity > 0` và sort phải diễn ra **trước** khi phân trang ở `AISuggestionCards`.
- Thao tác chuyển trang của component này không ảnh hưởng component kia.
- Mọi logic cũ (áp dụng gợi ý, hiển thị tooltip, màu sắc status) phải được giữ nguyên vẹn.

## Strategic Approach

### Solution Direction
- Sử dụng **In-memory (Client-side) Pagination** thay vì Server-side.
- Lý do: API `getAIForecast` đã trả về toàn bộ dữ liệu dự báo cho kỳ hiện tại trong một lần gọi để tính toán tổng quan (Stat Summary, Chart, Report). Việc gọi lại API chỉ để lấy trang cho table/card sẽ phá vỡ kiến trúc data luân chuyển từ trên `AIInsightsPage` xuống, trừ khi phải tách rời API list và API report. Việc làm In-memory sẽ an toàn và nhanh hơn nhiều với kích thước data nhỏ/vừa.

### Key Design Decisions
- Đặt state `currentPage` trực tiếp bên trong `AIProductForecastTable` và `AISuggestionCards` thay vì đưa lên `AIInsightsPage`.
- Trade-off: Component con tự quản lý state phân trang.
- Recommendation: Hướng đi tốt nhất vì state phân trang chỉ ảnh hưởng tới cách hiển thị của component đó, không tác động lên dữ liệu gốc.
- Khi các filter thay đổi (ví dụ gõ từ khoá tìm kiếm), cần reset `currentPage` về 1 để tránh lỗi hiển thị trang trống (ví dụ đang ở trang 3 nhưng kết quả filter chỉ có 1 trang).

### Alternatives Considered
- Server-side Pagination: Phải sửa lại backend API `/api/ai/forecast` để trả về `items` theo `page/limit`. Bị loại bỏ vì `AIInsightsPage` cần tải tất cả item để tính tổng kết trên client-side (trừ khi làm API aggregation ở backend, sẽ tốn nhiều resource thay đổi).

## Risk & Gap Analysis

### Requirement Ambiguities
- Yêu cầu ghi "hiển thị Pagination Navigation (Trước, Sau, 1, 2, 3...)": Cần thiết kế một giao diện thanh pagination chuẩn để tái sử dụng ở 2 nơi. Có thể sử dụng hàm tiện ích nội bộ để sinh mảng phân trang.

### Edge Cases
- Khi kết quả lọc rỗng (0 phần tử) hoặc ít hơn kích thước 1 trang: Tổng số trang là 0 hoặc 1. Thanh phân trang cần bị vô hiệu hoá hoặc ẩn đi.
- Khi xoá/áp dụng gợi ý làm thay đổi danh sách items, nếu trang hiện tại vượt quá `totalPages` mới thì sao? -> Mảng `.slice()` vẫn an toàn, nhưng tốt nhất nên check nếu `currentPage > totalPages` thì cập nhật về `totalPages`.

### Technical Risks
- Việc thay đổi mảng đang render thành mảng mới qua `.slice()` có thể gây lỗi undefined nếu không kiểm tra null array. Cần có fallback an toàn.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Phân trang bảng dự báo (5 items) | Yes | In-memory pagination trên `AIProductForecastTable` |
| 2 | Phân trang lưới thẻ (8 cards) | Yes | In-memory pagination trên `AISuggestionCards` |
| 3 | Phân trang 2 phần độc lập | Yes | Mỗi bên tự quản lý `currentPage` riêng |
| 4 | Giữ nguyên layout, filter cũ | Yes | Áp dụng `.slice()` ở bước cuối, không xoá filter cũ |
