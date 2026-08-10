# US-39: Hoàn thi?n AI d? báo t?n kho và g?i ý nh?p hàng

## 1. T?ng quan
User Story 39 nh?m gi?i quy?t các l?i hi?n có trong phân h? AI D? báo, nâng c?p d? chính xác c?a logic tính toán (rule-based), và c?i thi?n co ch? fallback khi k?t n?i Gemini g?p s? c?, d?m b?o hi?n th? dúng s? li?u, không b? NaN ho?c ?.

## 2. Các thay d?i chính

### 2.1 Backend
- **T?i uu truy v?n d? li?u:** C?p nh?t AIRepository.js d? truy xu?t thêm các field c?n thi?t.
- **Rule-based Forecast (Baseline):** 
  - S?a d?i ForecastService.js d? tính toán chính xác s? lu?ng bán trung bình hàng ngày d?a trên tham s? historyDays thay vì fix c?ng 90 ngày.
  - S? d?ng chung m?t chu?n output là orecast_quantity thay cho orecast_14d d? tránh ph? thu?c vào con s? 14.
  - Ðánh giá d? uu tiên hoàn toàn t? d?ng b?ng toán h?c, không ph? thu?c AI.
- **Tích h?p Gemini (LLM):** 
  - Ch?nh s?a GeminiAIService.js, s? d?ng tu? ch?n esponseMimeType: "application/json" d? ép Gemini tr? v? JSON, và s? d?ng Regex d? lo?i b? block markdown.
  - Xóa b? vi?c Gemini sinh ra các tru?ng s? (suggested_quantity, orecast_...) trong prompt d? b?t bu?c Gemini ch? làm nhi?m v? **phân tích nguyên nhân (eason)**.
- **Merge Data (AIInsightService.js):** 
  - Kh?i t?o Map d? d?i chi?u s?n ph?m. D? li?u s? nhu stock_quantity, orecast_quantity, suggested_import_quantity l?y nguyên g?c 100% t? Rule-based.
  - Thêm c? nalysis_mode (ule_based ho?c gemini_enhanced) vào k?t qu? tr? v?.

### 2.2 Frontend
- **AIInsightsPage.jsx:**
  - C?p nh?t logic uildAIInsightsData d? map theo field orecast_quantity an toàn b?ng nullish coalescing ?? 0.
  - Lo?i b? hoàn toàn mã hardcode fallback ?.
  - Ð?c và hi?n th? tr?c quan nhãn "AI Nâng cao" ho?c "Fallback: N?i b?" d?a trên field nalysis_mode.
- **AIForecastChart.jsx:**
  - Gi?i quy?t l?i c?nh báo Recharts width(-1) height(-1) b?ng cách cung c?p explicit height={288} cho <ResponsiveContainer>.

## 3. K?t qu?
- H? th?ng không còn b? gián do?n khi Gemini g?p l?i.
- Không còn tình tr?ng s? lu?ng T?n ho?c D? báo hi?n th? ? ho?c NaN trên Frontend.
- D? li?u hi?n th? mang tính nh?t quán và b?o v? tính v?n toàn s? h?c cho kho hàng.
