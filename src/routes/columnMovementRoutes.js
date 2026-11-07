const express = require('express');
const { create, getAll, getById, getByCardId, update, complete, remove } = require('../controllers/columnMovementController');
const { columnMovementValidation, uuidParamValidation, uuidCardIdParamValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', columnMovementValidation, create);
router.get('/', getAll);
router.get('/card/:cardId', uuidCardIdParamValidation, getByCardId);
router.get('/:id', uuidParamValidation, getById);
router.put('/:id', uuidParamValidation, columnMovementValidation, update);
router.put('/:id/complete', uuidParamValidation, complete);
router.delete('/:id', uuidParamValidation, remove);

module.exports = router;