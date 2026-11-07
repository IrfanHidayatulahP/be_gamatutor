const express = require('express');
const { getProgress, getAllCardsForProgress } = require('../controllers/progressController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getProgress);
router.get('/board/cards/all', getAllCardsForProgress);

module.exports = router;