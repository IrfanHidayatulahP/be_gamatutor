const express = require('express');
const { create, getAll, getById, getByCategory, update, remove } = require('../controllers/mslqStaticQuestionController');
const { authenticate, authorize } = require('../middleware/auth');
const { uuidMslqQuestionIdParamValidation, mslqStaticQuestionValidation } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);
// Allow all authenticated users to read questions, only admin can write
router.post('/', authorize('admin'), mslqStaticQuestionValidation, create);
router.get('/', getAll);
router.get('/category/:category', getByCategory);
router.get('/:id', uuidMslqQuestionIdParamValidation, getById);
router.put('/:id', authorize('admin'), uuidMslqQuestionIdParamValidation, mslqStaticQuestionValidation, update);
router.delete('/:id', authorize('admin'), uuidMslqQuestionIdParamValidation, remove);

module.exports = router;