# SPDD Analysis: full-page-skeleton-performance

## Original Business Requirement
```text
THỰC HIỆN FINAL FULL-PAGE SKELETON + DATA LOADING PERFORMANCE OPTIMIZATION
CHO TOÀN BỘ FRONTEND SMART RETAIL INVENTORY AI.

Project:
D:\ĐATN_KHOHANGMINI

==================================================
0. YÊU CẦU ĐÃ CHỐT
==================================================

Hiện tại skeleton chỉ phủ một phần trang.
Ví dụ:
Dashboard: Page title vẫn hiện thật, Card header vẫn hiện thật, AI Insights title vẫn hiện thật, một số block mới skeleton.
Products: "Sản phẩm" hiện thật, Nhập Excel / Xuất Excel / Thêm sản phẩm hiện thật, Search/filter hiện thật, chỉ stat/table content skeleton.

TÔI KHÔNG MUỐN KIỂU NÀY NỮA.

CHỐT:

APP SHELL:
- Sidebar
- Topbar/Header
- Logo
- Notification icon
- Account/avatar
=> được hiển thị thật.

TOÀN BỘ ROUTE CONTENT:
- Page title, subtitle, actions, tabs, stat cards, filters, forms, tables, charts, panels, buttons trong page, pagination, section headings
=> trong INITIAL LOAD phải là skeleton hoàn chỉnh.

Khi data sẵn sàng:
Skeleton page → Real page
Không để một nửa skeleton, một nửa content thật.

==================================================
1. ĐỌC SOURCE
==================================================
(Xem yêu cầu đầy đủ trong prompt)

==================================================
2. APP SHELL KHÔNG SKELETON
==================================================
MainLayout giữ thật. Chỉ ROUTE CONTENT được thay bằng full-page skeleton.

==================================================
3. FULL PAGE SKELETON
==================================================
Mỗi route phải có skeleton mô phỏng TOÀN BỘ PAGE CONTENT (đúng kích thước, đúng layout).

==================================================
4. SHADCN SKELETON PRIMITIVE
==================================================
Tiếp tục dùng Skeleton theo shadcn/ui. (animate-pulse, rounded-md, neutral background). Không tạo animation JS.

==================================================
5. SKELETON PHẢI DÙNG CHÍNH LAYOUT CỦA PAGE THẬT
==================================================
QUAN TRỌNG NHẤT: Skeleton và loaded page phải dùng chung PageContainer, grid wrapper, card wrapper, table wrapper, column ratios, gap, padding, breakpoints.

==================================================
6. PAGE TITLE CŨNG SKELETON
==================================================
Trong initial load, Page Title cũng là Skeleton text.

==================================================
7. ACTION BUTTONS CŨNG SKELETON
==================================================
Initial loading: các action buttons ("Nhập Excel", "Thêm sản phẩm", "Cài đặt AI") → button-shaped Skeleton.

==================================================
8. FILTERS CŨNG SKELETON
==================================================
Initial load: Search, Select, Filter, View toggle → skeleton đúng kích thước thật.

==================================================
9. TABS CŨNG SKELETON
==================================================
Trong initial route load: tabs → skeleton.

==================================================
10. PAGINATION CŨNG SKELETON
==================================================
Pagination thuộc initial loaded page -> render placeholder đúng vị trí.

==================================================
11. DASHBOARD FULL SKELETON
==================================================
Mô phỏng toàn bộ Page header, Date, 4 stat cards, Revenue chart, AI Insights, Recent Transactions, Stock Alerts.

==================================================
12. PRODUCTS FULL SKELETON
==================================================
Mô phỏng toàn bộ Title, Subtitle, 3 action buttons, 4 stats, filter row, view switcher, table, pagination.

==================================================
13. INVENTORY FULL SKELETON
==================================================
Mô phỏng Title, Subtitle, Tabs, Stats, Form card, History card... Tỷ lệ Grid phải đúng loaded layout.

==================================================
14. SALES FULL SKELETON
==================================================
Toàn route content skeleton theo DOM thực tế.

==================================================
15. ALERTS FULL SKELETON
==================================================
Skeleton header, stats, filters, table, actions, pagination.

==================================================
16. AI FULL SKELETON
==================================================
Initial route load skeleton TOÀN PAGE.

==================================================
17. AI ANALYZING KHÁC INITIAL LOAD
==================================================
Initial route load → AI full-page skeleton.
User bấm "Chạy phân tích AI" → KHÔNG full skeleton (Giữ dữ liệu cũ + blur + progress modal).

==================================================
18. REPORTS FULL SKELETON
==================================================
Skeleton toàn bộ.

==================================================
19. ACTIVITY LOGS FULL SKELETON
==================================================
Skeleton toàn bộ. (Không table skeleton trên mobile).

==================================================
20. SETTINGS FULL SKELETON
==================================================
Skeleton toàn bộ Title, subtitle, tabs, form, side panels, buttons.

==================================================
21. USERS / CATEGORIES / UNITS / SUPPLIERS
==================================================
Toàn page content skeleton.

==================================================
22. KHÔNG FAKE ZERO
==================================================
Không được render 0, 0đ, 0 sản phẩm trong lúc initial load. Tất cả dynamic value: Skeleton.

==================================================
23. FULL PAGE SKELETON KHÔNG CÓ SPINNER CHÍNH
==================================================
Không chèn spinner lớn giữa skeleton. Tự thân Skeleton là loading indicator.

==================================================
24. KHÔNG SKELETON VÔ HẠN
==================================================
API success: kết thúc. API empty: Empty State. API error: Error State.

==================================================
25. SKELETON VISIBILITY DELAY
==================================================
Chống nháy: Nếu data trả < 120ms -> render page luôn. Nếu > 120ms -> show skeleton tối thiểu 180-250ms.

==================================================
26-45. DATA LOADING PERFORMANCE STRATEGY
==================================================
- Request Parallelism (Promise.all cho API độc lập).
- Tách biệt Critical / Secondary Request.
- Request Deduplication (Không fetch 2-3 lần cùng endpoint).
- StrictMode Double Fetch handling (cleanup, abort controller).
- Abort Stale Requests (Cancel request cũ khi search/filter nhanh).
- Search Debounce (250-350ms).
- Cache Master Data (Categories, units, suppliers) với context/lightweight cache.
- Cache Invalidation sau khi Create/Update/Delete.
- Tối ưu Select query.
- Kiểm tra lại Pagination toàn hệ thống.
- Ưu tiên gọi Dashboard Overview endpoint tổng.
- Không giữ connection/timer backend vô hạn (Vercel/Serverless compatible).
- Lazy Route Chunks (code split React.lazy).
- Prefetch Route hợp lý.
- Tách Bundle cho Excel (dynamic import exceljs) & Chart.

==================================================
46-61. TESTING & METRICS
==================================================
- Parity: x/width diff <= 2px.
- Skeleton đủ chiều cao để lấp đầy viewport.
- Mobile/Tablet Layout chuẩn.
- Ghi nhận Metrics (Số request, deduplication, content-ready time).
- Chạy Playwright Tests intercept với 1500ms delay. Sử dụng data-testid = *-full-skeleton.
- Report kết quả chi tiết.
```

## Domain Concept Identification

### Existing Concepts (from codebase)
- **App Shell**: The persistent outer layout (`MainLayout`, `Sidebar`, `Topbar`) that wraps all pages.
- **Route Content (`PageContainer`)**: The dynamic content area injected into the App Shell, unique per route.
- **Data Fetching Patterns**: The existing `useEffect` blocks triggering API calls sequentially or with duplicate triggers.
- **Loading State**: The existing boolean flags (`loading`, `isSubmitting`) managing transitions.
- **Shadcn UI Skeleton**: The existing primitive (`@/components/ui/skeleton`) used for individual element placeholders.
- **Master Data**: Highly reusable reference data (Categories, Units, Suppliers) currently fetched per-page.
- **Bundles**: Heavy dependencies (`exceljs`, `recharts`) currently imported statically in multiple places.

### New Concepts Required
- **Full-Page Skeleton Component**: A 1:1 structural representation of a page's layout using Shadcn primitives, masking the entire `PageContainer` content (including headers and actions).
- **Delayed Loading Hook (`useDelayedLoading`)**: A hook to manage the 120ms delay threshold and 250ms minimum visibility for skeletons to prevent UI flashing.
- **Master Data Cache/Context**: A lightweight caching mechanism (React Context or simple memory map) to prevent redundant network calls for static reference data.
- **Request Cancellation (AbortController)**: Integrated signals into Axios/API calls to cancel stale requests during rapid filtering/searching.
- **Debounced Search Hook**: A standardized hook/util to apply a 250-350ms debounce on search inputs before triggering API calls.

### Key Business Rules
- **No Mixed Content Rule**: A page must NEVER render real static text (like titles or buttons) alongside skeletonized dynamic data during initial load.
- **Zero Layout Shift Rule**: The DOM structure (grid, gaps, paddings, wrappers) of the skeleton MUST be identical to the loaded state.
- **No Infinite Skeletons**: Loading states must definitively resolve to Data, Empty State, or Error State.
- **Performance Thresholds**: Skeletons are skipped if data loads under 120ms; once shown, they persist for at least ~200ms.
- **Action State Separation**: Initial load uses a full skeleton; subsequent actions (like AI Analysis) use blur + progress overlays.

## Strategic Approach

### Solution Direction
1.  **Architecture**: Shift from component-level skeletons to **Route-Level Skeleton States**. Instead of rendering the page and injecting skeletons deep within tables/cards, the route will render a dedicated `*FullSkeleton` component if it is in the `initialLoading` phase.
2.  **Structural Parity**: Refactor the page components so that the core structural wrappers (`PageHeader`, `Grid`, `Card`) are abstracted or duplicated perfectly within the Full Skeleton components.
3.  **Data Fetching Layer**: Implement a global `useMasterData` hook (or enhance existing contexts) to memoize Categories, Units, and Suppliers. Refactor all `useEffect` blocks in pages to use `Promise.all` for parallel fetching.
4.  **Network Resilience**: Wrap Axios calls with `AbortController` support, specifically tied to search/filter dependency arrays. Implement a standard `useDebounce` hook for all search bars.
5.  **Bundle Optimization**: Wrap `exceljs` export functions and `recharts` imports with dynamic `import()` to strip them from the main bundle.

### Key Design Decisions
- **Skeleton Implementation Strategy**: *Create dedicated full-skeleton components (e.g., `ProductsFullSkeleton.jsx`) vs. Inline conditional rendering*.
  → *Recommendation*: Inline conditional rendering of `Skeleton` primitives directly within the actual layout wrappers (e.g., passing a `loading` prop to `PageHeader` or `StatCard` which internally swaps text for skeletons). This guarantees 100% layout parity because the exact same DOM wrappers are used. For complex components (like tables), render a skeleton version of the table rows inside the real table wrapper.
- **Loading Delay Logic**: *Global Axios Interceptor vs. Custom Hook*.
  → *Recommendation*: Custom Hook (`useDelayedLoading`). Doing it globally via Axios is risky for background polls or mutations. A hook attached to the page's main loading state provides precise control over the 120ms/250ms thresholds.
- **Caching Mechanism**: *React Query vs. React Context/In-Memory Singleton*.
  → *Recommendation*: In-Memory Singleton (with invalidation methods) or React Context. The prompt explicitly forbids forcing React Query if the project doesn't use it, to minimize architectural disruption.

### Alternatives Considered
- **React Suspense + Error Boundaries**: Rewriting the routing layer to use `React.lazy` with Suspense fallbacks.
  *Why Rejected*: Might require a massive rewrite of data fetching logic (React 18 Suspense for Data Fetching requires specific cache implementations or libraries like React Query). Manual state management (`isLoading`) is safer and closer to the existing architecture.
- **Global CSS Spinner over empty DOM**:
  *Why Rejected*: Violates the core business requirement of using Shadcn structural skeletons.

## Risk & Gap Analysis

### Requirement Ambiguities
- **Pagination in Skeletons**: The prompt asks for pagination to be skeletonized, but pagination usually depends on the total item count (which is unknown during initial load).
  *Resolution Direction*: Render a generic pagination skeleton (e.g., "Previous | Page 1 of X | Next") with standard width.
- **Chart Skeleton Layout**: Recharts components are complex to mock perfectly.
  *Resolution Direction*: Use a generic `div` with a skeleton background matching the exact height/width of the chart container.

### Edge Cases
- **Fast Network Flashing**: API responds in 130ms. The skeleton triggers (crossing the 120ms threshold) but must now artificially hold the UI for another ~120ms (to hit the 250ms minimum) while data is ready.
- **Stale Aborts**: A fast request (Search "A") finishes *after* a slow request (Search "AB"). If AbortController isn't perfectly wired, "A" might overwrite "AB".
- **Cache Invalidation**: Updating a Category must instantly invalidate the Master Data cache so the Products page reflects the new name.

### Technical Risks
- **Layout Divergence**: Maintaining identical DOM structures in both loaded and loading states is highly prone to human error during future feature updates.
- **Dynamic Imports Complexity**: Moving `exceljs` to dynamic imports changes synchronous click handlers to asynchronous, requiring button loading states to prevent double-clicks during chunk loading.
- **Double Fetch in Strict Mode**: Standard `useEffect` without cleanup will fetch twice in React 18 dev mode, potentially causing race conditions with the AbortController.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | App Shell real, Route Content full skeleton | Yes | Requires strict separation at the `MainLayout` / Router outlet level. |
| 2 | No mixed content (titles/buttons are skeletons) | Yes | Requires refactoring `PageHeader` and shared UI components to accept `isLoading` flags. |
| 3 | Layout parity (0 shift) | Yes | Will use identical DOM wrappers for both states. |
| 4 | No fake zeros | Yes | Ensure initial state values don't flash before skeleton mounts. |
| 5 | Visibility Delay (120ms/250ms) | Yes | Will implement a reusable `useDelayedLoading` hook. |
| 6 | Performance optimizations (Parallel, Dedupe, Cache) | Yes | Requires careful auditing of every `useEffect` in all 10+ pages. |
| 7 | Bundle splitting (Excel/Charts) | Yes | Easy to implement via `await import('exceljs')`. |
| 8 | Playwright Tests & Test IDs | Yes | Will inject `data-testid` and create the required test scripts. |
