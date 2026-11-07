const { User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const getAllUsers = async(filters = {}) => {
    const where = {};
    if (filters.role) where.role = filters.role;
    if (filters.status) where.status = filters.status;

    return User.findAll({
        where,
        attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] },
        order: [
            ['createdAt', 'DESC']
        ]
    });
};

const getUserById = async(id) => {
    const user = await User.findByPk(id, {
        attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] }
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return user;
};

const updateUser = async(id, data) => {
    const user = await User.findByPk(id);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Prevent updating sensitive fields
    const { password, resetToken, resetTokenExpiry, userId, createdAt, ...allowedData } = data;

    // If email is being updated, check for uniqueness
    if (allowedData.email && allowedData.email !== user.email) {
        const existingUser = await User.findOne({ where: { email: allowedData.email } });
        if (existingUser) {
            throw new AppError('Email already in use', 400);
        }
    }

    // If username is being updated, check for uniqueness
    if (allowedData.username && allowedData.username !== user.username) {
        const existingUser = await User.findOne({ where: { username: allowedData.username } });
        if (existingUser) {
            throw new AppError('Username already in use', 400);
        }
    }

    return user.update(allowedData);
};

const updateUserStatus = async(id, status) => {
    const user = await User.findByPk(id);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (!['online', 'offline'].includes(status)) {
        throw new AppError('Invalid status. Must be online or offline', 400);
    }

    return user.update({ status });
};

const deleteUser = async(id) => {
    const user = await User.findByPk(id);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    await user.destroy();
    return { message: 'User deleted successfully' };
};

const searchUsersByEmail = async(email) => {
    return User.findAll({
        where: {
            email: {
                [Op.iLike]: `%${email}%`
            }
        },
        attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] },
        limit: 10
    });
};

const registerFcmTokenService = async(userId, fcmToken, platform) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    await user.update({ fcmToken, fcmPlatform: platform });
};

const unregisterFcmTokenService = async(userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    await user.update({ fcmToken: null, fcmPlatform: null });
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    updateUserStatus,
    deleteUser,
    searchUsersByEmail,
    registerFcmTokenService,
    unregisterFcmTokenService
};