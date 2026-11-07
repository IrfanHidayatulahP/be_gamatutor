const express = require('express');
const { create, getAll, getById, getByCategory, update, remove } = require('../controllers/avatarComponentController');
const { authenticate, authorize } = require('../middleware/auth');
const { uuidAvatarComponentIdParamValidation, avatarComponentValidation } = require('../middleware/validation');
const { writeLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticate);

router.post('/', writeLimiter, authorize('admin'), avatarComponentValidation, create);
router.get('/', getAll);
router.get('/category/:category', getByCategory);
router.get('/:id', uuidAvatarComponentIdParamValidation, getById);
router.put('/:id', writeLimiter, uuidAvatarComponentIdParamValidation, avatarComponentValidation, authorize('admin'), update);
router.delete('/:id', writeLimiter, uuidAvatarComponentIdParamValidation, authorize('admin'), remove);

module.exports = router;