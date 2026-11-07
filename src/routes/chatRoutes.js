const express = require('express');
const { create, getAll, getById, getByUser, update, remove, getConversation } = require('../controllers/chatController');
const { chatValidation, uuidParamValidation, uuidUserIdParamValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticate);

router.post('/', writeLimiter, chatValidation, create);
router.get('/', getAll);
router.get('/user/:userId', uuidUserIdParamValidation, getByUser);
router.get('/conversation/:id', uuidParamValidation, getConversation);
router.get('/:id', uuidParamValidation, getById);
router.put('/:id', writeLimiter, uuidParamValidation, chatValidation, update);
router.delete('/:id', writeLimiter, uuidParamValidation, remove);

module.exports = router;