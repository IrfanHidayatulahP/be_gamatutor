const {
    createNotification,
    getUserNotifications,
    getNotificationById,
    markAsRead,
    markAsClicked,
    markAllAsRead,
    updateNotification,
    deleteNotification,
    handleNotificationAction,
    updateFcmToken,
    sendTestPush
} = require('../services/notificationService');

const create = async(req, res, next) => {
    try {
        const notification = await createNotification(req.body);
        res.status(201).json({ notification });
    } catch (error) {
        next(error);
    }
};

const getAll = async(req, res, next) => {
    try {
        const filters = {
            type: req.query.type,
            read: req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined,
            delivered: req.query.delivered === 'true' ? true : req.query.delivered === 'false' ? false : undefined,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };
        const notifications = await getUserNotifications(req.user.userId, filters);
        res.json({ notifications });
    } catch (error) {
        next(error);
    }
};

const getById = async(req, res, next) => {
    try {
        const notification = await getNotificationById(req.params.notifId);
        res.json({ notification });
    } catch (error) {
        next(error);
    }
};

const read = async(req, res, next) => {
    try {
        const notification = await markAsRead(req.params.notifId);
        res.json({ notification });
    } catch (error) {
        next(error);
    }
};

const click = async(req, res, next) => {
    try {
        const notification = await markAsClicked(req.params.notifId);
        res.json({ notification });
    } catch (error) {
        next(error);
    }
};

const readAll = async(req, res, next) => {
    try {
        await markAllAsRead(req.user.userId);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
};

const update = async(req, res, next) => {
    try {
        const notification = await updateNotification(req.params.notifId, req.body);
        res.json({ notification });
    } catch (error) {
        next(error);
    }
};

const remove = async(req, res, next) => {
    try {
        await deleteNotification(req.params.notifId);
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        next(error);
    }
};

const actionNotification = async(req, res, next) => {
    try {
        const { action } = req.body;
        const result = await handleNotificationAction(req.params.notifId, action, req.user.userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const updateFcmTokenController = async(req, res, next) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) {
            return res.status(400).json({ error: 'FCM token is required' });
        }
        const user = await updateFcmToken(req.user.userId, fcmToken);
        res.json({ message: 'FCM token updated', user });
    } catch (error) {
        next(error);
    }
};

const testPush = async(req, res, next) => {
    try {
        const { title, body, triggerAction } = req.body;
        const result = await sendTestPush(req.user.userId, title, body, triggerAction);
        res.json({ success: true, result });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    create,
    getAll,
    getById,
    read,
    click,
    readAll,
    update,
    remove,
    actionNotification,
    updateFcmTokenController,
    testPush
};