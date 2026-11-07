const { Friendship, User, Notification } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { getIo } = require('../websocket/ioInstance');

// ============================================================================
// SEND FRIEND REQUEST
// ============================================================================
const sendFriendRequest = async(userId, friendId) => {
    if (userId === friendId) {
        throw new AppError('Cannot send friend request to yourself', 400);
    }

    const friend = await User.findByPk(friendId);
    if (!friend) {
        throw new AppError('User not found', 404);
    }

    const existing = await Friendship.findOne({
        where: {
            [Op.or]: [
                { userId, friendId },
                { userId: friendId, friendId: userId },
            ],
        },
    });

    const requester = await User.findByPk(userId, {
        attributes: ['firstName', 'lastName', 'username', 'userId'],
    });
    const requesterName = [requester.firstName, requester.lastName].filter(Boolean).join(' ') ||
        requester.username;

    let friendship;

    if (existing) {
        // Sudah ada record
        if (existing.status === 'pending') {
            throw new AppError('Friend request already exists', 400);
        }
        if (existing.status === 'accepted') {
            throw new AppError('Already friends', 400);
        }
        if (existing.status === 'blocked') {
            throw new AppError('Cannot send friend request to this user', 400);
        }
        // status === 'declined' → boleh kirim ulang, re-use record
        // Arahkan ulang userId/friendId sesuai pemohon saat ini
        friendship = await existing.update({
            userId,
            friendId,
            status: 'pending',
            updatedAt: new Date(),
        });
    } else {
        friendship = await Friendship.create({
            userId,
            friendId,
            status: 'pending',
        });
    }

    // Notifikasi DB
    try {
        await Notification.create({
            userId: friendId,
            type: 'push',
            title: 'Permintaan Pertemanan Baru',
            message: `${requesterName} mengirimkan permintaan pertemanan kepada Anda`,
            triggerAction: 'friend_request_received',
            triggerUserId: userId,
        });
    } catch (notifErr) {
        console.warn('Gagal membuat record notifikasi:', notifErr.message);
    }

    // WebSocket
    const io = getIo();
    if (io) {
        io.emitToUser(friendId, 'notificationReceived', {
            event: 'notificationReceived',
            data: {
                type: 'friend_request_received',
                message: 'New friend request',
                triggerUserId: userId,
            },
        });
        io.emitToUser(friendId, 'friend_request_received', {
            event: 'friend_request_received',
            data: {
                friendshipId: friendship.fsId,
                requester: {
                    userId: requester.userId,
                    firstName: requester.firstName,
                    lastName: requester.lastName,
                },
            },
        });
    }

    return friendship;
};

// ============================================================================
// CANCEL FRIEND REQUEST (by friend's userId)
// ============================================================================
const cancelFriendRequest = async(userId, friendId) => {
    const friendship = await Friendship.findOne({
        where: {
            [Op.or]: [
                { userId, friendId, status: 'pending' },
                { userId: friendId, friendId: userId, status: 'pending' },
            ],
        },
    });

    if (!friendship) {
        throw new AppError('Pending friend request not found', 404);
    }

    await Notification.destroy({
        where: {
            [Op.or]: [{
                    userId: friendId,
                    triggerUserId: userId,
                    triggerAction: {
                        [Op.in]: ['friend_request', 'friend_request_received'] },
                },
                {
                    userId: userId,
                    triggerUserId: friendId,
                    triggerAction: {
                        [Op.in]: ['friend_request', 'friend_request_received'] },
                },
            ],
        },
    });

    await friendship.destroy();
    return { message: 'Friend request cancelled' };
};

// ============================================================================
// GET ALL
// ============================================================================
const getAllFriendships = async(filters = {}) => {
    const where = {};
    if (filters.status) where.status = filters.status;

    return Friendship.findAll({
        where,
        include: [
            { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
            { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        ],
        order: [
            ['createdAt', 'DESC']
        ],
        limit: filters.limit || 50,
        offset: filters.offset || 0,
    });
};

// ============================================================================
// GET BY ID
// ============================================================================
const getFriendshipById = async(id) => {
    const friendship = await Friendship.findByPk(id, {
        include: [
            { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
            { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        ],
    });
    if (!friendship) {
        throw new AppError('Friendship not found', 404);
    }
    return friendship;
};

// ============================================================================
// GET FRIENDS (accepted)
// ============================================================================
const getUserFriends = async(userId, filters = {}) => {
    const where = {
        [Op.or]: [
            { userId, status: 'accepted' },
            { friendId: userId, status: 'accepted' },
        ],
    };

    return Friendship.findAll({
        where,
        include: [
            { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
            { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        ],
        order: [
            ['createdAt', 'DESC']
        ],
        limit: filters.limit || 50,
        offset: filters.offset || 0,
    });
};

// ============================================================================
// GET PENDING (incoming & outgoing)
// ============================================================================
const getPendingRequests = async(userId, filters = {}) => {
    const incomingWhere = { friendId: userId, status: 'pending' };
    const outgoingWhere = { userId: userId, status: 'pending' };

    const [incoming, outgoing] = await Promise.all([
        Friendship.findAll({
            where: incomingWhere,
            include: [
                { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
            ],
            order: [
                ['createdAt', 'DESC']
            ],
            limit: filters.limit || 50,
            offset: filters.offset || 0,
        }),
        Friendship.findAll({
            where: outgoingWhere,
            include: [
                { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] },
            ],
            order: [
                ['createdAt', 'DESC']
            ],
            limit: filters.limit || 50,
            offset: filters.offset || 0,
        }),
    ]);

    return { incoming, outgoing };
};

// ============================================================================
// ACCEPT
// ============================================================================
const acceptFriendRequest = async(id, userId) => {
    const friendship = await Friendship.findByPk(id, {
        include: [
            { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
            { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        ],
    });
    if (!friendship) {
        throw new AppError('Friend request not found', 404);
    }
    if (friendship.friendId !== userId) {
        throw new AppError('Not authorized to accept this request', 403);
    }
    if (friendship.status !== 'pending') {
        throw new AppError('Request is not pending', 400);
    }

    const updatedFriendship = await friendship.update({ status: 'accepted', updatedAt: new Date() });

    await Notification.destroy({
        where: {
            userId: userId,
            triggerUserId: friendship.userId,
            triggerAction: {
                [Op.in]: ['friend_request', 'friend_request_received'] },
        },
    });

    await Notification.create({
        userId: friendship.userId,
        type: 'push',
        title: 'Friend Request Accepted',
        message: `${friendship.friend.firstName} ${friendship.friend.lastName} accepted your friend request`,
        triggerAction: 'friend_request_accepted',
        triggerUserId: friendship.friendId,
    });

    const io = getIo();
    if (io) {
        io.emitToUser(friendship.userId, 'notificationReceived', {
            event: 'notificationReceived',
            data: {
                type: 'friend_request_accepted',
                message: 'Friend request accepted',
                triggerUserId: friendship.friendId,
            },
        });
        io.emitToUser(friendship.userId, 'friend_request_accepted', {
            event: 'friend_request_accepted',
            data: {
                friendshipId: updatedFriendship.fsId,
                friend: {
                    userId: friendship.friend.userId,
                    firstName: friendship.friend.firstName,
                    lastName: friendship.friend.lastName,
                },
            },
        });
        io.emitToUser(userId, 'friend_status_changed', {
            event: 'friend_status_changed',
            data: {
                friendshipId: updatedFriendship.fsId,
                status: 'accepted',
                friend: {
                    userId: friendship.requester.userId,
                    firstName: friendship.requester.firstName,
                    lastName: friendship.requester.lastName,
                },
            },
        });
    }

    return updatedFriendship;
};

// ============================================================================
// BLOCK
// ============================================================================
const blockFriend = async(id, userId) => {
    const friendship = await Friendship.findByPk(id, {
        include: [
            { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
            { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        ],
    });
    if (!friendship) {
        throw new AppError('Friendship not found', 404);
    }
    if (friendship.userId !== userId && friendship.friendId !== userId) {
        throw new AppError('Not authorized', 403);
    }

    const otherUserId = friendship.userId === userId ? friendship.friendId : friendship.userId;
    const updatedFriendship = await friendship.update({ status: 'blocked', updatedAt: new Date() });

    // Bersihkan notifikasi pending terkait (jika ada)
    await Notification.destroy({
        where: {
            [Op.or]: [{
                    userId: otherUserId,
                    triggerUserId: userId,
                    triggerAction: {
                        [Op.in]: ['friend_request', 'friend_request_received'] },
                },
                {
                    userId: userId,
                    triggerUserId: otherUserId,
                    triggerAction: {
                        [Op.in]: ['friend_request', 'friend_request_received'] },
                },
            ],
        },
    });

    const io = getIo();
    if (io) {
        io.emitToUser(otherUserId, 'friend_blocked', {
            event: 'friend_blocked',
            data: { friendshipId: updatedFriendship.fsId, blockedBy: userId },
        });
        io.emitToUser(userId, 'friend_status_changed', {
            event: 'friend_status_changed',
            data: {
                friendshipId: updatedFriendship.fsId,
                status: 'blocked',
                friend: { userId: otherUserId },
            },
        });
    }

    return updatedFriendship;
};

// ============================================================================
// REJECT
// ============================================================================
const rejectFriendRequest = async(id, userId) => {
    const friendship = await Friendship.findByPk(id, {
        include: [
            { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
            { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        ],
    });
    if (!friendship) {
        throw new AppError('Friend request not found', 404);
    }
    if (friendship.friendId !== userId) {
        throw new AppError('Not authorized to reject this request', 403);
    }
    if (friendship.status !== 'pending') {
        throw new AppError('Request is not pending', 400);
    }

    const updatedFriendship = await friendship.update({ status: 'declined', updatedAt: new Date() });

    await Notification.create({
        userId: friendship.userId,
        type: 'push',
        title: 'Friend Request Declined',
        message: `${friendship.friend.firstName} ${friendship.friend.lastName} declined your friend request`,
        triggerAction: 'friend_request_rejected',
        triggerUserId: friendship.friendId,
    });

    const io = getIo();
    if (io) {
        io.emitToUser(friendship.userId, 'notificationReceived', {
            event: 'notificationReceived',
            data: {
                type: 'friend_request_rejected',
                message: 'Friend request declined',
                triggerUserId: friendship.friendId,
            },
        });
        io.emitToUser(friendship.userId, 'friend_request_rejected', {
            event: 'friend_request_rejected',
            data: {
                friendshipId: updatedFriendship.fsId,
                friend: {
                    userId: friendship.friend.userId,
                    firstName: friendship.friend.firstName,
                    lastName: friendship.friend.lastName,
                },
            },
        });
        io.emitToUser(userId, 'friend_status_changed', {
            event: 'friend_status_changed',
            data: {
                friendshipId: updatedFriendship.fsId,
                status: 'declined',
                friend: {
                    userId: friendship.requester.userId,
                    firstName: friendship.requester.firstName,
                    lastName: friendship.requester.lastName,
                },
            },
        });
    }

    return updatedFriendship;
};

// ============================================================================
// REMOVE
// ============================================================================
const removeFriendship = async(id, userId) => {
    const friendship = await Friendship.findByPk(id, {
        include: [
            { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
            { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        ],
    });
    if (!friendship) {
        throw new AppError('Friendship not found', 404);
    }
    if (friendship.userId !== userId && friendship.friendId !== userId) {
        throw new AppError('Not authorized', 403);
    }

    const otherUserId = friendship.userId === userId ? friendship.friendId : friendship.userId;
    const friendshipId = friendship.fsId;

    await friendship.destroy();

    const io = getIo();
    if (io) {
        io.emitToUser(otherUserId, 'friend_removed', {
            event: 'friend_removed',
            data: { friendshipId, removedBy: userId },
        });
        io.emitToUser(userId, 'friend_status_changed', {
            event: 'friend_status_changed',
            data: { friendshipId, status: 'removed', friend: { userId: otherUserId } },
        });
    }

    return { message: 'Friendship removed' };
};

// ============================================================================
// UNBLOCK
// ============================================================================
const unblockFriend = async(id, userId) => {
    const friendship = await Friendship.findByPk(id, {
        include: [
            { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
            { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] },
        ],
    });
    if (!friendship) {
        throw new AppError('Friendship not found', 404);
    }
    if (friendship.userId !== userId && friendship.friendId !== userId) {
        throw new AppError('Not authorized', 403);
    }
    if (friendship.status !== 'blocked') {
        throw new AppError('Friendship is not blocked', 400);
    }

    const otherUserId = friendship.userId === userId ? friendship.friendId : friendship.userId;
    const updatedFriendship = await friendship.update({ status: 'declined', updatedAt: new Date() });

    const io = getIo();
    if (io) {
        io.emitToUser(otherUserId, 'friend_unblocked', {
            event: 'friend_unblocked',
            data: { friendshipId: updatedFriendship.fsId, unblockedBy: userId },
        });
        io.emitToUser(userId, 'friend_status_changed', {
            event: 'friend_status_changed',
            data: {
                friendshipId: updatedFriendship.fsId,
                status: 'declined',
                friend: { userId: otherUserId },
            },
        });
    }

    return updatedFriendship;
};

// ============================================================================
// GET TEAM FRIENDS (raw query: teman yang share card list)
// ============================================================================
const getTeamFriendsService = async(userId, limit = 50, offset = 0) => {
    const safeLimit = Number.isFinite(Number(limit)) ? parseInt(limit, 10) : 50;
    const safeOffset = Number.isFinite(Number(offset)) ? parseInt(offset, 10) : 0;

    const baseQuery = `
    FROM friendships f
    JOIN users u ON (f."user_id" = u."user_id" OR f."friend_id" = u."user_id")
    JOIN card_list_collab clc1 ON clc1."user_id" = :userId
    JOIN card_list_collab clc2 ON clc2."card_id" = clc1."card_id" AND clc2."user_id" = u."user_id"
    WHERE (f."user_id" = :userId OR f."friend_id" = :userId)
      AND f.status = 'accepted'
      AND u."user_id" != :userId
  `;

    const selectQuery = `
    SELECT
      f."fs_id" as "fsId",
      f."user_id" as "userId",
      f."friend_id" as "friendId",
      f.status,
      f."created_at" as "createdAt",
      f."updated_at" as "updatedAt",
      u."user_id" as "friend.userId",
      u."first_name" as "friend.firstName",
      u."last_name" as "friend.lastName",
      u.username as "friend.username",
      u.email as "friend.email"
    ${baseQuery}
    GROUP BY f."fs_id", u."user_id"
    ORDER BY f."created_at" DESC
    LIMIT :limit OFFSET :offset
  `;

    const countQuery = `
    SELECT COUNT(DISTINCT u."user_id") as total
    ${baseQuery}
  `;

    const [friendships, countResult] = await Promise.all([
        sequelize.query(selectQuery, {
            replacements: { userId, limit: safeLimit, offset: safeOffset },
            type: QueryTypes.SELECT,
        }),
        sequelize.query(countQuery, {
            replacements: { userId },
            type: QueryTypes.SELECT,
        }),
    ]);

    // Map flat result → nested shape (mirip output Sequelize)
    const mapped = friendships.map((f) => ({
        fsId: f.fsId,
        userId: f.userId,
        friendId: f.friendId,
        status: f.status,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        friend: {
            userId: f['friend.userId'],
            firstName: f['friend.firstName'],
            lastName: f['friend.lastName'],
            username: f['friend.username'],
            email: f['friend.email'],
        },
    }));

    const total = countResult[0]?.total || 0;

    return { friendships: mapped, total: parseInt(total, 10) };
};

module.exports = {
    sendFriendRequest,
    cancelFriendRequest,
    getAllFriendships,
    getFriendshipById,
    getUserFriends,
    getPendingRequests,
    acceptFriendRequest,
    blockFriend,
    rejectFriendRequest,
    removeFriendship,
    unblockFriend,
    getTeamFriendsService,
};