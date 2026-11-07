const {
    createChat,
    getAllChats,
    getChatById,
    getChatsByUser,
    updateChat,
    deleteChat,
    getConversation: getConversationService
} = require('../services/chatService');
const { getIo } = require('../websocket/ioInstance');

const create = async(req, res, next) => {
    try {
        const chat = await createChat(req.user.userId, req.body);

        // Emit WebSocket event real-time ke pengirim dan penerima
        const io = getIo();
        if (io) {
            const messageData = {
                event: 'new_message',
                data: {
                    chatId: chat.chatId,
                    senderId: req.user.userId,
                    receiverId: req.body.friendId,
                    messageChat: chat.messageChat,
                    status: chat.status,
                    createdAt: chat.timeChat,
                    sender: {
                        userId: req.user.userId,
                        firstName: req.user.firstName,
                        lastName: req.user.lastName,
                        username: req.user.username
                    }
                }
            };

            io.emitToUser(req.body.friendId, 'new_message', messageData);
            io.emitToUser(req.user.userId, 'new_message', messageData);
        }

        res.status(201).json({ chat });
    } catch (error) {
        next(error);
    }
};

const getAll = async(req, res, next) => {
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

const getById = async(req, res, next) => {
    try {
        const chat = await getChatById(req.params.id);
        res.json({ chat });
    } catch (error) {
        next(error);
    }
};

const getByUser = async(req, res, next) => {
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

const update = async(req, res, next) => {
    try {
        const chat = await updateChat(req.params.id, req.body);
        res.json({ chat });
    } catch (error) {
        next(error);
    }
};

const remove = async(req, res, next) => {
    try {
        await deleteChat(req.params.id);
        res.json({ message: 'Chat deleted' });
    } catch (error) {
        next(error);
    }
};

const getConversation = async(req, res, next) => {
    try {
        const filters = {
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };
        const chats = await getConversationService(req.user.userId, req.params.id, filters);
        res.json({ chats });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    create,
    getAll,
    getById,
    getByUser,
    update,
    remove,
    getConversation
};