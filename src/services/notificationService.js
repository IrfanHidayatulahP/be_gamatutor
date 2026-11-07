// const { Notification, User } = require('../models');
// const { AppError } = require('../middleware/errorHandler');
// const { Op } = require('sequelize');

// const createNotification = async (data) => {
//   const user = await User.findByPk(data.userId);
//   if (!user) {
//     throw new AppError('User not found', 404);
//   }

//   return Notification.create({
//     userId: data.userId,
//     type: data.type,
//     title: data.title,
//     message: data.message,
//     sentAt: data.sentAt,
//     delivered: data.delivered || false,
//     deliveryError: data.deliveryError,
//     scheduledFor: data.scheduledFor,
//     reminderReason: data.reminderReason,
//     triggerAction: data.triggerAction,
//     triggerUserId: data.triggerUserId,
//     read: false,
//     clicked: false
//   });
// };

// const getUserNotifications = async (userId, filters = {}) => {
//   const where = { userId };
//   if (filters.type) where.type = filters.type;
//   if (filters.read !== undefined) where.read = filters.read;
//   if (filters.delivered !== undefined) where.delivered = filters.delivered;

//   return Notification.findAll({
//     where,
//     order: [['createdAt', 'DESC']],
//     limit: filters.limit || 50,
//     offset: filters.offset || 0
//   });
// };

// const getNotificationById = async (id) => {
//   const notification = await Notification.findByPk(id, {
//     include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }]
//   });
//   if (!notification) {
//     throw new AppError('Notification not found', 404);
//   }
//   return notification;
// };

// const markAsRead = async (id) => {
//   const notification = await Notification.findByPk(id);
//   if (!notification) {
//     throw new AppError('Notification not found', 404);
//   }
//   return notification.update({ read: true, readAt: new Date() });
// };

// const markAsClicked = async (id) => {
//   const notification = await Notification.findByPk(id);
//   if (!notification) {
//     throw new AppError('Notification not found', 404);
//   }
//   return notification.update({ clicked: true, clickedAt: new Date() });
// };

// const markAllAsRead = async (userId) => {
//   return Notification.update(
//     { read: true, readAt: new Date() },
//     { where: { userId, read: false } }
//   );
// };

// const updateNotification = async (id, data) => {
//   const notification = await Notification.findByPk(id);
//   if (!notification) {
//     throw new AppError('Notification not found', 404);
//   }
//   return notification.update(data);
// };

// const deleteNotification = async (id) => {
//   const notification = await Notification.findByPk(id);
//   if (!notification) {
//     throw new AppError('Notification not found', 404);
//   }
//   await notification.destroy();
//   return { message: 'Notification deleted' };
// };

// module.exports = {
//   createNotification,
//   getUserNotifications,
//   getNotificationById,
//   markAsRead,
//   markAsClicked,
//   markAllAsRead,
//   updateNotification,
//   deleteNotification
// };

const { Notification, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const createNotification = async (data) => {
  const user = await User.findByPk(data.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return Notification.create({
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
};

const getUserNotifications = async (userId, filters = {}) => {
  const where = { userId };
  if (filters.type) where.type = filters.type;
  if (filters.read !== undefined) where.read = filters.read;
  if (filters.delivered !== undefined) where.delivered = filters.delivered;

  return Notification.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getNotificationById = async (id) => {
  const notification = await Notification.findByPk(id, {
    include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }]
  });
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }
  return notification;
};

const markAsRead = async (id) => {
  const notification = await Notification.findByPk(id);
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }
  return notification.update({ read: true, readAt: new Date() });
};

const markAsClicked = async (id) => {
  const notification = await Notification.findByPk(id);
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }
  return notification.update({ clicked: true, clickedAt: new Date() });
};

const markAllAsRead = async (userId) => {
  return Notification.update(
    { read: true, readAt: new Date() },
    { where: { userId, read: false } }
  );
};

const updateNotification = async (id, data) => {
  const notification = await Notification.findByPk(id);
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }
  return notification.update(data);
};

const deleteNotification = async (id) => {
  const notification = await Notification.findByPk(id);
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }
  await notification.destroy();
  return { message: 'Notification deleted' };
};

const handleNotificationAction = async (id, action, userId) => {
  const notification = await Notification.findByPk(id);
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.userId !== userId) {
    throw new AppError('Not authorized', 403);
  }

  if (action === 'accept') {
    await notification.update({ read: true, clicked: true, clickedAt: new Date() });
    return { message: 'Invitation accepted successfully', notification };
  } else if (action === 'decline') {
    await notification.update({ read: true, clicked: true, clickedAt: new Date() });
    return { message: 'Invitation declined successfully', notification };
  }

  throw new AppError('Invalid action type', 400);
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
  handleNotificationAction
};