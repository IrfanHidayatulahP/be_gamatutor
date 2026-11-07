const { ColumnMovement, Card } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const createColumnMovement = async (userId, data) => {
  const card = await Card.findOne({ where: { cardId: data.cardId, userId } });
  if (!card) {
    throw new AppError('Card not found', 404);
  }

  return ColumnMovement.create({
    cardId: data.cardId,
    fromColumn: data.fromColumn,
    toColumn: data.toColumn,
    timestamp: data.timestamp || new Date(),
    completed: data.completed || false
  });
};

const getAllColumnMovements = async (filters = {}) => {
  const where = {};
  if (filters.cardId) where.cardId = filters.cardId;
  if (filters.completed !== undefined) where.completed = filters.completed;
  if (filters.fromDate || filters.toDate) {
    where.timestamp = {};
    if (filters.fromDate) where.timestamp[Op.gte] = filters.fromDate;
    if (filters.toDate) where.timestamp[Op.lte] = filters.toDate;
  }

  return ColumnMovement.findAll({
    where,
    order: [['timestamp', 'DESC']],
    limit: filters.limit || 100,
    offset: filters.offset || 0
  });
};

const getColumnMovementById = async (id) => {
  const movement = await ColumnMovement.findByPk(id);
  if (!movement) {
    throw new AppError('Column movement not found', 404);
  }
  return movement;
};

const getColumnMovementsByCardId = async (cardId, userId) => {
  const card = await Card.findOne({ where: { cardId, userId } });
  if (!card) {
    throw new AppError('Card not found', 404);
  }

  return ColumnMovement.findAll({
    where: { cardId },
    order: [['timestamp', 'ASC']]
  });
};

const updateColumnMovement = async (id, data) => {
  const movement = await ColumnMovement.findByPk(id);
  if (!movement) {
    throw new AppError('Column movement not found', 404);
  }
  return movement.update(data);
};

const markMovementCompleted = async (id) => {
  const movement = await ColumnMovement.findByPk(id);
  if (!movement) {
    throw new AppError('Column movement not found', 404);
  }
  return movement.update({ completed: true });
};

const deleteColumnMovement = async (id) => {
  const movement = await ColumnMovement.findByPk(id);
  if (!movement) {
    throw new AppError('Column movement not found', 404);
  }
  await movement.destroy();
  return { message: 'Column movement deleted' };
};

module.exports = {
  createColumnMovement,
  getAllColumnMovements,
  getColumnMovementById,
  getColumnMovementsByCardId,
  updateColumnMovement,
  markMovementCompleted,
  deleteColumnMovement
};