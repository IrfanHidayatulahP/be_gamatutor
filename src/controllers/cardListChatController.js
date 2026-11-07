const {
  sendMessage,
  getAllMessages,
  getMessageById,
  getMessagesByCollab,
  updateMessage,
  deleteMessage
} = require('../services/cardListChatService');

const create = async (req, res, next) => {
  try {
    const message = await sendMessage(req.params.collabId, req.user.userId, req.body.message);
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const filters = {
      collabId: req.query.collabId,
      userId: req.query.userId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const messages = await getAllMessages(filters);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const message = await getMessageById(req.params.id);
    res.json({ message });
  } catch (error) {
    next(error);
  }
};

const getByCollab = async (req, res, next) => {
  try {
    const filters = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const messages = await getMessagesByCollab(req.params.collabId, filters);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const message = await updateMessage(req.params.id, req.body.message);
    res.json({ message });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteMessage(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, getByCollab, update, remove };