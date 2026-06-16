import api from './api';

export const getAIForecast = async (params = {}) => {
  try {
    const response = await api.get("/ai/forecast", { params });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching AI forecast:', error);
    // Return empty safe structure on error
    return {
      summary: {
        total_products: 0,
        risk_products: 0,
        total_suggested_import: 0,
        estimated_import_value: 0,
        avg_confidence: 0
      },
      insight: {
        title: 'Không thể tải dữ liệu AI',
        message: 'Vui lòng kiểm tra kết nối hoặc thử lại sau.'
      },
      items: []
    };
  }
};

export const recalculateForecast = async () => {
  try {
    const response = await api.post("/ai/forecast/recalculate");
    return response.data;
  } catch (error) {
    console.error('Error recalculating forecast:', error);
    throw error;
  }
};
