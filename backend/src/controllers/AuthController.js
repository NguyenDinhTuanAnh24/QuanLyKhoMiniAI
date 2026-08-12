const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const UserRepository = require('../repositories/UserRepository');

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc')
});

const changePasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  oldPassword: z.string().min(1, 'Mật khẩu cũ là bắt buộc'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự')
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
      if (error instanceof z.ZodError || error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: error.errors?.[0]?.message || 'Dữ liệu không hợp lệ' });
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

  async changePassword(req, res, next) {
    try {
      const { email, oldPassword, newPassword } = changePasswordSchema.parse(req.body);

      if (oldPassword === newPassword) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại' });
      }

      // Tìm user theo email
      const user = await UserRepository.findByEmail(email);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với email này' });
      }

      if (user.status !== 'Đang hoạt động') {
        return res.status(403).json({ success: false, message: 'Tài khoản đã bị khoá, không thể đổi mật khẩu' });
      }

      // Kiểm tra mật khẩu cũ
      let isValid = false;
      if (user.password_hash) {
        isValid = await bcrypt.compare(oldPassword, user.password_hash);
      } else {
        // Mật khẩu mặc định chưa được hash
        isValid = oldPassword === '123456';
      }

      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác' });
      }

      // Hash mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await UserRepository.update(user.user_id, { password_hash: hashedPassword });

      // Log activity
      const ActivityLogService = require('../services/ActivityLogService');
      await ActivityLogService.logActivity({
        user_id: user.user_id,
        user_name: user.full_name,
        action: 'CHANGE_PASSWORD',
        entity_type: 'USER',
        entity_id: user.user_id,
        details: { status: 'Thành công', email }
      });

      res.json({ success: true, message: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: error.errors?.[0]?.message || 'Dữ liệu không hợp lệ' });
      }
      next(error);
    }
  }
}

module.exports = new AuthController();
