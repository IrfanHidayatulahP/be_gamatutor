const { Chat, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const createChat = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const friend = await User.findByPk(data.friendId);
  if (!friend) {
    throw new AppError('Friend not found', 404);
  }

  return Chat.create({
    userId,
    friendId: data.friendId,
    messageChat: data.messageChat,
    status: data.status || 'delivered'
  });
};

const getAllChats = async (filters = {}) => {
  const where = {};
  if (filters.userId) where.userId = filters.userId;

  return Chat.findAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: User, as: 'recipient', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ],
    order: [['timeChat', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getChatById = async (id) => {
  const chat = await Chat.findByPk(id, {
    include: [
      { model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: User, as: 'recipient', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ]
  });
  if (!chat) {
    throw new AppError('Chat not found', 404);
  }
  return chat;
};

const getChatsByUser = async (userId, filters = {}) => {
  const where = { userId };

  return Chat.findAll({
    where,
    order: [['timeChat', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const updateChat = async (id, data) => {
  const chat = await Chat.findByPk(id);
  if (!chat) {
    throw new AppError('Chat not found', 404);
  }
  return chat.update(data);
};

const deleteChat = async (id) => {
  const chat = await Chat.findByPk(id);
  if (!chat) {
    throw new AppError('Chat not found', 404);
  }
  await chat.destroy();
  return { message: 'Chat deleted' };
};

module.exports = {
  createChat,
  getAllChats,
  getChatById,
  getChatsByUser,
  updateChat,
  deleteChat
};