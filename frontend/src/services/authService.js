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

export const getDecodedTokenPayload = () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const isAuthenticated = () => {
  const payload = getDecodedTokenPayload();
  if (!payload) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return false;
  }
  
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return false;
  }
  return true;
};

export const ROLE_MAP = {
  'Quản trị viên': 'ADMIN',
  'Chủ cửa hàng': 'OWNER',
  'Nhân viên kho': 'WAREHOUSE_STAFF',
  'Nhân viên bán hàng': 'SALES_STAFF',
  'ADMIN': 'ADMIN',
  'OWNER': 'OWNER',
  'WAREHOUSE_STAFF': 'WAREHOUSE_STAFF',
  'SALES_STAFF': 'SALES_STAFF'
};

export const getUserRoleCode = (roleString) => {
  if (!roleString) return null;
  return ROLE_MAP[roleString] || roleString;
};

export const getUser = () => {
  const payload = getDecodedTokenPayload();
  const userStr = localStorage.getItem('user');
  let userFromStorage = null;
  try {
    userFromStorage = userStr ? JSON.parse(userStr) : null;
  } catch {
    userFromStorage = null;
  }

  if (!payload && !userFromStorage) return null;

  const rawRole = payload?.role || userFromStorage?.role || '';
  const roleCode = getUserRoleCode(rawRole);

  return {
    ...userFromStorage,
    user_id: payload?.user_id || userFromStorage?.user_id,
    email: payload?.email || userFromStorage?.email,
    full_name: payload?.full_name || userFromStorage?.full_name,
    role: rawRole,
    roleCode: roleCode
  };
};

