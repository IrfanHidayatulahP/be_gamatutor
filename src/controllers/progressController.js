const { getProgressSummary, getGrowthData, getAllCardsForProgress: getAllCardsForProgressService } = require('../services/progressService');

const getProgress = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const period = req.query.period || 'week';

    // Validate period
    if (!['week', 'month', 'all'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Must be week, month, or all' });
    }

    const [summary, growthData] = await Promise.all([
      getProgressSummary(userId, period),
      getGrowthData(userId, period)
    ]);

    res.json({
      summary,
      growthData
    });
  } catch (error) {
    next(error);
  }
};

const getAllCardsForProgressHandler = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const cards = await getAllCardsForProgressService(userId);
    res.json({ cards });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProgress, getAllCardsForProgress: getAllCardsForProgressHandler };