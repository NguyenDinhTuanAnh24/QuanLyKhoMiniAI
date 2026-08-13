# SPDD Analysis: Frontend Responsive Refactor

## Original Business Requirement
Thực hiện một đợt responsive regression + responsive refactor cho toàn bộ frontend dự án.
Mục tiêu:
- Rà soát TOÀN BỘ frontend một lượt.
- Fix responsive cho tất cả các trang.
- Không chỉ sửa trang Nhật ký hoạt động.
- Không thay đổi business logic.
- Không thay đổi API contract.
- Không làm xấu desktop để đổi lấy mobile.
- Sau khi hoàn tất phải test nhiều viewport (375x667 đến 1920x1080).
- Build production phải PASS.

Yêu cầu chi tiết về layout, breakpoints, sidebar, topbar, cards, tables, pagination, filters, typography, vv... đã được liệt kê đầy đủ. Đảm bảo UI/UX hiển thị hoàn hảo trên các thiết bị mobile mà không bị tràn màn hình ngang (horizontal overflow).

## Domain Concept Identification

### Existing Concepts (from codebase)
- Layout Components: `MainLayout`, `Sidebar`, `Topbar`, `PageHeader` — Core skeleton of the application UI.
- Layout Wrappers: Flexbox, Grid, overflow utilities — Foundation for all responsive breakpoints.
- Dashboard Pages: `Dashboard`, `InventoryOps`, `AIInsights`, `Sales`, `Reports` — Complex views combining charts, stats, and tables.
- Data Pages: `Products`, `Categories`, `Suppliers`, `Units`, `Users` — List and form interfaces based on data entities.
- Table / List Patterns: Existing structures mapping data to visual columns.

### New Concepts Required
- Mobile Card View Pattern: A specific responsive component/layout strategy converting complex tables into vertical cards on screens < 768px.
- Responsive Filter Layout: Stacked or grid-based layout for search inputs and dropdowns, adapting to available width.
- Responsive Modal/Drawer System: Ensuring modal dialogs fit within `calc(100vw-32px)` and max-height constraints.

### Key Business Rules
- Data Integrity Rule: UI refactor MUST NOT alter, remove, or hide critical data fields (business logic remains untouched).
- Readability Rule: Text size must remain legible (no text-[8px]), truncating or breaking words instead of overflowing.
- Desktop Preservation Rule: Desktop views (>= 1366px) must not degrade or be simplified into cards.

## Strategic Approach

### Solution Direction
- Leverage Tailwind CSS responsive prefixes (`sm:`, `md:`, `lg:`) to control layout variations.
- Systematically transition wide data tables to card-based layouts on mobile devices using `hidden md:block` and `md:hidden flex flex-col`.
- Standardize all main page wrappers to use `w-full min-w-0` to strictly prevent horizontal body scroll.
- Audit all absolute, fixed, and specific widths (`w-[Xpx]`) in the CSS classes.

### Key Design Decisions
- Breakpoint Strategy: Mobile (<768px), Tablet (768-1023px), Desktop (>=1024px). The `md:` (768px) breakpoint will be the primary toggle between Card View and Table View.
- Navigation Strategy: Maintain the drawer behavior on mobile for the Sidebar. Search input in Topbar will be hidden or compacted on small screens to prioritize notifications and user avatar.
- Table Strategy: Simple tables will get `overflow-x-auto` wrappers. Complex tables will switch to Card format.

### Alternatives Considered
- Scale/Zoom Approach: Using CSS `transform: scale()` to fit desktop layouts into mobile screens. Rejected because it violates accessibility standards, makes text unreadable, and creates a poor UX.
- Horizontal Scroll on Body: Rejected. It breaks the fixed layout feel of web apps and frustrates users.
- Independent Mobile Pages: Rejected. The effort to maintain separate routes for mobile vs desktop is too high. Tailwind responsive classes are the preferred approach.

## Risk & Gap Analysis

### Requirement Ambiguities
- Mobile Search Topbar: The requirement mentions hiding search or converting to an icon. We must decide which approach based on existing Topbar design.
- Settings Form Layout: Shifting summary panels below forms requires flex-col reversal or CSS grid ordering.

### Edge Cases
- Extremely long names/IDs (UUIDs, Email, AI text): Can break layout if not explicitly handled with `break-all` or `break-words`.
- Nested Overflow: A table inside a card inside a modal might have conflicting overflow rules.

### Technical Risks
- Regression Risk: Modifying global layouts (`MainLayout`, `Topbar`) could accidentally break standard desktop views. Mitigation: Strict testing on 1366x768 and 1920x1080 before committing.
- Build Size/Speed: Adding excessive conditional renders might increase DOM node count. Mitigation: Use CSS toggles (`hidden`, `block`) primarily.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1   | Fix responsive all pages | Yes | Requires iterative file updates |
| 2   | No business logic changes | Yes | Only touching `className` and layout |
| 3   | Desktop view preservation | Yes | Will use Tailwind `md:` and `lg:` strictly |
| 4   | No horizontal body overflow | Yes | Applied via `min-w-0` and `w-full` on `MainLayout` |
| 5   | Pass production build | Yes | Build tested after refactor |
