import api from './api';

export const normalizeForecastItem = (item = {}) => ({
  ...item,
  product_id: item.product_id ?? item.id ?? null,
  product_name: item.product_name ?? item.name ?? 'Không xác định',
  stock_quantity: Number(item.stock_quantity ?? item.current_stock ?? item.stock ?? 0),
  reorder_level: Number(item.reorder_level ?? item.minimum_stock ?? item.min_stock ?? 0),
  sales_90d: Number(item.sales_90d ?? item.total_sales ?? 0),
  avg_daily_sales_90d: Number(item.avg_daily_sales_90d ?? item.avg_daily_sales ?? 0),
  forecast_quantity: Number(item.forecast_quantity ?? item.forecast_14d ?? item.predicted_demand ?? item.forecast ?? 0),
  suggested_import_quantity: Number(item.suggested_import_quantity ?? item.suggested_quantity ?? item.quantity_to_import ?? 0),
  reason: item.reason ?? item.comment ?? ''
});

export const getAISettings = async () => {
  try {
    const response = await api.get('/ai/settings');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    throw error;
  }
};

export const updateAISettings = async (payload) => {
  try {
    const response = await api.put('/ai/settings', payload);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error updating AI settings:', error);
    throw error;
  }
};

export const getAIForecast = async (params = {}) => {
  try {
    const response = await api.get('/ai/forecast', { params });
    const data = response.data?.data || null;
    if (data && data.items && Array.isArray(data.items)) {
      data.items = data.items.map(normalizeForecastItem);
    } else if (Array.isArray(data)) {
      return data.map(normalizeForecastItem);
    }
    return data;
  } catch (error) {
    console.error('Error fetching AI forecast:', error);
    throw error;
  }
};

export const runAIAnalysis = async (settings = {}) => {
  try {
    const response = await api.post('/ai/analyze', { settings });
    return response.data?.data || null;
  } catch (error) {
    console.error('Error running AI analysis:', error);
    throw error;
  }
};

export const getAIRecommendations = async () => {
  try {
    const response = await api.get('/ai/recommendations');
    const data = response.data?.data || null;
    if (data && data.recommendations && Array.isArray(data.recommendations)) {
      data.recommendations = data.recommendations.map(normalizeForecastItem);
    }
    return data;
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    throw error;
  }
};

export const applyAIRecommendation = async (id) => {
  try {
    const response = await api.post(`/ai/recommendations/${id}/apply`);
    return response.data;
  } catch (error) {
    console.error('Error applying AI recommendation:', error);
    throw error;
  }
};

export const ignoreAIRecommendation = async (id) => {
  try {
    const response = await api.post(`/ai/recommendations/${id}/ignore`);
    return response.data;
  } catch (error) {
    console.error('Error ignoring AI recommendation:', error);
    throw error;
  }
};

export const testAIConnection = async () => {
  try {
    const response = await api.post('/ai/test-connection');
    return response.data;
  } catch (error) {
    console.error('Error testing AI connection:', error);
    throw error;
  }
};
