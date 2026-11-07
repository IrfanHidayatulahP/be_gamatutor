const { createColumnMovement, getAllColumnMovements, getColumnMovementById, getColumnMovementsByCardId, updateColumnMovement, markMovementCompleted, deleteColumnMovement } = require('../services/columnMovementService');

const create = async (req, res, next) => {
  try {
    const movement = await createColumnMovement(req.user.userId, req.body);
    res.status(201).json({ movement });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const filters = {
      cardId: req.query.cardId,
      completed: req.query.completed === 'true' ? true : req.query.completed === 'false' ? false : undefined,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };
    const movements = await getAllColumnMovements(filters);
    res.json({ movements });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const movement = await getColumnMovementById(req.params.id);
    res.json({ movement });
  } catch (error) {
    next(error);
  }
};

const getByCardId = async (req, res, next) => {
  try {
    const movements = await getColumnMovementsByCardId(req.params.cardId, req.user.userId);
    res.json({ movements });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const movement = await updateColumnMovement(req.params.id, req.body);
    res.json({ movement });
  } catch (error) {
    next(error);
  }
};

const complete = async (req, res, next) => {
  try {
    const movement = await markMovementCompleted(req.params.id);
    res.json({ movement });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteColumnMovement(req.params.id);
    res.json({ message: 'Column movement deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, getByCardId, update, complete, remove };