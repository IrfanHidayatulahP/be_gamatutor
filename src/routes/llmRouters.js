const express = require('express');
const { getQuestions, getFeedback, submitQuiz } = require('../controllers/llmController');
const { authenticate } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticate);

// ---- Read ----
router.get('/questions', getQuestions);

// ---- Write ----
router.post('/submit-quiz', writeLimiter, submitQuiz);
router.post('/generate-feedback', writeLimiter, getFeedback);

module.exports = router;