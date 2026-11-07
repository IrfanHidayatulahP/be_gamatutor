const {
    getAllUsers,
    getUserById,
    updateUser,
    updateUserStatus,
    deleteUser,
    searchUsersByEmail,
    registerFcmTokenService,
    unregisterFcmTokenService
} = require('../services/userService');
const { User } = require('../models');
const { Op } = require('sequelize');

const getUsers = async(req, res, next) => {
    try {
        const users = await getAllUsers(req.query);
        res.json({ users });
    } catch (error) {
        next(error);
    }
};

const getUser = async(req, res, next) => {
    try {
        const user = await getUserById(req.params.id);
        res.json({ user });
    } catch (error) {
        next(error);
    }
};

const updateUserProfile = async(req, res, next) => {
    try {
        const user = await updateUser(req.params.id, req.body);
        res.json({ user });
    } catch (error) {
        next(error);
    }
};

const updateUserStatusController = async(req, res, next) => {
    try {
        const { status } = req.body;
        const user = await updateUserStatus(req.params.id, status);
        res.json({ user });
    } catch (error) {
        next(error);
    }
};

const deleteUserAccount = async(req, res, next) => {
    try {
        await deleteUser(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const searchUsers = async(req, res, next) => {
    try {
        const { email, query } = req.query;

        // 1. Jika mobile memanggil berdasarkan email spesifik
        if (email) {
            const users = await searchUsersByEmail(email);
            return res.json({ users });
        }

        // 2. Pencarian multi-kolom nama/username/email 
        const searchQuery = query ? query.trim() : '';
        const currentUserId = req.user?.userId || req.user?.id;

        const whereCondition = {};
        if (currentUserId) {
            whereCondition.userId = {
                [Op.ne]: currentUserId
            };
        }

        if (searchQuery !== '') {
            whereCondition[Op.or] = [{
                    firstName: {
                        [Op.iLike]: `%${searchQuery}%`
                    }
                },
                {
                    lastName: {
                        [Op.iLike]: `%${searchQuery}%`
                    }
                },
                {
                    username: {
                        [Op.iLike]: `%${searchQuery}%`
                    }
                },
                {
                    email: {
                        [Op.iLike]: `%${searchQuery}%`
                    }
                }
            ];
        }

        const users = await User.findAll({
            where: whereCondition,
            attributes: ['userId', 'firstName', 'lastName', 'username', 'email', 'status'],
            limit: 20
        });

        return res.status(200).json({ users });
    } catch (error) {
        next(error);
    }
};

// Fitur FCM Token Mobile 
const registerFcmToken = async(req, res, next) => {
    try {
        const { fcmToken, platform } = req.body;
        const userId = req.user.userId || req.user.id;
        await registerFcmTokenService(userId, fcmToken, platform);
        res.status(201).json({ message: 'FCM token registered' });
    } catch (error) {
        next(error);
    }
};

const unregisterFcmToken = async(req, res, next) => {
    try {
        const userId = req.user.userId || req.user.id;
        await unregisterFcmTokenService(userId);
        res.json({ message: 'FCM token unregistered' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    getUser,
    updateUserProfile,
    updateUserStatusController,
    deleteUserAccount,
    searchUsers,
    registerFcmToken,
    unregisterFcmToken
}