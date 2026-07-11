import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => response, (error) => {
  if (error.response && !error.config.url.includes('/auth/login')) {
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response.status === 403) {
      window.dispatchEvent(new CustomEvent('globalToast', {
        detail: {
          type: 'error',
          title: 'Lỗi truy cập',
          message: 'Bạn không có quyền thực hiện thao tác này.'
        }
      }));
    }
  }
  return Promise.reject(error);
});

export default api;
