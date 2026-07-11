const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, code: 'UNAUTHENTICATED', message: 'Bạn cần đăng nhập để sử dụng chức năng này.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' });
    }

    next();
  };
};

const authorizePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, code: 'UNAUTHENTICATED', message: 'Bạn cần đăng nhập để sử dụng chức năng này.' });
    }

    if (!req.user.permissions || !req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' });
    }

    next();
  };
};

module.exports = { authorizeRoles, authorizePermission };
