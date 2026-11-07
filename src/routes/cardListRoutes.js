// const express = require('express');
// const { createNewCardList, getCardList, updateExistingCardList, deleteExistingCardList } = require('../controllers/cardListController');
// const { cardListValidation, uuidCardIdParamValidation } = require('../middleware/validation');
// const { authenticate } = require('../middleware/auth');

// const router = express.Router({ mergeParams: true });

// router.use(authenticate);

// router.post('/', cardListValidation, createNewCardList);
// router.get('/', uuidCardIdParamValidation, getCardList);
// router.put('/:clId', cardListValidation, updateExistingCardList);
// router.delete('/:clId', deleteExistingCardList);

// module.exports = router;

const express = require('express');
const { createNewCardList, getCardList, updateExistingCardList, deleteExistingCardList } = require('../controllers/cardListController');
const { cardListValidation, uuidCardIdParamValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post('/', cardListValidation, createNewCardList);
router.get('/', uuidCardIdParamValidation, getCardList);
router.put('/:clId', cardListValidation, updateExistingCardList);
router.delete('/:clId', deleteExistingCardList);

module.exports = router;