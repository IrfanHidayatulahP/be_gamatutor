const express = require('express');
const { create, getAll, getById, getByName, update, remove } = require('../controllers/llmPromptTemplateController');
const { authenticate, authorize } = require('../middleware/auth');
const { uuidLlmPromptTemplateIdParamValidation, llmPromptTemplateValidation } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin')); // Only admin can manage prompt templates

router.post('/', llmPromptTemplateValidation, create);
router.get('/', getAll);
router.get('/name/:templateName', getByName);
router.get('/:id', uuidLlmPromptTemplateIdParamValidation, getById);
router.put('/:id', uuidLlmPromptTemplateIdParamValidation, llmPromptTemplateValidation, update);
router.delete('/:id', uuidLlmPromptTemplateIdParamValidation, remove);

module.exports = router;