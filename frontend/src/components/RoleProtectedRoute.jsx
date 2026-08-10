import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getUser, getUserRoleCode } from '../services/authService';

export default function RoleProtectedRoute({ children, allowedRoles }) {
  const user = getUser();
  
  const isAllowed = user && (!allowedRoles || allowedRoles.length === 0 || allowedRoles.some(allowed => {
    const allowedCode = getUserRoleCode(allowed);
    return allowed === user.role || allowedCode === user.roleCode || allowed === user.roleCode;
  }));

  useEffect(() => {
    if (user && !isAllowed) {
      window.dispatchEvent(new CustomEvent('globalToast', {
        detail: {
          type: 'error',
          title: 'Từ chối truy cập (403)',
          message: 'Tài khoản của bạn không có quyền truy cập tính năng này.'
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

