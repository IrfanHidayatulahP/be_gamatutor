const {
  createQuizResult,
  getAllQuizResults,
  getQuizResultById,
  getQuizResultsByUser,
  getLatestQuizResultByUser,
  updateQuizResult,
  deleteQuizResult
} = require('../services/userQuizResultService');

const create = async (req, res, next) => {
  try {
    const answers = req.body.answersPayload; 

    if (!answers) {
      return res.status(400).json({ error: 'Field "answersPayload" wajib diisi.' });
    }

    const result = await createQuizResult(req.user.userId, answers);
    res.status(201).json({ quizResult: result });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const filters = {
      userId: req.query.userId,
      dominantStrategy: req.query.dominantStrategy,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const results = await getAllQuizResults(filters);
    res.json({ quizResults: results });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await getQuizResultById(req.params.id);
    res.json({ quizResult: result });
  } catch (error) {
    next(error);
  }
};

const getByUser = async (req, res, next) => {
  try {
    const filters = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const results = await getQuizResultsByUser(req.params.userId, filters);
    res.json({ quizResults: results });
  } catch (error) {
    next(error);
  }
};

const getLatestByUser = async (req, res, next) => {
  try {
    const result = await getLatestQuizResultByUser(req.params.userId);
    res.json({ quizResult: result });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await updateQuizResult(req.params.id, req.body);
    res.json({ quizResult: result });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteQuizResult(req.params.id);
    res.json({ message: 'Quiz result deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, getByUser, getLatestByUser, update, remove };