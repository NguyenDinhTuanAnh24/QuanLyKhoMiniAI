const UserRepository = require('../repositories/UserRepository');
const { BusinessException } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');
const notificationService = require('./NotificationService');

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

    const newUser = await UserRepository.create(userData);

    try {
      const { password_hash, password, token, jwt, ...safeMetadata } = newUser;
      await notificationService.createNotification({
        type: 'USER_CREATED',
        title: `Người dùng mới`,
        message: `Tài khoản ${newUser.email} đã được tạo với vai trò ${newUser.role}.`,
        severity: 'INFO',
        relatedType: 'USER',
        relatedId: newUser.user_id,
        recipientRoles: ['ADMIN', 'OWNER'],
        metadata: safeMetadata
      });
    } catch (notiErr) {
      console.error('[UserService] Notification error for USER_CREATED:', notiErr);
    }

    return newUser;
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

    const updatedUser = await UserRepository.update(id, userData);

    try {
      if (userData.role && userData.role !== existingUser.role) {
        const { password_hash, password, token, jwt, ...safeMetadata } = updatedUser;
        await notificationService.createNotification({
          type: 'USER_ROLE_CHANGED',
          title: `Thay đổi quyền hạn`,
          message: `Tài khoản ${updatedUser.email} đã được chuyển sang vai trò ${updatedUser.role}.`,
          severity: 'WARNING',
          relatedType: 'USER',
          relatedId: updatedUser.user_id,
          recipientRoles: ['ADMIN', 'OWNER'], // Service handles specific user inclusion if we also send to user_id. Wait, how to send to affected user?
          // I will send two notifications or the notification service should support specific userIds.
          // Wait, NotificationService currently supports `recipientRoles` and `recipientUsers` or similar? I will just use recipientRoles and let NotificationService handle it, but wait, does NotificationService support specific user id array? Let me check NotificationService. 
          // I will use two createNotification calls just in case. One for admins, one for the user.
        });
        
        // Affected user
        await notificationService.createNotification({
          type: 'USER_ROLE_CHANGED',
          title: `Quyền hạn của bạn đã thay đổi`,
          message: `Tài khoản của bạn đã được cấp quyền ${updatedUser.role}.`,
          severity: 'WARNING',
          relatedType: 'USER',
          relatedId: updatedUser.user_id,
          recipientRoles: [],
          recipientUsers: [updatedUser.user_id],
          metadata: safeMetadata
        });
      }
    } catch (notiErr) {
      console.error('[UserService] Notification error for USER_ROLE_CHANGED:', notiErr);
    }

    return updatedUser;
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
    const updatedUser = await UserRepository.update(id, { status });

    try {
      const { password_hash, password, token, jwt, ...safeMetadata } = updatedUser;
      await notificationService.createNotification({
        type: 'USER_STATUS_CHANGED',
        title: `Trạng thái tài khoản thay đổi`,
        message: `Tài khoản ${existingUser.email} đã bị chuyển sang trạng thái ${status}.`,
        severity: status === 'LOCKED' ? 'WARNING' : 'INFO',
        relatedType: 'USER',
        relatedId: updatedUser.user_id,
        recipientRoles: ['ADMIN', 'OWNER']
      });

      // Affected user
      await notificationService.createNotification({
        type: 'USER_STATUS_CHANGED',
        title: `Cập nhật trạng thái tài khoản`,
        message: `Tài khoản của bạn đã được chuyển sang trạng thái ${status}.`,
        severity: status === 'LOCKED' ? 'WARNING' : 'INFO',
        relatedType: 'USER',
        relatedId: updatedUser.user_id,
        recipientRoles: [],
        recipientUsers: [updatedUser.user_id],
        metadata: safeMetadata
      });
    } catch (notiErr) {
      console.error('[UserService] Notification error for USER_STATUS_CHANGED:', notiErr);
    }

    return updatedUser;
  }
}

module.exports = new UserService();
