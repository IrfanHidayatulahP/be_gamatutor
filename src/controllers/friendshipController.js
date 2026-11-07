const {
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
} = require('../services/friendshipService');

const sendRequest = async(req, res, next) => {
    try {
        const friendship = await sendFriendRequest(req.user.userId, req.body.friendId);
        res.status(201).json({ friendship });
    } catch (error) {
        next(error);
    }
};

// Cancel pending request — :friendId = user id dari target
const cancelRequest = async(req, res, next) => {
    try {
        const result = await cancelFriendRequest(req.user.userId, req.params.friendId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getAll = async(req, res, next) => {
    try {
        const filters = {
            status: req.query.status,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0,
        };
        const friendships = await getAllFriendships(filters);
        res.json({ friendships });
    } catch (error) {
        next(error);
    }
};

const getById = async(req, res, next) => {
    try {
        const friendship = await getFriendshipById(req.params.fsId);
        res.json({ friendship });
    } catch (error) {
        next(error);
    }
};

const getFriends = async(req, res, next) => {
    try {
        const filters = {
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0,
        };
        const friendships = await getUserFriends(req.params.userId, filters);
        res.json({ friendships });
    } catch (error) {
        next(error);
    }
};

const getPending = async(req, res, next) => {
    try {
        const filters = {
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0,
        };
        const { incoming, outgoing } = await getPendingRequests(req.params.userId, filters);
        res.json({
            incomingRequests: incoming,
            outgoingRequests: outgoing,
            total: (incoming ? incoming.length : 0) + (outgoing ? outgoing.length : 0),
        });
    } catch (error) {
        next(error);
    }
};

const accept = async(req, res, next) => {
    try {
        const friendship = await acceptFriendRequest(req.params.fsId, req.user.userId);
        res.json({ friendship });
    } catch (error) {
        next(error);
    }
};

const block = async(req, res, next) => {
    try {
        const friendship = await blockFriend(req.params.fsId, req.user.userId);
        res.json({ friendship });
    } catch (error) {
        next(error);
    }
};

const unblock = async(req, res, next) => {
    try {
        const friendship = await unblockFriend(req.params.fsId, req.user.userId);
        res.json({ friendship });
    } catch (error) {
        next(error);
    }
};

const reject = async(req, res, next) => {
    try {
        await rejectFriendRequest(req.params.fsId, req.user.userId);
        res.json({ message: 'Friend request rejected' });
    } catch (error) {
        next(error);
    }
};

const remove = async(req, res, next) => {
    try {
        await removeFriendship(req.params.fsId, req.user.userId);
        res.json({ message: 'Friendship removed' });
    } catch (error) {
        next(error);
    }
};

const getTeamFriends = async(req, res, next) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const result = await getTeamFriendsService(userId, parseInt(limit), parseInt(offset));
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sendRequest,
    cancelRequest,
    getAll,
    getById,
    getFriends,
    getPending,
    accept,
    block,
    unblock,
    reject,
    remove,
    getTeamFriends,
};