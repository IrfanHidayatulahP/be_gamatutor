const monthlyEvalService = require('../services/monthlyEvaluationService');

const getUserId = (req) => req.user?.userId || req.user?.id || req.user?.sub;
const ckStatus = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: no userId in token' });
    }

    console.log('🔵 ckStatus userId =', userId);

    const result = await monthlyEvalService.checkAndGenerate(userId);
    res.json(result);
  } catch (err) {
    console.error('🔴 ckStatus error:', err);
    res.status(400).json({ error: err.message, name: err.name });
  }
};

const reflect = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: no userId in token' });
    }

    const { monthYear, userReason } = req.body;
    if (!monthYear || !userReason) {
      return res
        .status(400)
        .json({ error: 'monthYear dan userReason wajib diisi' });
    }

    console.log(
      `🔵 reflect userId=${userId} monthYear=${monthYear} reason=${userReason}`
    );

    const result = await monthlyEvalService.submitReflection(
      userId,
      monthYear,
      userReason
    );
    res.json(result);
  } catch (err) {
    console.error('🔴 reflect error:', err);
    res.status(400).json({ error: err.message, name: err.name });
  }
};

const create = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: no userId in token' });
    }

    const evaluation = await monthlyEvalService.createMonthlyEvaluation(
      userId,
      req.body
    );
    res.status(201).json({ monthlyEvaluation: evaluation });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const filters = {
      userId: req.query.userId,
      monthYear: req.query.monthYear,
      isSynchronized:
        req.query.isSynchronized === 'true'
          ? true
          : req.query.isSynchronized === 'false'
          ? false
          : undefined,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const evaluations = await monthlyEvalService.getAllMonthlyEvaluations(filters);
    res.json({ monthlyEvaluations: evaluations });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const evaluation = await monthlyEvalService.getMonthlyEvaluationById(
      req.params.id
    );
    res.json({ monthlyEvaluation: evaluation });
  } catch (error) {
    next(error);
  }
};

const getByUser = async (req, res, next) => {
  try {
    const filters = {
      monthYear: req.query.monthYear,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const evaluations = await monthlyEvalService.getMonthlyEvaluationsByUser(
      req.params.userId,
      filters
    );
    res.json({ monthlyEvaluations: evaluations });
  } catch (error) {
    next(error);
  }
};

const getByUserAndMonth = async (req, res, next) => {
  try {
    const evaluation =
      await monthlyEvalService.getMonthlyEvaluationByUserAndMonth(
        req.params.userId,
        req.params.monthYear
      );

    if (!evaluation) {
      return res.status(404).json({ error: 'Monthly evaluation not found' });
    }
    res.json({ monthlyEvaluation: evaluation });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const evaluation = await monthlyEvalService.updateMonthlyEvaluation(
      req.params.id,
      req.body
    );
    res.json({ monthlyEvaluation: evaluation });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await monthlyEvalService.deleteMonthlyEvaluation(req.params.id);
    res.json({ message: 'Monthly evaluation deleted' });
  } catch (error) {
    next(error);
  }
};


module.exports = { create, getAll, getById, getByUser, getByUserAndMonth, update, remove, ckStatus, reflect };