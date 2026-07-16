import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getUser } from '../services/authService';

export default function RoleProtectedRoute({ children, allowedRoles }) {
  const user = getUser();
  
  // If no allowedRoles specified, treat it as open to any logged in user
  const isAllowed = user && (!allowedRoles || allowedRoles.length === 0 || allowedRoles.includes(user.role));

  useEffect(() => {
    if (user && !isAllowed) {
      window.dispatchEvent(new CustomEvent('globalToast', {
        detail: {
          type: 'error',
          title: 'Từ chối truy cập',
          message: 'Bạn không có quyền truy cập trang này.'
        }
      }));
    }
  }, [user, isAllowed]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
