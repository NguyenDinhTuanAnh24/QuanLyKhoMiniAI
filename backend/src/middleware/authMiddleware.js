const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập hoặc token không hợp lệ' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Không tìm thấy token' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ' });
  }
};

module.exports = { authMiddleware };
