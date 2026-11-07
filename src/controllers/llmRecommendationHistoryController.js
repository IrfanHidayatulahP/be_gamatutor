const {
  createRecommendationHistory,
  getAllRecommendationHistories,
  getRecommendationHistoryById,
  getRecommendationHistoriesByUser,
  getRecommendationHistoriesByTrigger,
  deleteRecommendationHistory
} = require('../services/llmRecommendationHistoryService');

const create = async (req, res, next) => {
  try {
    const history = await createRecommendationHistory(req.user.userId, req.body);
    res.status(201).json({ recommendationHistory: history });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const filters = {
      userId: req.query.userId,
      triggerType: req.query.triggerType,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const histories = await getAllRecommendationHistories(filters);
    res.json({ recommendationHistories: histories });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const history = await getRecommendationHistoryById(req.params.id);
    res.json({ recommendationHistory: history });
  } catch (error) {
    next(error);
  }
};

const getByUser = async (req, res, next) => {
  try {
    const filters = {
      triggerType: req.query.triggerType,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const histories = await getRecommendationHistoriesByUser(req.params.userId, filters);
    res.json({ recommendationHistories: histories });
  } catch (error) {
    next(error);
  }
};

const getByTrigger = async (req, res, next) => {
  try {
    const histories = await getRecommendationHistoriesByTrigger(req.params.triggerType);
    res.json({ recommendationHistories: histories });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteRecommendationHistory(req.params.id);
    res.json({ message: 'Recommendation history deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, getByUser, getByTrigger, remove };