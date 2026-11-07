const express = require('express');
const { create, getAll, getById, getByUser, getByTrigger, remove } = require('../controllers/llmRecommendationHistoryController');
const { authenticate, authorize } = require('../middleware/auth');
const { uuidLlmRecIdParamValidation, uuidUserIdParamValidation, llmRecommendationHistoryValidation } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

router.post('/', llmRecommendationHistoryValidation, create);
router.get('/', authorize('admin'), getAll);
router.get('/user/:userId', uuidUserIdParamValidation, getByUser);
router.get('/trigger/:triggerType', getByTrigger);
router.get('/:id', uuidLlmRecIdParamValidation, getById);
router.delete('/:id', uuidLlmRecIdParamValidation, authorize('admin'), remove);

module.exports = router;