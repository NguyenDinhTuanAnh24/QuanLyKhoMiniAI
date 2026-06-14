import api from './api';

export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const getRecentOrders = async (limit = 10) => {
  const response = await api.get(`/orders?limit=${limit}`);
  return response.data;
};

export const createPayosPayment = async (orderData) => {
  const response = await api.post('/payments/payos/create', orderData);
  return response.data;
};

export const getOrderPaymentStatus = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/payment-status`);
  return response.data;
};
