const express = require('express');
const { create, getAll, getById, getByUser, update, remove } = require('../controllers/chatController');
const { chatValidation, uuidParamValidation, uuidUserIdParamValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', chatValidation, create);
router.get('/', getAll);
router.get('/user/:userId', uuidUserIdParamValidation, getByUser);
router.get('/:id', uuidParamValidation, getById);
router.put('/:id', uuidParamValidation, chatValidation, update);
router.delete('/:id', uuidParamValidation, remove);

module.exports = router;