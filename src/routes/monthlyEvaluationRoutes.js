const express = require('express');
const {
    create,
    getAll,
    getById,
    getByUser,
    getByUserAndMonth,
    update,
    remove,
    ckStatus,
    reflect,
} = require('../controllers/monthlyEvaluationController');
const { authenticate, authorize } = require('../middleware/auth');
const {
    uuidMonthlyEvalIdParamValidation,
    uuidUserIdParamValidation,
    monthlyEvaluationValidation,
    monthlyEvalReflectionValidation,
} = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

// ---- Custom actions (HARUS di atas /:id) ----
router.get('/check-status', ckStatus);
router.post('/reflect', monthlyEvalReflectionValidation, reflect);

// ---- CRUD ----
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