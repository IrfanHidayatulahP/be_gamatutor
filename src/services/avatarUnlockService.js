const { AvatarUnlock, User, AvatarComponent } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const unlockComponent = async (userId, componentId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const component = await AvatarComponent.findByPk(componentId);
  if (!component) {
    throw new AppError('Avatar component not found', 404);
  }

  const existing = await AvatarUnlock.findOne({ where: { userId, componentId } });
  if (existing) {
    throw new AppError('Component already unlocked', 400);
  }

  return AvatarUnlock.create({ userId, componentId });
};

const getAllUnlocks = async (filters = {}) => {
  const where = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.componentId) where.componentId = filters.componentId;

  return AvatarUnlock.findAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: AvatarComponent, as: 'component', attributes: ['avaId', 'category', 'name', 'assetPath'] }
    ],
    order: [['unlockedAt', 'DESC']],
    limit: filters.limit || 100,
    offset: filters.offset || 0
  });
};

const getUnlockById = async (id) => {
  const unlock = await AvatarUnlock.findByPk(id, {
    include: [
      { model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: AvatarComponent, as: 'component', attributes: ['avaId', 'category', 'name', 'assetPath'] }
    ]
  });
  if (!unlock) {
    throw new AppError('Unlock record not found', 404);
  }
  return unlock;
};

const getUserUnlocks = async (userId) => {
  return AvatarUnlock.findAll({
    where: { userId },
    include: [{ model: AvatarComponent, as: 'component', attributes: ['avaId', 'category', 'name', 'assetPath'] }],
    order: [['unlockedAt', 'DESC']]
  });
};

const getUnlocksByComponent = async (componentId) => {
  return AvatarUnlock.findAll({
    where: { componentId },
    include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }],
    order: [['unlockedAt', 'DESC']]
  });
};

const isComponentUnlocked = async (userId, componentId) => {
  const unlock = await AvatarUnlock.findOne({ where: { userId, componentId } });
  return !!unlock;
};

const deleteUnlock = async (id) => {
  const unlock = await AvatarUnlock.findByPk(id);
  if (!unlock) {
    throw new AppError('Unlock record not found', 404);
  }
  await unlock.destroy();
  return { message: 'Unlock record deleted' };
};

module.exports = {
  unlockComponent,
  getAllUnlocks,
  getUnlockById,
  getUserUnlocks,
  getUnlocksByComponent,
  isComponentUnlocked,
  deleteUnlock
};