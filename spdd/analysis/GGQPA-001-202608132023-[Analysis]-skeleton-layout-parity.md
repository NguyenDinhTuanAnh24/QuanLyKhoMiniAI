# SPDD Analysis: Final Skeleton Layout Parity

## Original Business Requirement
MỤC TIÊU QUAN TRỌNG NHẤT:

Skeleton loading của MỖI TRANG phải có:
- cùng outer width
- cùng left/right position
- cùng grid
- cùng số cột
- cùng gap
- cùng card width
- cùng approximate height
- cùng responsive breakpoint
- cùng mobile/tablet/desktop structure

với chính giao diện LOADED của trang đó.
KHÔNG còn kiểu: Skeleton "ước lượng gần giống" → data về → component đổi kích thước. Skeleton phải là "bản rỗng" của chính layout thật.

0. VẤN ĐỀ THỰC TẾ ĐÃ XÁC NHẬN
... (đã đọc và lưu toàn bộ) ...

1. ĐỌC TOÀN BỘ SOURCE LIÊN QUAN
...

2. NGUYÊN TẮC MỚI: SHARED LAYOUT, DIFFERENT CONTENT
Không xây: `<ProductSkeleton />` với DOM độc lập.
Thay bằng pattern:
PRODUCT PAGE
    ├── ProductStatsGrid (loading → Skeleton, loaded → Data)
    ├── ProductFilters
    └── ProductTableContainer (loading → Skeleton rows, loaded → Product rows)
GRID WRAPPER, CARD WRAPPER, TABLE WRAPPER, FORM WRAPPER phải là CÙNG COMPONENT/CÙNG CLASS.

3. PATTERN BẮT BUỘC
Grid KHÔNG thay đổi. (vd: `<div className="grid...">{loading ? Skeletons : Data}</div>`)

4. CARD WRAPPER KHÔNG ĐƯỢC THAY
Skeleton cũng phải dùng chính wrapper này. `<StatCard>{loading ? <SkeletonContent /> : <RealContent />}</StatCard>`

5. TẠO LAYOUT PRIMITIVES NẾU CẦN
PageSection, StatGrid, CardShell, TableShell, TwoColumnPanel, FormSection, ChartCard, SidePanel.

6. PAGE CONTAINER CHUNG
Tất cả trang tiếp tục dùng PageContainer chuẩn theo Dashboard.

... [Nội dung yêu cầu chi tiết về từng trang: Dashboard, Products, Inventory, Sales, Alerts, AI, Reports, Activity Logs, Users, Settings, Data Foundation] ...

39. LAYOUT METRICS TEST
Tạo Playwright skeleton parity tests. Intercept API delay ~1500ms. Capture bounding boxes khi skeleton visible và khi loaded. So sánh.

40. PAGE ROOT PARITY
Expected: |x diff| <= 2px, |width diff| <= 2px.

... [Yêu cầu về Visual Snapshot, CLS, MainLayout không re-init, Data Length không ảnh hưởng Width] ...

60. DEFINITION OF DONE
- Skeleton không còn là layout ước lượng.
- Skeleton và real content dùng chung structural wrapper.
- Root x/width diff <= 2px.
- Grid không đổi columns khi data về.
- Playwright PASS cho tất cả các viewports.

## Domain Concept Identification

#### Existing Concepts (from codebase)
- **Skeletons (shadcn/ui `Skeleton`)**: Các primitive element dùng để mô phỏng loading state. Hiện tại đang được bọc trong các layout file riêng biệt (ví dụ `ProductSkeleton.jsx`), gây ra hiện tượng lệch layout (Layout Shift) khi so sánh với layout component thực tế.
- **PageContainer**: Lớp vỏ bọc layout chung cho các trang. Đã hỗ trợ `data-testid` từ những session trước.
- **Routing & Suspense (`RouteLoadingFallback.jsx`)**: Cơ chế lazy load của React đang sử dụng các file Skeleton hoàn chỉnh (dạng layout độc lập) làm fallback UI.
- **Playwright Test Suite**: Hạ tầng E2E Test hiện đã có `responsive.spec.js` và `alerts-layout.spec.js` (chạy trên nhiều viewport khác nhau) có khả năng delay API để bắt trạng thái loading.

#### New Concepts Required
- **Shared Layout Shells/Primitives**: Các component layout tĩnh đóng vai trò cấu trúc grid, thẻ card, bảng (vd: `StatGrid`, `TableShell`, `CardShell`) độc lập với data. Cả Loading UI và Real UI đều gọi chung các shell này thay vì render layout wrapper 2 lần khác nhau.
- **Inline Component Skeleton**: Các component chức năng (như `StatCard`, `ProductTable`) phải tự handle trạng thái `isLoading` và trả về cấu trúc Skeleton bên trong thay vì phó mặc cho một `PageSkeleton` độc lập bên ngoài.
- **Parity Test Runner (`skeleton-parity.spec.js`)**: Một framework E2E test mới (hoặc mở rộng test layout hiện tại) để intercept API tất cả các trang, đo đạc tọa độ Bounding Box của `loading` vs `loaded` và assert độ lệch (sai số <= 2px).

#### Key Business Rules
- **Không suy diễn kích thước**: Các skeleton không được tự gán fix width/height (VD: `w-[620px]`). Kích thước luôn được kế thừa 100% từ container cha chung.
- **DOM Structure Parity**: Render Tree của Skeleton HTML và Loaded HTML (phần Layout Wrappers, Grid, Flex, Padding, Margin) phải là 1. Mọi khác biệt chỉ được xuất hiện ở node lá (Leaf nodes) như Text bị thay thành Skeleton bar.
- **Zero Shift Promise**: Quá trình chuyển từ Initial Loading sang Data Loaded không được làm dịch chuyển (shift) layout gốc theo X-axis và Width.

## Strategic Approach

#### Solution Direction
- **Phase 1 (Kiến trúc & Primitives)**: Chuyển dịch toàn bộ từ mô hình "Page Skeleton" sang "Component/Inline Skeleton". Tạo các Layout Shell (`CardShell`, `GridShell`, `TableShell`) chia sẻ chung class cho cả hai state.
- **Phase 2 (Refactor Các Trang Bị Ảnh Hưởng Nặng)**: Bắt đầu từ `InventoryOpsDashboard` (đã xác định là lệch nặng nhất), sau đó là `ProductDashboard` và `DashboardPage`. Tích hợp Shared Shells vào các components thật. 
- **Phase 3 (Cleanup & Chuẩn hóa toàn hệ thống)**: Áp dụng Pattern tương tự cho các trang còn lại (Sales, AI, Reports, Activity Logs, Users, Categories, Units, Suppliers, Settings). Xóa toàn bộ file Skeleton độc lập cũ (như `ProductSkeleton.jsx`) ở cấp Page.
- **Phase 4 (Validation & Automation)**: Nâng cấp Playwright Test để quét đệ quy các Viewports x Pages. Intercept mọi API trả về chậm (1.5s delay), bắt bounding box lúc đang render loading skeleton, rồi mock response thành công để so sánh layout box.

#### Key Design Decisions
- **Decision: Cách xử lý Route Loading Fallback (Suspense)** 
  - *Trade-offs*: Nếu xóa Page Skeletons, Suspense fallback sẽ không có UI đồng bộ. Tuy nhiên, nếu dùng Page Skeletons cũ, layout sẽ bị shift khi component thật mount.
  - *Recommendation*: Thay đổi Suspense fallback thành một loading spinner siêu nhẹ (Minimal Fallback) hoặc để trống. Layout thực tế chỉ nên render ra skeleton khi chính Page Component thật đã được mount và tiến hành fetch data. Điều này đảm bảo Wrapper luôn là của Component thật.
- **Decision: Quản lý kích thước các element động (Chart, Data Table, Text)** 
  - *Trade-offs*: Chiều cao Table/List có thể thay đổi tùy số lượng item trả về.
  - *Recommendation*: Chấp nhận sai số chiều cao dọc (height) ở các thành phần phụ thuộc data, nhưng chiều rộng ngang (width), trục X (X-axis) và các phần tử cố định (Header, Filter, Toolbars, Stat Cards, Empty State Skeleton) phải có sai số `<= 2px`.

#### Alternatives Considered
- **Sửa CSS thủ công cho từng file PageSkeleton**: Rejected. Cách này không sustainable, bất kỳ thay đổi nào trong tương lai của Page Component cũng sẽ yêu cầu sửa đổi thủ công tương ứng trên file PageSkeleton. Giải pháp "Shared Wrapper" bền vững hơn.

## Risk & Gap Analysis

#### Requirement Ambiguities
- Yêu cầu ghi rõ chiều cao của Inventory Form/History phải "reasonable tolerance" hoặc "đúng tỷ lệ". Mức độ dung sai dọc (Y-axis) cụ thể là bao nhiêu px thì được coi là PASS nếu số items trong History/Table là linh động? (Giả định: Không quá khắt khe về chiều cao nếu logic data là động, tập trung chặt chẽ vào Width, Margin, Padding và Grid Template).

#### Edge Cases
- **Data Empty vs Skeletons**: Khi state loading kết thúc nhưng data rỗng (`[]`), Empty State có layout khác với Skeletons có thể gây Layout Shift nhẹ.
- **Table Columns Widths**: Việc duy trì chính xác % width của column giữa table header lúc loading và lúc render row (khi text dài ngắn khác nhau) đòi hỏi cấu trúc `table-layout: fixed` trên CSS.

#### Technical Risks
- **Khối lượng refactor khổng lồ**: Vì Frontend có khoảng 14 trang chính, việc bóc tách wrapper và di chuyển loading logic vào tận component sâu (Filters, Cards, Charts, Tables) tốn nhiều effort và dễ phát sinh regression bug làm mất data render hiện tại. 
  - *Mitigation*: Tách quá trình ra theo nhóm trang (Ví dụ: Inventory + Products trước, sau đó Settings + Data Foundation). Chạy Playwright liên tục sau mỗi cụm trang.

#### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Cùng outer width, x/y position | Yes | Xác nhận qua Playwright Bounding Box. |
| 2 | Cùng Grid, số cột, padding | Yes | Dùng Shared CSS Grid Wrapper. |
| 3 | Mobile/Tablet/Desktop parity | Yes | Responsive Grid class áp dụng cho cả Skeleton. |
| 4 | Xóa bỏ file Generic/Page Skeleton | Yes | Sẽ loại bỏ pattern cũ khỏi codebase. |
| 5 | Không làm hỏng UI/Logic hiện tại | Yes | Thay đổi mang tính bọc Wrapper, không đổi data logic. |
