import api from './api';

export const createMovement = async (data) => {
  try {
    const response = await api.post('/inventory/movements', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMovements = async (params) => {
  try {
    const response = await api.get('/inventory/movements', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getImportPlan = async (id) => {
  try {
    const response = await api.get(`/inventory/import-plans/${id}`);
    return response.data?.data || response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
