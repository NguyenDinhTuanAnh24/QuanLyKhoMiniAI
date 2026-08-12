const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAIService {
  /**
   * Phân tích dữ liệu tồn kho bằng AI
   * @param {Array} baselineData Dữ liệu base đã được tính toán rule-based
   * @param {string} modelName Tên model (mặc định gemini-2.5-flash)
   * @param {number} forecastDays Số ngày dự báo
   * @returns {Object} Kết quả parse JSON từ AI
   */
  async analyzeInventory(baselineData, modelName = 'gemini-2.5-flash', forecastDays = 14, supplierInsights = []) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Lọc theo các tiêu chí khẩn cấp, bán chạy và tồn đọng để giới hạn token (Khoảng 20-30 sản phẩm)
    const topUrgent = baselineData
      .filter(p => p.priority === 'CRITICAL' || p.priority === 'HIGH' || p.suggested_import_quantity > 0)
      .sort((a, b) => b.suggested_import_quantity - a.suggested_import_quantity)
      .slice(0, 20);

    const topSelling = baselineData
      .filter(p => p.avg_daily_sales > 0 && !topUrgent.find(u => u.product_id === p.product_id))
      .sort((a, b) => b.avg_daily_sales - a.avg_daily_sales)
      .slice(0, 10);

    const slowMoving = baselineData
      .filter(p => p.avg_daily_sales < 0.2 && p.stock_quantity > 0 && !topUrgent.find(u => u.product_id === p.product_id) && !topSelling.find(s => s.product_id === p.product_id))
      .sort((a, b) => b.stock_quantity - a.stock_quantity)
      .slice(0, 10);

    const targetProducts = [...topUrgent, ...topSelling, ...slowMoving];

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: { responseMimeType: "application/json" }
    });

const systemPrompt = `Bạn là trợ lý phân tích tồn kho chuyên nghiệp cho hệ thống Smart Retail Inventory AI.
Dữ liệu dưới đây là lịch sử bán hàng và thông tin tồn kho của các sản phẩm. Dữ liệu này là nguồn sự thật, tuyệt đối KHÔNG tự thay đổi các thông số (tồn kho, dự báo, tốc độ bán, mức an toàn, số lượng cần nhập).
Nhiệm vụ của bạn là phân tích và trả về ĐÚNG MỘT OBJECT JSON THEO SCHEMA YÊU CẦU, không giải thích gì thêm, không bọc markdown.

JSON Schema mong muốn:
{
  "executive_summary": {
    "status": "STABLE|WARNING|CRITICAL",
    "overview": "Đoạn tổng quan 2-3 câu.",
    "key_findings": ["...", "...", "..."],
    "risks": ["...", "...", "..."],
    "opportunities": ["...", "..."],
    "recommended_actions": [
      {
        "priority": "HIGH|MEDIUM|LOW",
        "title": "Tên hành động",
        "description": "Mô tả chi tiết hành động"
      }
    ]
  },
  "urgent_products": [
    {
      "product_id": "Mã sản phẩm",
      "reason": "Lý do khẩn cấp cần nhập (1-2 câu)"
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
      "comment": "Nhận xét về danh mục (1-2 câu)"
    }
  ],
  "supplier_insights": [
    {
      "supplier_id": "uuid (hoặc null)",
      "insights": [
        "Nhận xét 1",
        "Nhận xét 2"
      ],
      "recommendations": [
        "Khuyến nghị 1",
        "Khuyến nghị 2"
      ]
    }
  ],
  "forecast_products": []
}

YÊU CẦU BẮT BUỘC:
- Viết bằng tiếng Việt tự nhiên, chuẩn văn phong nghiệp vụ (ví dụ: "Hệ thống ghi nhận...", "Trong 90 ngày gần đây..."). Tuyệt đối KHÔNG dùng các cụm từ "Theo AI...", "AI nghĩ rằng...", "Có vẻ như...".
- Các câu văn cần ngắn gọn, rõ ràng, không lặp lại số liệu, không dài lan man.
- Phân biệt rõ số lượng "mặt hàng" (SKU, loại sản phẩm) và số "đơn vị" (tổng số lượng chiếc/cái). Ví dụ: "Đề xuất nhập thêm 2109 đơn vị cho 10 mặt hàng".
- overview: Tối đa 2-4 câu. Trả lời được tình hình tồn kho, xu hướng, rủi ro chính. Phải dựa vào số liệu thật.
- key_findings: Tối đa 3-5 bullet. Mỗi bullet 1-2 câu. Phải là dạng mảng chuỗi (array of strings).
- risks: Tối đa 3-4 bullet rủi ro. Phải là dạng mảng chuỗi.
- opportunities: Tối đa 2-4 bullet cơ hội. Phải là dạng mảng chuỗi.
- recommended_actions: Tối đa 5 hành động. Không viết paragraph dài.
- Các insight sản phẩm (reason/comment) tối đa 1-2 câu.
- KHÔNG thay đổi product_id.
- Phân tích dựa trên số ngày dự báo mục tiêu: ${forecastDays} ngày.
- Dữ liệu nhà cung cấp đã được hệ thống tổng hợp.
- Không được tạo tên nhà cung cấp mới.
- Không sử dụng cụm 'Đa nhà cung cấp' nếu không có entity đó trong dữ liệu.
- Mỗi nhận xét phải gắn với supplier_id được cung cấp. Nếu không có supplier_id, dùng ID "UNKNOWN".
- Nếu supplier_name là 'Chưa xác định nhà cung cấp', hãy khuyến nghị cập nhật dữ liệu nhà cung cấp.
`;

    const userPrompt = `Dữ liệu tồn kho hiện tại (${targetProducts.length} sản phẩm đáng chú ý):
${JSON.stringify(targetProducts.map(p => ({
  product_id: p.product_id,
  product_name: p.product_name,
  category_name: p.category_name,
  supplier_name: p.supplier_name,
  stock_quantity: p.stock_quantity,
  reorder_level: p.reorder_level,
  sales_90d: p.sales_90d,
  avg_daily_sales: p.avg_daily_sales_90d,
  suggested_import_quantity: p.suggested_import_quantity,
  priority: p.priority
})), null, 2)}

Dữ liệu tổng hợp theo nhà cung cấp:
${JSON.stringify(supplierInsights, null, 2)}`;

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
