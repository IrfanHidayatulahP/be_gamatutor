const {
  createComponent,
  getAllComponents,
  getComponentById,
  getComponentsByCategory,
  updateComponent,
  deleteComponent
} = require('../services/avatarComponentService');

const create = async (req, res, next) => {
  try {
    const component = await createComponent(req.body);
    res.status(201).json({ component });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const filters = {
      category: req.query.category,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };
    const components = await getAllComponents(filters);
    res.json({ components });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const component = await getComponentById(req.params.id);
    res.json({ component });
  } catch (error) {
    next(error);
  }
};

const getByCategory = async (req, res, next) => {
  try {
    const components = await getComponentsByCategory(req.params.category);
    res.json({ components });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const component = await updateComponent(req.params.id, req.body);
    res.json({ component });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteComponent(req.params.id);
    res.json({ message: 'Avatar component deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, getByCategory, update, remove };