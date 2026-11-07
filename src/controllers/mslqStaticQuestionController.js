const {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  getQuestionsByCategory,
  updateQuestion,
  deleteQuestion
} = require('../services/mslqStaticQuestionService');

const create = async (req, res, next) => {
  try {
    const question = await createQuestion(req.body);
    res.status(201).json({ question });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const filters = {
      category: req.query.category,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const questions = await getAllQuestions(filters);
    res.json({ questions });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const question = await getQuestionById(req.params.id);
    res.json({ question });
  } catch (error) {
    next(error);
  }
};

const getByCategory = async (req, res, next) => {
  try {
    const questions = await getQuestionsByCategory(req.params.category);
    res.json({ questions });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const question = await updateQuestion(req.params.id, req.body);
    res.json({ question });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteQuestion(req.params.id);
    res.json({ message: 'Static question deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, getByCategory, update, remove };