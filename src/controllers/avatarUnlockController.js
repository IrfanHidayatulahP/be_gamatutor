const {
  unlockComponent,
  getAllUnlocks,
  getUnlockById,
  getUserUnlocks,
  getUnlocksByComponent,
  isComponentUnlocked,
  deleteUnlock
} = require('../services/avatarUnlockService');

const unlock = async (req, res, next) => {
  try {
    const unlock = await unlockComponent(req.user.userId, req.body.componentId);
    res.status(201).json({ unlock });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const filters = {
      userId: req.query.userId,
      componentId: req.query.componentId,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };
    const unlocks = await getAllUnlocks(filters);
    res.json({ unlocks });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const unlock = await getUnlockById(req.params.id);
    res.json({ unlock });
  } catch (error) {
    next(error);
  }
};

const getByUser = async (req, res, next) => {
  try {
    const userId = req.params.userId === 'me' ? req.user.userId : req.params.userId;
    const unlocks = await getUserUnlocks(userId);
    res.json({ unlocks });
  } catch (error) {
    next(error);
  }
};

const getByComponent = async (req, res, next) => {
  try {
    const unlocks = await getUnlocksByComponent(req.params.componentId);
    res.json({ unlocks });
  } catch (error) {
    next(error);
  }
};

const checkUnlocked = async (req, res, next) => {
  try {
    const unlocked = await isComponentUnlocked(req.user.userId, req.params.componentId);
    res.json({ unlocked });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteUnlock(req.params.id);
    res.json({ message: 'Unlock record deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { unlock, getAll, getById, getByUser, getByComponent, checkUnlocked, remove };