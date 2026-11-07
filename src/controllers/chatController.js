const { createChat, getAllChats, getChatById, getChatsByUser, updateChat, deleteChat } = require('../services/chatService');

const create = async (req, res, next) => {
  try {
    const chat = await createChat(req.user.userId, req.body);
    res.status(201).json({ chat });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const filters = {
      userId: req.query.userId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const chats = await getAllChats(filters);
    res.json({ chats });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const chat = await getChatById(req.params.id);
    res.json({ chat });
  } catch (error) {
    next(error);
  }
};

const getByUser = async (req, res, next) => {
  try {
    const filters = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const chats = await getChatsByUser(req.params.userId, filters);
    res.json({ chats });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const chat = await updateChat(req.params.id, req.body);
    res.json({ chat });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteChat(req.params.id);
    res.json({ message: 'Chat deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, getByUser, update, remove };