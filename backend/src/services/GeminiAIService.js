const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAIService {
  /**
   * Phân tích dữ liệu tồn kho bằng AI
   * @param {Array} baselineData Dữ liệu base đã được tính toán rule-based
   * @param {string} modelName Tên model (mặc định gemini-2.5-flash)
   * @param {number} forecastDays Số ngày dự báo
   * @returns {Object} Kết quả parse JSON từ AI
   */
  async analyzeInventory(baselineData, modelName = 'gemini-2.5-flash', forecastDays = 14) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Giới hạn số lượng gửi lên AI để tránh vượt context window (Top 100 sản phẩm có doanh thu hoặc độ rủi ro)
    // Ưu tiên sản phẩm hết hàng hoặc bán chạy
    const topProducts = [...baselineData]
      .sort((a, b) => {
        if (a.priority === 'Cao' && b.priority !== 'Cao') return -1;
        if (b.priority === 'Cao' && a.priority !== 'Cao') return 1;
        return b.sales_90d - a.sales_90d;
      })
      .slice(0, 100);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: { responseMimeType: "application/json" }
    });

    const systemPrompt = `Bạn là trợ lý phân tích tồn kho chuyên nghiệp cho hệ thống Smart Retail Inventory AI.
Dữ liệu dưới đây là lịch sử bán hàng và thông tin tồn kho của các sản phẩm.
Nhiệm vụ của bạn là phân tích và trả về ĐÚNG MỘT OBJECT JSON THEO SCHEMA YÊU CẦU, không giải thích gì thêm, không bọc markdown.

JSON Schema mong muốn:
{
  "overview_comment": "Tổng quan tình hình kinh doanh và tồn kho (ít nhất 3-5 câu).",
  "inventory_comment": "Nhận xét chi tiết về tình trạng kho, rủi ro đứt gãy hoặc tồn đọng (ít nhất 3 câu).",
  "sales_comment": "Nhận xét chi tiết về doanh thu, tốc độ bán hàng (ít nhất 3 câu).",
  "urgent_import_products": [
    {
      "product_id": "Mã sản phẩm",
      "reason": "Lý do khẩn cấp cần nhập hàng (1-2 câu rõ ràng)"
    }
  ],
  "top_selling_products": [
    {
      "product_id": "Mã sản phẩm",
      "reason": "Lý do bán chạy (1-2 câu)"
    }
  ],
  "slow_moving_products": [
    {
      "product_id": "Mã sản phẩm",
      "reason": "Lý do tồn đọng (1-2 câu)"
    }
  ],
  "category_insights": [
    {
      "category_name": "Tên danh mục",
      "comment": "Nhận xét về danh mục"
    }
  ],
  "supplier_insights": [
    {
      "supplier_name": "Tên nhà cung cấp",
      "comment": "Nhận xét về nhà cung cấp"
    }
  ],
  "recommended_actions": [
    {
      "label": "Hành động cần làm",
      "description": "Mô tả chi tiết hành động"
    }
  ]
}

- Độ dài: overview_comment (3-5 câu), inventory_comment (3 câu), sales_comment (3 câu), reason cho mỗi SP (1-2 câu).
- recommended_actions phải có tối thiểu 3 hành động thực tiễn.
- Phân tích bằng TIẾNG VIỆT, dựa trên dữ liệu thật. Tuyệt đối KHÔNG tự tính toán lại tồn kho, dự báo, số lượng nhập hay bịa sản phẩm ngoài input.
- KHÔNG thay đổi product_id. Chỉ sử dụng đúng product_id (chuỗi nguyên bản) có trong dữ liệu đầu vào.
- Số ngày dự báo mục tiêu: ${forecastDays} ngày.
`;

    const userPrompt = `Dữ liệu tồn kho hiện tại (Top ${topProducts.length} sản phẩm ưu tiên):
${JSON.stringify(topProducts.map(p => ({
  product_id: p.product_id,
  product_name: p.product_name,
  stock_quantity: p.stock_quantity,
  reorder_level: p.reorder_level,
  sales_90d: p.sales_90d,
  avg_daily_sales: p.avg_daily_sales_90d,
  baseline_suggested_quantity: p.suggested_import_quantity
})), null, 2)}`;

    try {
      const result = await model.generateContent([
        { text: systemPrompt },
        { text: userPrompt }
      ]);
      const response = await result.response;
      let text = response.text();
      
      // Strip markdown code block if model still outputs it despite responseMimeType
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      
      return JSON.parse(text);
    } catch (error) {
      throw new Error(`AI Analysis failed: ${error.message}`);
    }
  }
}

module.exports = new GeminiAIService();
