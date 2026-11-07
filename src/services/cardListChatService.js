const { CardListChat, CardListCollab, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const sendMessage = async (collabId, userId, message) => {
  const collab = await CardListCollab.findByPk(collabId);
  if (!collab) {
    throw new AppError('Collaboration not found', 404);
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return CardListChat.create({ collabId, userId, message });
};

const getAllMessages = async (filters = {}) => {
  const where = {};
  if (filters.collabId) where.collabId = filters.collabId;
  if (filters.userId) where.userId = filters.userId;

  return CardListChat.findAll({
    where,
    include: [
      { model: CardListCollab, as: 'collab' },
      { model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ],
    order: [['sentAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getMessageById = async (id) => {
  const message = await CardListChat.findByPk(id, {
    include: [
      { model: CardListCollab, as: 'collab' },
      { model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ]
  });
  if (!message) {
    throw new AppError('Message not found', 404);
  }
  return message;
};

const getMessagesByCollab = async (collabId, filters = {}) => {
  return CardListChat.findAll({
    where: { collabId },
    include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }],
    order: [['sentAt', 'ASC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const updateMessage = async (id, message) => {
  const msg = await CardListChat.findByPk(id);
  if (!msg) {
    throw new AppError('Message not found', 404);
  }
  return msg.update({ message });
};

const deleteMessage = async (id) => {
  const msg = await CardListChat.findByPk(id);
  if (!msg) {
    throw new AppError('Message not found', 404);
  }
  await msg.destroy();
  return { message: 'Message deleted' };
};

module.exports = {
  sendMessage,
  getAllMessages,
  getMessageById,
  getMessagesByCollab,
  updateMessage,
  deleteMessage
};