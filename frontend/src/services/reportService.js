import axios from 'axios';

const API_URL = 'http://localhost:5000/api/reports';

export const reportService = {
  getOverview: async (filters) => {
    const response = await axios.get(`${API_URL}/overview`, { params: filters });
    return response.data;
  },
  getRevenue: async (filters) => {
    const response = await axios.get(`${API_URL}/revenue`, { params: filters });
    return response.data;
  },
  getInventory: async (filters) => {
    const response = await axios.get(`${API_URL}/inventory`, { params: filters });
    return response.data;
  },
  getStockMovements: async (filters) => {
    const response = await axios.get(`${API_URL}/stock-movements`, { params: filters });
    return response.data;
  },
  getImports: async (filters) => {
    const response = await axios.get(`${API_URL}/imports`, { params: filters });
    return response.data;
  },
  getTopSelling: async (filters) => {
    const response = await axios.get(`${API_URL}/top-selling`, { params: filters });
    return response.data;
  },
  getSlowSelling: async (filters) => {
    const response = await axios.get(`${API_URL}/slow-selling`, { params: filters });
    return response.data;
  }
};
