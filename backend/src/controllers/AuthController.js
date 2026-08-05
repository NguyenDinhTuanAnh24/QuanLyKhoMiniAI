const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const UserRepository = require('../repositories/UserRepository');

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc')
});

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Tìm user theo email
      const user = await UserRepository.findByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
      }

      if (user.status !== 'Đang hoạt động') {
        return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khoá hoặc ngưng hoạt động' });
      }

      let isValidPassword = false;

      // Xử lý tài khoản cũ chưa có password_hash
      if (!user.password_hash) {
        if (password === '123456') {
          // Hash và cập nhật mật khẩu mặc định
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          await UserRepository.update(user.user_id, { password_hash: hashedPassword });
          isValidPassword = true;
        } else {
          return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
        }
      } else {
        // So sánh mật khẩu bằng bcrypt
        isValidPassword = await bcrypt.compare(password, user.password_hash);
      }

      if (!isValidPassword) {
        return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
      }

      // Tạo JWT Token
      const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';
      const token = jwt.sign(
        { user_id: user.user_id, email: user.email, role: user.role, full_name: user.full_name },
        JWT_SECRET,
        { expiresIn: '7d' } // Token sống 7 ngày
      );

      // Xóa password_hash trước khi trả về
      delete user.password_hash;

      // Log activity
      const ActivityLogService = require('../services/ActivityLogService');
      await ActivityLogService.logActivity({
        user_id: user.user_id,
        user_name: user.full_name,
        action: 'LOGIN',
        entity_type: 'USER',
        entity_id: user.user_id,
        details: { role: (typeof user !== 'undefined' ? user.role : (req.user ? req.user.role : 'UNKNOWN')), status: 'Thành công', email: user.email }
      });

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          token,
          user
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: error.errors[0].message });
      }
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      if (req.user) {
        const ActivityLogService = require('../services/ActivityLogService');
        await ActivityLogService.logActivity({
          user_id: req.user.user_id,
          user_name: req.user.full_name,
          action: 'LOGOUT',
          entity_type: 'USER',
          entity_id: req.user.user_id,
          details: { role: (typeof user !== 'undefined' ? user.role : (req.user ? req.user.role : 'UNKNOWN')), status: 'Thành công', message: 'User logged out' }
        });
      }
      res.json({ success: true, message: 'Đăng xuất thành công' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
