const express = require('express');
const { getQuestions, getFeedback } = require('../controllers/llmController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/questions', getQuestions);
router.post('/generate-feedback', getFeedback);

module.exports = router;