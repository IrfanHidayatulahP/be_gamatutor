const llmQuizService = require('../services/llmQuizService');
const llmRecService = require('../services/llmRekomendasiService');
const { LlmRecommendationHistory } = require('../models');

// GET /api/llmRekomen/questions
const getQuestions = async (req, res) => {
  try {
    const q = await llmQuizService.generateDynamicQuestions();
    res.json({ source: 'llm', questions: q });
  } catch (e) {
    console.error("Fallback:", e.message);
    const fallback = await llmQuizService.getStaticQuestions();
    res.json({ source: 'static_fallback', questions: fallback });
  }
};

// POST /api/llm/generate-feedback
const getFeedback = async (req, res) => {
  const fb = await llmRecService.generateFirstFeedback(req.body.dominantStrategy, req.body.userProfile);
  res.json({ feedback: fb });
};

module.exports = {
  getQuestions,
  getFeedback
};