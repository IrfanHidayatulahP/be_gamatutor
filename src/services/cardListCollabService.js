const { CardListCollab, Card, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const addCollaborator = async (cardId, userId, role = 'member') => {
  const card = await Card.findByPk(cardId);
  if (!card) {
    throw new AppError('Card not found', 404);
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const existing = await CardListCollab.findOne({ where: { cardId, userId } });
  if (existing) {
    throw new AppError('User is already a collaborator on this card', 400);
  }

  return CardListCollab.create({ cardId, userId, role });
};

const getAllCollaborations = async (filters = {}) => {
  const where = {};
  if (filters.cardId) where.cardId = filters.cardId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.role) where.role = filters.role;

  return CardListCollab.findAll({
    where,
    include: [
      { model: Card, as: 'card', include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }] },
      { model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ],
    order: [['addedAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getCollaborationById = async (id) => {
  const collab = await CardListCollab.findByPk(id, {
    include: [
      { model: Card, as: 'card' },
      { model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ]
  });
  if (!collab) {
    throw new AppError('Collaboration not found', 404);
  }
  return collab;
};

const getCollaborationsByCard = async (cardId) => {
  return CardListCollab.findAll({
    where: { cardId },
    include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username', 'role'] }],
    order: [['addedAt', 'ASC']]
  });
};

const getCollaborationsByUser = async (userId) => {
  return CardListCollab.findAll({
    where: { userId },
    include: [{ model: Card, as: 'card', include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }] }],
    order: [['addedAt', 'DESC']]
  });
};

const updateCollaboratorRole = async (id, role) => {
  const collab = await CardListCollab.findByPk(id);
  if (!collab) {
    throw new AppError('Collaboration not found', 404);
  }
  return collab.update({ role });
};

const removeCollaborator = async (id) => {
  const collab = await CardListCollab.findByPk(id);
  if (!collab) {
    throw new AppError('Collaboration not found', 404);
  }
  await collab.destroy();
  return { message: 'Collaborator removed' };
};

module.exports = {
  addCollaborator,
  getAllCollaborations,
  getCollaborationById,
  getCollaborationsByCard,
  getCollaborationsByUser,
  updateCollaboratorRole,
  removeCollaborator
};