const UserRepository = require('../repositories/UserRepository');
const { BusinessException } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');

class UserService {
  async getUsers(filters, page, limit) {
    return await UserRepository.findAndCountAll(filters, page, limit);
  }

  async getUserById(id) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new BusinessException('USER_NOT_FOUND', 'Không tìm thấy người dùng');
    }
    return user;
  }

  async createUser(userData) {
    if (!userData.user_id) {
      userData.user_id = `USR-${Date.now()}`;
    }

    // Check email uniqueness
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new BusinessException('DUPLICATE_EMAIL', 'Email này đã được sử dụng');
    }

    // If a password is provided, hash it; otherwise require a password during creation
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password_hash = await bcrypt.hash(userData.password, salt);
      // Remove plain password to avoid storing it
      delete userData.password;
    } else {
      // Throw an error to enforce password on new accounts
      const { BusinessException } = require('../middleware/errorHandler');
      throw new BusinessException('PASSWORD_REQUIRED', 'Mật khẩu là bắt buộc khi tạo tài khoản mới');
    }

    return await UserRepository.create(userData);
  }

  async updateUser(id, userData) {
    const existingUser = await UserRepository.findById(id);
    if (!existingUser) {
      throw new BusinessException('USER_NOT_FOUND', 'Không tìm thấy người dùng');
    }

    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await UserRepository.findByEmail(userData.email);
      if (emailExists) {
        throw new BusinessException('DUPLICATE_EMAIL', 'Email này đã được sử dụng');
      }
    }

    return await UserRepository.update(id, userData);
  }

  async deleteUser(id) {
    const existingUser = await UserRepository.findById(id);
    if (!existingUser) {
      throw new BusinessException('USER_NOT_FOUND', 'Không tìm thấy người dùng');
    }
    return await UserRepository.softDelete(id);
  }
  
  async updateStatus(id, status) {
    const existingUser = await UserRepository.findById(id);
    if (!existingUser) {
      throw new BusinessException('USER_NOT_FOUND', 'Không tìm thấy người dùng');
    }
    return await UserRepository.update(id, { status });
  }
}

module.exports = new UserService();
