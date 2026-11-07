const express = require('express');
const { add, getAll, getById, getByCard, getByUser, updateRole, remove } = require('../controllers/cardListCollabController');
const { authenticate } = require('../middleware/auth');
const { uuidCollabIdParamValidation, uuidCardIdParamValidation, uuidUserIdParamValidation, cardListCollabValidation } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

router.post('/card/:cardId', uuidCardIdParamValidation, cardListCollabValidation, add);
router.get('/', getAll);
router.get('/card/:cardId', uuidCardIdParamValidation, getByCard);
router.get('/user/:userId', uuidUserIdParamValidation, getByUser);
router.get('/:id', uuidCollabIdParamValidation, getById);
router.put('/:id/role', uuidCollabIdParamValidation, cardListCollabValidation, updateRole);
router.delete('/:id', uuidCollabIdParamValidation, remove);

module.exports = router;