const { getBoard, getBoardColumns, getCollaborativeTasks: getCollaborativeTasksService } = require('../services/boardService');

const getBoardData = async (req, res, next) => {
  try {
    const filters = {
      column: req.query.column,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };
    const board = await getBoard(req.user.userId, filters);
    res.json(board);
  } catch (error) {
    next(error);
  }
};

const getColumns = async (req, res, next) => {
  try {
    const columns = await getBoardColumns(req.user.userId);
    res.json({ columns });
  } catch (error) {
    next(error);
  }
};

const getCollaborativeTasks = async (req, res, next) => {
  try {
    const tasks = await getCollaborativeTasksService(req.user.userId);
    res.json({ tasks });
  } catch (e) { next(e); }
};

module.exports = { getBoardData, getColumns, getCollaborativeTasks };