import api from './api';

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
    return response.data?.data || null;
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
    return response.data?.data || null;
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
