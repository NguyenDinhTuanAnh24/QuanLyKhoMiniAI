import api from './api';

export const getDashboardOverview = async () => {
  const response = await api.get('/dashboard/overview');
  return response.data?.data || response.data;
};

export default {
  getDashboardOverview,
};
