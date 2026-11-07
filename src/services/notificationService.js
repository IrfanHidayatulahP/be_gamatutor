const { Notification, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const { sendPushNotification } = require('../config/fcm');

const createNotification = async(data) => {
    const user = await User.findByPk(data.userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const notification = await Notification.create({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        sentAt: data.sentAt,
        delivered: data.delivered || false,
        deliveryError: data.deliveryError,
        scheduledFor: data.scheduledFor,
        reminderReason: data.reminderReason,
        triggerAction: data.triggerAction,
        triggerUserId: data.triggerUserId,
        read: false,
        clicked: false
    });

    // Kirim push notification ke HP pengguna jika user memiliki token FCM 
    if (user.fcmToken) {
        try {
            const fcmResult = await sendPushNotification(
                user.fcmToken,
                data.title || 'Gamatutor',
                data.message, {
                    notificationId: notification.notifId,
                    type: data.type,
                    triggerAction: data.triggerAction || '',
                    triggerUserId: data.triggerUserId || ''
                }
            );

            await notification.update({
                delivered: fcmResult.success,
                deliveryError: fcmResult.success ? null : fcmResult.error,
                sentAt: new Date()
            });
        } catch (fcmError) {
            console.error('FCM error in createNotification:', fcmError.message);
            await notification.update({
                delivered: false,
                deliveryError: fcmError.message
            });
        }
    }

    return notification;
};

const getUserNotifications = async(userId, filters = {}) => {
    const where = { userId };
    if (filters.type) where.type = filters.type;
    if (filters.read !== undefined) where.read = filters.read;
    if (filters.delivered !== undefined) where.delivered = filters.delivered;

    return Notification.findAll({
        where,
        order: [
            ['createdAt', 'DESC']
        ],
        limit: filters.limit || 50,
        offset: filters.offset || 0
    });
};

const getNotificationById = async(id) => {
    const notification = await Notification.findByPk(id, {
        include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }]
    });
    if (!notification) {
        throw new AppError('Notification not found', 404);
    }
    return notification;
};

const markAsRead = async(id) => {
    const notification = await Notification.findByPk(id);
    if (!notification) {
        throw new AppError('Notification not found', 404);
    }
    return notification.update({ read: true, readAt: new Date() });
};

const markAsClicked = async(id) => {
    const notification = await Notification.findByPk(id);
    if (!notification) {
        throw new AppError('Notification not found', 404);
    }
    return notification.update({ clicked: true, clickedAt: new Date() });
};

const markAllAsRead = async(userId) => {
    return Notification.update({ read: true, readAt: new Date() }, { where: { userId, read: false } });
};

const updateNotification = async(id, data) => {
    const notification = await Notification.findByPk(id);
    if (!notification) {
        throw new AppError('Notification not found', 404);
    }
    return notification.update(data);
};

const deleteNotification = async(id) => {
    const notification = await Notification.findByPk(id);
    if (!notification) {
        throw new AppError('Notification not found', 404);
    }
    await notification.destroy();
    return { message: 'Notification deleted' };
};

// Fitur Tindakan Notifikasi Accept/Decline
const handleNotificationAction = async(id, action, userId) => {
    const notification = await Notification.findByPk(id);
    if (!notification) {
        throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
        throw new AppError('Not authorized', 403);
    }

    if (action === 'accept' || action === 'decline') {
        await notification.update({ read: true, clicked: true, clickedAt: new Date() });
        return {
            message: action === 'accept' ? 'Invitation accepted successfully' : 'Invitation declined successfully',
            notification
        };
    }

    throw new AppError('Invalid action type', 400);
};

// Fitur Pengelolaan Token FCM Mobile 
const updateFcmToken = async(userId, fcmToken) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    return user.update({ fcmToken });
};

const sendTestPush = async(userId, title, body, triggerAction) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (!user.fcmToken) {
        throw new AppError('User does not have FCM token registered', 400);
    }

    const result = await sendPushNotification(
        user.fcmToken,
        title || 'Test Notification',
        body || 'This is a test push notification', {
            type: 'test',
            triggerAction: triggerAction || 'friend_request_received',
            triggerUserId: userId,
        }
    );

    return result;
};

const sendPushToUser = async(userId, title, body, data = {}) => {
    const user = await User.findByPk(userId);
    if (!user || !user.fcmToken) {
        return { success: false, reason: 'User not found or no FCM token' };
    }

    return sendPushNotification(user.fcmToken, title, body, data);
};

module.exports = {
    createNotification,
    getUserNotifications,
    getNotificationById,
    markAsRead,
    markAsClicked,
    markAllAsRead,
    updateNotification,
    deleteNotification,
    handleNotificationAction,
    updateFcmToken,
    sendTestPush,
    sendPushToUser,
};