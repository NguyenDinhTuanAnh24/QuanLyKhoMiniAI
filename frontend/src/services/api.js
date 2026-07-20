import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : 'http://localhost:5000/api';

let isHandlingUnauthorized = false;
let isHandlingForbidden = false;

const api = axios.create({
  baseURL,
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
      if (!isHandlingUnauthorized) {
        isHandlingUnauthorized = true;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.response.status === 403) {
      if (!isHandlingForbidden) {
        isHandlingForbidden = true;
        window.dispatchEvent(new CustomEvent('globalToast', {
          detail: {
            type: 'error',
            title: 'Lỗi truy cập',
            message: 'Bạn không có quyền thực hiện thao tác này.'
          }
        }));
        
        setTimeout(() => {
          isHandlingForbidden = false;
        }, 2000);
      }
    }
  }
  return Promise.reject(error);
});

export default api;
