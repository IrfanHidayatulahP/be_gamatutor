const express = require('express');
const { createNewCardList, getCardList, updateExistingCardList, deleteExistingCardList } = require('../controllers/cardListController');
const { cardListValidation, uuidCardIdParamValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiter');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post('/', writeLimiter, cardListValidation, createNewCardList);
router.get('/', uuidCardIdParamValidation, getCardList);
router.put('/:clId', writeLimiter, cardListValidation, updateExistingCardList);
router.delete('/:clId', writeLimiter, deleteExistingCardList);

module.exports = router;