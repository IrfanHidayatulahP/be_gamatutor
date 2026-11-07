const express = require('express');
const { unlock, getAll, getById, getByUser, getByComponent, checkUnlocked, remove } = require('../controllers/avatarUnlockController');
const { authenticate } = require('../middleware/auth');
const { uuidAvatarUnlockIdParamValidation, uuidUserIdParamValidation, avatarUnlockValidation } = require('../middleware/validation');
const { writeLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticate);

router.post('/', writeLimiter, avatarUnlockValidation, unlock);
router.get('/', getAll);
router.get('/user/:userId', uuidUserIdParamValidation, getByUser);
router.get('/component/:componentId', getByComponent);
router.get('/check/:componentId', checkUnlocked);
router.get('/:id', uuidAvatarUnlockIdParamValidation, getById);
router.delete('/:id', writeLimiter, uuidAvatarUnlockIdParamValidation, remove);

module.exports = router;