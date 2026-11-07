// const { UserActivityLog, User } = require('../models');
// const { AppError } = require('../middleware/errorHandler');
// const { Op } = require('sequelize');

// const createActivityLog = async (userId, data) => {
//   const user = await User.findByPk(userId);
//   if (!user) {
//     throw new AppError('User not found', 404);
//   }

//   return UserActivityLog.create({
//     userId,
//     ...data
//   });
// };

// const getAllActivityLogs = async (filters = {}) => {
//   const where = {};
//   if (filters.userId) where.userId = filters.userId;
//   if (filters.activityType) where.activityType = filters.activityType;
//   if (filters.refId) where.refId = filters.refId;

//   return UserActivityLog.findAll({
//     where,
//     include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }],
//     order: [['createdAt', 'DESC']],
//     limit: filters.limit || 100,
//     offset: filters.offset || 0
//   });
// };

// const getActivityLogById = async (id) => {
//   const log = await UserActivityLog.findByPk(id, {
//     include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }]
//   });
//   if (!log) {
//     throw new AppError('Activity log not found', 404);
//   }
//   return log;
// };


// const getActivityLogsByUser = async (userId, filters = {}) => {
//   const where = { userId };
//   if (filters.activityType) where.activityType = filters.activityType;

//   return UserActivityLog.findAll({
//     where,
//     include: [
//       { 
//         model: User, 
//         as: 'user', 
//         attributes: ['userId', 'firstName', 'lastName', 'username'] 
//       }
//     ],
//     order: [['createdAt', 'DESC']],
//     limit: filters.limit || 100,
//     offset: filters.offset || 0
//   });
// };

// const getActivityLogsByType = async (activityType, filters = {}) => {
//   const where = { activityType };
//   if (filters.userId) where.userId = filters.userId;

//   return UserActivityLog.findAll({
//     where,
//     order: [['createdAt', 'DESC']],
//     limit: filters.limit || 100,
//     offset: filters.offset || 0
//   });
// };

// const deleteActivityLog = async (id) => {
//   const log = await UserActivityLog.findByPk(id);
//   if (!log) {
//     throw new AppError('Activity log not found', 404);
//   }
//   await log.destroy();
//   return { message: 'Activity log deleted' };
// };

// module.exports = {
//   createActivityLog,
//   getAllActivityLogs,
//   getActivityLogById,
//   getActivityLogsByUser,
//   getActivityLogsByType,
//   deleteActivityLog
// };

const { UserActivityLog, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const createActivityLog = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);
  return UserActivityLog.create({ userId, ...data });
};

const getAllActivityLogs = async (filters = {}) => {
  const where = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.activityType) where.activityType = filters.activityType;
  if (filters.refId) where.refId = filters.refId;

  return UserActivityLog.findAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }],
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 100,
    offset: filters.offset || 0
  });
};

const getActivityLogById = async (id) => {
  const log = await UserActivityLog.findByPk(id, {
    include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }]
  });
  if (!log) throw new AppError('Activity log not found', 404);
  return log;
};

const getActivityLogsByUser = async (userId, filters = {}) => {
  const where = { userId };
  if (filters.activityType) where.activityType = filters.activityType;

  // 👇 PASTIKAN INCLUDE USER ADA DI SINI
  return UserActivityLog.findAll({
    where,
    include: [{ 
      model: User, 
      as: 'user', 
      attributes: ['userId', 'firstName', 'lastName', 'username'] 
    }],
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 100,
    offset: filters.offset || 0
  });
};

const getActivityLogsByType = async (activityType, filters = {}) => {
  const where = { activityType };
  if (filters.userId) where.userId = filters.userId;

  return UserActivityLog.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 100,
    offset: filters.offset || 0
  });
};

const deleteActivityLog = async (id) => {
  const log = await UserActivityLog.findByPk(id);
  if (!log) throw new AppError('Activity log not found', 404);
  await log.destroy();
  return { message: 'Activity log deleted' };
};

module.exports = {
  createActivityLog,
  getAllActivityLogs,
  getActivityLogById,
  getActivityLogsByUser,
  getActivityLogsByType,
  deleteActivityLog
};