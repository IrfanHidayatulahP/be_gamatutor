const express = require('express');
const {
    sendRequest,
    cancelRequest,
    getAll,
    getById,
    getFriends,
    getPending,
    getTeamFriends,
    accept,
    block,
    reject,
    unblock,
    remove,
} = require('../controllers/friendshipController');
const {
    friendshipValidation,
    uuidFriendshipIdParamValidation,
    uuidUserIdParamValidation,
} = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticate);

// ---- Write routes ----
router.post('/', writeLimiter, friendshipValidation, sendRequest);
router.delete(
    '/cancel/:friendId',
    writeLimiter,
    uuidUserIdParamValidation,
    cancelRequest
);

// ---- Read routes: user-scoped ----
router.get('/', getAll);
router.get('/user/:userId/friends', uuidUserIdParamValidation, getFriends);
router.get('/user/:userId/pending', uuidUserIdParamValidation, getPending);
router.get('/user/:userId/team-friends', uuidUserIdParamValidation, getTeamFriends);

// ---- Read routes: by id ----
router.get('/:fsId', uuidFriendshipIdParamValidation, getById);

// ---- Update routes ----
router.put('/:fsId/accept', writeLimiter, uuidFriendshipIdParamValidation, accept);
router.put('/:fsId/block', writeLimiter, uuidFriendshipIdParamValidation, block);
router.put('/:fsId/reject', writeLimiter, uuidFriendshipIdParamValidation, reject);
router.put('/:fsId/unblock', writeLimiter, uuidFriendshipIdParamValidation, unblock);

// ---- Delete ----
router.delete('/:fsId', writeLimiter, uuidFriendshipIdParamValidation, remove);

module.exports = router;