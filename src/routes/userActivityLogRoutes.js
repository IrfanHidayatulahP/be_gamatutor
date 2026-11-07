const express = require('express');
const { create, getAll, getById, getByUser, getByType, remove } = require('../controllers/userActivityLogController');
const { authenticate, authorize } = require('../middleware/auth');
const { uuidActivityLogIdParamValidation, uuidUserIdParamValidation, userActivityLogValidation } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

router.post('/', userActivityLogValidation, create);
router.get('/', authorize('admin'), getAll);
router.get('/user/:userId', uuidUserIdParamValidation, getByUser);
router.get('/type/:activityType', getByType);
router.get('/:id', uuidActivityLogIdParamValidation, getById);
router.delete('/:id', uuidActivityLogIdParamValidation, authorize('admin'), remove);

module.exports = router;