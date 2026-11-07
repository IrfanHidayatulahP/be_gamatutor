const express = require('express');
const { create, getAll, getById, getByCollab, update, remove } = require('../controllers/cardListChatController');
const { authenticate } = require('../middleware/auth');
const { uuidCollabIdParamValidation, uuidChatMsgIdParamValidation, cardListChatValidation } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

router.post('/collab/:collabId', uuidCollabIdParamValidation, cardListChatValidation, create);
router.get('/', getAll);
router.get('/collab/:collabId', uuidCollabIdParamValidation, getByCollab);
router.get('/:id', uuidChatMsgIdParamValidation, getById);
router.put('/:id', uuidChatMsgIdParamValidation, cardListChatValidation, update);
router.delete('/:id', uuidChatMsgIdParamValidation, remove);

module.exports = router;