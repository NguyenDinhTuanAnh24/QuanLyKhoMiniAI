import api from './api';

export const activityLogService = {
  getLogs: async (params = {}) => {
    try {
      const response = await api.get('/activity-logs', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
