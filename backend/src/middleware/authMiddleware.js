const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const { normalizeRole, ROLE_PERMISSIONS } = require('../config/permissions');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, code: 'UNAUTHENTICATED', message: 'Bạn cần đăng nhập để sử dụng chức năng này.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, code: 'UNAUTHENTICATED', message: 'Bạn cần đăng nhập để sử dụng chức năng này.' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user in real-time
    const user = await UserRepository.findById(decoded.user_id);
    if (!user) {
      return res.status(401).json({ success: false, code: 'UNAUTHENTICATED', message: 'Bạn cần đăng nhập để sử dụng chức năng này.' });
    }
    
    if (user.status !== 'Đang hoạt động') {
      return res.status(403).json({ success: false, code: 'ACCOUNT_LOCKED', message: 'Tài khoản đã bị khóa.' });
    }

    // Normalize role and assign permissions
    const roleCode = normalizeRole(user.role);

    req.user = {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      role: roleCode,
      permissions: ROLE_PERMISSIONS[roleCode] || [],
      status: user.status
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, code: 'UNAUTHENTICATED', message: 'Bạn cần đăng nhập để sử dụng chức năng này.' });
  }
};

module.exports = { authMiddleware };
