const { 
  LLMRecommendationHistory, 
  LLMPromptTemplate, 
  UserQuizResult, 
  MonthlyEvaluation, 
  EvalStrat,
  User 
} = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const createRecommendationHistory = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return LlmRecommendationHistory.create({
    userId,
    ...data
  });
};

const getAllRecommendationHistories = async (filters = {}) => {
  const where = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.triggerType) where.triggerType = filters.triggerType;

  return LlmRecommendationHistory.findAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }],
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getRecommendationHistoryById = async (id) => {
  const history = await LlmRecommendationHistory.findByPk(id, {
    include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }]
  });
  if (!history) {
    throw new AppError('Recommendation history not found', 404);
  }
  return history;
};

const getRecommendationHistoriesByUser = async (userId, filters = {}) => {
  const where = { userId };
  if (filters.triggerType) where.triggerType = filters.triggerType;

  return LlmRecommendationHistory.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getRecommendationHistoriesByTrigger = async (triggerType) => {
  return LlmRecommendationHistory.findAll({
    where: { triggerType },
    order: [['createdAt', 'DESC']]
  });
};

const deleteRecommendationHistory = async (id) => {
  const history = await LlmRecommendationHistory.findByPk(id);
  if (!history) {
    throw new AppError('Recommendation history not found', 404);
  }
  await history.destroy();
  return { message: 'Recommendation history deleted' };
};

module.exports = {
  createRecommendationHistory,
  getAllRecommendationHistories,
  getRecommendationHistoryById,
  getRecommendationHistoriesByUser,
  getRecommendationHistoriesByTrigger,
  deleteRecommendationHistory
};