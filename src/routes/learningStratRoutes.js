const express = require('express');
const { create, getAll, getByName, update, remove, getById } = require('../controllers/learningStratController');
const { learningStratValidation, learningStratValidationName, uuidLearningIdParamValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', learningStratValidation, create);
router.get('/', getAll);
router.get('/:learningId', getById);
router.get('/:learningStrategy', learningStratValidationName, getByName);
router.put('/:id', uuidLearningIdParamValidation, learningStratValidation, update);
router.delete('/:id', uuidLearningIdParamValidation, remove);

module.exports = router;