const express = require('express');
const { create, getAll, getById, getByUser, getLatestByUser, update, remove } = require('../controllers/userQuizResultController');
const { authenticate, authorize } = require('../middleware/auth');
const { uuidQuizResultIdParamValidation, uuidUserIdParamValidation, userQuizResultValidation } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

router.post('/', userQuizResultValidation, create);
router.get('/', authorize('admin'), getAll);
router.get('/latest/:userId', uuidUserIdParamValidation, getLatestByUser);
router.get('/user/:userId', uuidUserIdParamValidation, getByUser);
router.get('/:id', uuidQuizResultIdParamValidation, getById);
router.put('/:id', uuidQuizResultIdParamValidation, userQuizResultValidation, authorize('admin'), update);
router.delete('/:id', uuidQuizResultIdParamValidation, authorize('admin'), remove);

module.exports = router;