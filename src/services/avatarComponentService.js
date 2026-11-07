const { AvatarComponent } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const createComponent = async (data) => {
  return AvatarComponent.create(data);
};

const getAllComponents = async (filters = {}) => {
  const where = {};
  if (filters.category) where.category = filters.category;

  return AvatarComponent.findAll({
    where,
    order: [['category', 'ASC'], ['name', 'ASC']],
    limit: filters.limit || 100,
    offset: filters.offset || 0
  });
};

const getComponentById = async (id) => {
  const component = await AvatarComponent.findByPk(id);
  if (!component) {
    throw new AppError('Avatar component not found', 404);
  }
  return component;
};

const getComponentsByCategory = async (category) => {
  return AvatarComponent.findAll({
    where: { category },
    order: [['name', 'ASC']]
  });
};

const updateComponent = async (id, data) => {
  const component = await AvatarComponent.findByPk(id);
  if (!component) {
    throw new AppError('Avatar component not found', 404);
  }
  return component.update(data);
};

const deleteComponent = async (id) => {
  const component = await AvatarComponent.findByPk(id);
  if (!component) {
    throw new AppError('Avatar component not found', 404);
  }
  await component.destroy();
  return { message: 'Avatar component deleted' };
};

module.exports = {
  createComponent,
  getAllComponents,
  getComponentById,
  getComponentsByCategory,
  updateComponent,
  deleteComponent
};