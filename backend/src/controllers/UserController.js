const UserService = require('../services/UserService');
const { z } = require('zod');
const ActivityLogService = require('../services/ActivityLogService');

const userSchema = z.object({
  user_id: z.string().optional(),
  full_name: z.string().min(1, 'Họ và tên là bắt buộc'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional().nullable(),
  role: z.string().min(1, 'Vai trò là bắt buộc'),
  status: z.string().default('Đang hoạt động')
});

const userUpdateSchema = userSchema.partial();
const statusUpdateSchema = z.object({
  status: z.string().min(1, 'Trạng thái là bắt buộc')
});

class UserController {
  async getMe(req, res, next) {
    try {
      const user = await UserService.getUserById(req.user.user_id);
      if (user) {
        res.json({ success: true, data: user });
      } else {
        res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
      }
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req, res, next) {
    try {
      const validatedData = userUpdateSchema.parse(req.body);
      const user = await UserService.updateUser(req.user.user_id, validatedData);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateMyPassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới' });
      }
      
      const user = await UserService.getUserById(req.user.user_id);
      const bcrypt = require('bcryptjs');
      const isValid = await bcrypt.compare(oldPassword, user.password_hash);
      
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác' });
      }
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await UserService.updateUser(req.user.user_id, { password_hash: hashedPassword });
      
      res.json({
        success: true,
        message: "Cập nhật mật khẩu thành công."
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const { search, role, status, page = 1, limit = 10 } = req.query;
      const filters = { search, role, status };
      
      const { data, count } = await UserService.getUsers(filters, parseInt(page), parseInt(limit));
      
      res.json({
        success: true,
        data,
        meta: {
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await UserService.getUserById(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const validatedData = userSchema.parse(req.body);
      const user = await UserService.createUser(validatedData);
      
      await ActivityLogService.logActivity({
        user_id: req.user.user_id,
        user_name: req.user.full_name,
        action: 'CREATE_USER',
        entity_type: 'USER',
        entity_id: user.user_id,
        details: validatedData
      });
      
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const validatedData = userUpdateSchema.parse(req.body);
      const user = await UserService.updateUser(req.params.id, validatedData);
      
      await ActivityLogService.logActivity({
        user_id: req.user.user_id,
        user_name: req.user.full_name,
        action: 'UPDATE_USER',
        entity_type: 'USER',
        entity_id: req.params.id,
        details: validatedData
      });
      
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await UserService.deleteUser(req.params.id);
      
      await ActivityLogService.logActivity({
        user_id: req.user.user_id,
        user_name: req.user.full_name,
        action: 'DELETE_USER',
        entity_type: 'USER',
        entity_id: req.params.id,
        details: { role: req.user.role, status: 'Thành công', user_id: req.params.id }
      });
      
      res.json({ success: true, message: 'Đã xóa người dùng thành công' });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = statusUpdateSchema.parse(req.body);
      const user = await UserService.updateStatus(req.params.id, status);
      
      await ActivityLogService.logActivity({
        user_id: req.user.user_id,
        user_name: req.user.full_name,
        action: 'UPDATE_USER',
        entity_type: 'USER',
        entity_id: req.params.id,
        details: { role: req.user.role, status: 'Thành công', status }
      });
      
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
