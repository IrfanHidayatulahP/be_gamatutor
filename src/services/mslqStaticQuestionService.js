const { MslqStaticQuestion } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const createQuestion = async (data) => {
  return MslqStaticQuestion.create(data);
};

const getAllQuestions = async (filters = {}) => {
  const where = {};
  if (filters.category) where.category = filters.category;

  return MslqStaticQuestion.findAll({
    where,
    order: [['category', 'ASC'], ['createdAt', 'ASC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getQuestionById = async (id) => {
  const question = await MslqStaticQuestion.findByPk(id);
  if (!question) {
    throw new AppError('Static question not found', 404);
  }
  return question;
};

const getQuestionsByCategory = async (category) => {
  return MslqStaticQuestion.findAll({
    where: { category },
    order: [['createdAt', 'ASC']]
  });
};

const updateQuestion = async (id, data) => {
  const question = await MslqStaticQuestion.findByPk(id);
  if (!question) {
    throw new AppError('Static question not found', 404);
  }
  return question.update(data);
};

const deleteQuestion = async (id) => {
  const question = await MslqStaticQuestion.findByPk(id);
  if (!question) {
    throw new AppError('Static question not found', 404);
  }
  await question.destroy();
  return { message: 'Static question deleted' };
};

module.exports = {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  getQuestionsByCategory,
  updateQuestion,
  deleteQuestion
};