const {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  getTemplateByName,
  updateTemplate,
  deleteTemplate
} = require('../services/llmPromptTemplateService');

const create = async (req, res, next) => {
  try {
    const template = await createTemplate(req.body);
    res.status(201).json({ template });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const filters = {
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      templateName: req.query.templateName,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const templates = await getAllTemplates(filters);
    res.json({ templates });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const template = await getTemplateById(req.params.id);
    res.json({ template });
  } catch (error) {
    next(error);
  }
};

const getByName = async (req, res, next) => {
  try {
    const template = await getTemplateByName(req.params.templateName);
    if (!template) {
      return res.status(404).json({ error: 'Prompt template not found' });
    }
    res.json({ template });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const template = await updateTemplate(req.params.id, req.body);
    res.json({ template });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteTemplate(req.params.id);
    res.json({ message: 'Prompt template deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, getByName, update, remove };