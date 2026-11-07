const { LlmPromptTemplate } = require('../models');
const { AppError } = require('../middleware/errorHandler');


const createTemplate = async (data) => {
  return LlmPromptTemplate.create(data);
};

const getAllTemplates = async (filters = {}) => {
  const where = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.templateName) where.templateName = filters.templateName;

  return LlmPromptTemplate.findAll({
    where,
    order: [['templateName', 'ASC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getTemplateById = async (id) => {
  const template = await LlmPromptTemplate.findByPk(id);
  if (!template) {
    throw new AppError('Prompt template not found', 404);
  }
  return template;
};

const getTemplateByName = async (templateName) => {
  return LlmPromptTemplate.findOne({ where: { templateName } });
};

const updateTemplate = async (id, data) => {
  const template = await LlmPromptTemplate.findByPk(id);
  if (!template) {
    throw new AppError('Prompt template not found', 404);
  }
  return template.update(data);
};

const deleteTemplate = async (id) => {
  const template = await LlmPromptTemplate.findByPk(id);
  if (!template) {
    throw new AppError('Prompt template not found', 404);
  }
  await template.destroy();
  return { message: 'Prompt template deleted' };
};

module.exports = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  getTemplateByName,
  updateTemplate,
  deleteTemplate
};