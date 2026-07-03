const UserService = require('../services/UserService');
const { z } = require('zod');

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
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const validatedData = userUpdateSchema.parse(req.body);
      const user = await UserService.updateUser(req.params.id, validatedData);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await UserService.deleteUser(req.params.id);
      res.json({ success: true, message: 'Đã xóa người dùng thành công' });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = statusUpdateSchema.parse(req.body);
      const user = await UserService.updateStatus(req.params.id, status);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
