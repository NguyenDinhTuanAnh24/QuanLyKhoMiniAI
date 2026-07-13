import api from './api';

export const reportService = {
  getOverview: async (filters) => {
    const response = await api.get('/reports/overview', { params: filters });
    return response.data?.data || response.data;
  },
  getRevenue: async (filters) => {
    const response = await api.get('/reports/revenue', { params: filters });
    return response.data?.data || response.data;
  },
  getInventory: async (filters) => {
    const response = await api.get('/reports/inventory', { params: filters });
    return response.data?.data || response.data;
  },
  getStockMovements: async (filters) => {
    const response = await api.get('/reports/stock-movements', { params: filters });
    return response.data?.data || response.data;
  },
  getImports: async (filters) => {
    const response = await api.get('/reports/imports', { params: filters });
    return response.data?.data || response.data;
  },
  getTopSelling: async (filters) => {
    const response = await api.get('/reports/top-selling', { params: filters });
    return response.data?.data || response.data;
  },
  getSlowSelling: async (filters) => {
    const response = await api.get('/reports/slow-selling', { params: filters });
    return response.data?.data || response.data;
  }
};
