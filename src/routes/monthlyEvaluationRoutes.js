const express = require('express');
const { create, getAll, getById, getByUser, getByUserAndMonth, update, remove, ckStatus, reflect } = require('../controllers/monthlyEvaluationController');
const { authenticate, authorize } = require('../middleware/auth');
const { uuidMonthlyEvalIdParamValidation, uuidUserIdParamValidation, monthlyEvaluationValidation } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

router.get('/check-status', ckStatus);
router.post('/reflect', reflect);

router.post('/', monthlyEvaluationValidation, create);
router.get('/', authorize('admin'), getAll);
router.get('/user/:userId', uuidUserIdParamValidation, getByUser);
router.get(
  '/user/:userId/month/:monthYear',
  uuidUserIdParamValidation,
  getByUserAndMonth
);
router.get('/:id', uuidMonthlyEvalIdParamValidation, getById);
router.put(
  '/:id',
  uuidMonthlyEvalIdParamValidation,
  monthlyEvaluationValidation,
  authorize('admin'),
  update
);
router.delete('/:id', uuidMonthlyEvalIdParamValidation, authorize('admin'), remove);

module.exports = router;