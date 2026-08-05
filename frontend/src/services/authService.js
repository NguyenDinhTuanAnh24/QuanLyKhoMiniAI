import api from './api';

export const logout = async () => {
  try {
    // Gọi API logout để backend ghi log
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage items related to auth
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Xóa Authorization header mặc định của Axios
    delete api.defaults.headers.common['Authorization'];
  }
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};
