// const express = require('express');
// const { sendRequest, getAll, getById, getFriends, getPending, accept, block, reject, remove } = require('../controllers/friendshipController');
// const { friendshipValidation, uuidFriendshipIdParamValidation, uuidUserIdParamValidation } = require('../middleware/validation');
// const { authenticate } = require('../middleware/auth');

// const router = express.Router();

// router.use(authenticate);

// router.post('/', friendshipValidation, sendRequest);
// router.get('/', getAll);
// router.get('/user/:userId/friends', uuidUserIdParamValidation, getFriends);
// router.get('/user/:userId/pending', uuidUserIdParamValidation, getPending);
// router.get('/:fsId', uuidFriendshipIdParamValidation, getById);
// router.put('/:fsId/accept', uuidFriendshipIdParamValidation, accept);
// router.put('/:fsId/block', uuidFriendshipIdParamValidation, block);
// router.put('/:fsId/reject', uuidFriendshipIdParamValidation, reject);
// router.delete('/:fsId', uuidFriendshipIdParamValidation, remove);

// module.exports = router;

const express = require('express');
const { sendRequest, cancelRequest, getAll, getById, getFriends, getPending, accept, block, reject, remove } = require('../controllers/friendshipController');
const { friendshipValidation, uuidFriendshipIdParamValidation, uuidUserIdParamValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', friendshipValidation, sendRequest);
router.delete('/cancel/:friendId', cancelRequest);
router.get('/', getAll);
router.get('/user/:userId/friends', uuidUserIdParamValidation, getFriends);
router.get('/user/:userId/pending', uuidUserIdParamValidation, getPending);
router.get('/:fsId', uuidFriendshipIdParamValidation, getById);
router.put('/:fsId/accept', uuidFriendshipIdParamValidation, accept);
router.put('/:fsId/block', uuidFriendshipIdParamValidation, block);
router.put('/:fsId/reject', uuidFriendshipIdParamValidation, reject);
router.delete('/:fsId', uuidFriendshipIdParamValidation, remove);

module.exports = router;