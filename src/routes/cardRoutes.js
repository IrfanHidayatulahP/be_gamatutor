const express = require('express');
const { createNewCard, getCard, getCards, updateExistingCard, deleteExistingCard } = require('../controllers/cardController');
const { cardValidation, uuidParamValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiter');
const cardListCollabController = require('../controllers/cardListCollabController');

const router = express.Router();

router.use(authenticate);

router.post('/', writeLimiter, cardValidation, createNewCard);
router.get('/', getCards);
router.get('/:id', uuidParamValidation, getCard);
router.put('/:id', writeLimiter, uuidParamValidation, cardValidation, updateExistingCard);
router.delete('/:id', writeLimiter, uuidParamValidation, deleteExistingCard);

router.put('/:cardId/collaboration/accept', writeLimiter, cardListCollabController.acceptCollaboration);

module.exports = router;