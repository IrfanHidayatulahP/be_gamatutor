const llmQuizService = require('../services/llmQuizService');
const llmRecService = require('../services/llmRekomendasiService');
const { LlmRecommendationHistory } = require('../models');

// GET /api/llmRekomen/questions
const getQuestions = async(req, res) => {
    try {
        const q = await llmQuizService.generateDynamicQuestions();
        return res.json({ source: 'llm', questions: q });
    } catch (e) {
        console.warn("⚠️ Fallback ke soal statis karena:", e.message);
        try {
            const fallback = await llmQuizService.getStaticQuestions();
            return res.json({ source: 'static_fallback', questions: fallback });
        } catch (fallbackError) {
            console.error("❌ Fallback gagal total:", fallbackError.message);
            return res.status(500).json({
                success: false,
                message: "Gagal memuat pertanyaan: " + fallbackError.message
            });
        }
    }
};

// POST /api/llmRekomen/submit-quiz - MAIN ENDPOINT UNTUK FLUTTER
const submitQuiz = async(req, res) => {
    try {
        const { answers } = req.body;
        const userId = req.user.userId;

        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ success: false, message: 'answers object required' });
        }

        // 1. Rule-based calculation (bekerja tanpa ketergantungan LLM)
        const ruleResult = await llmQuizService.calculateRuleBasedResult(answers);

        // 2. Simpan ke database
        await llmQuizService.saveQuizResult(userId, {
            ...ruleResult,
            answersPayload: answers
        });

        // 3. Try LLM feedback (non-blocking)
        let llmFeedback = null;
        try {
            llmFeedback = await llmRecService.generateFirstFeedback(
                ruleResult.dominant_strategy,
                ruleResult.user_profile
            );
        } catch (e) {
            console.warn('LLM feedback failed, using rule-based fallback:', e.message);
        }

        // 4. Response format sesuai model Flutter (snake_case)
        return res.json({
            ranked: ruleResult.ranked,
            dominant_strategy: ruleResult.dominant_strategy,
            user_profile: ruleResult.user_profile,
            unlocked_features: ruleResult.unlocked_features,
            locked_features: ruleResult.locked_features,
            llm_feedback: llmFeedback,
            rule_based: true
        });

    } catch (error) {
        console.error('submitQuiz error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// POST /api/llmRekomen/generate-feedback
const getFeedback = async(req, res) => {
    try {
        const fb = await llmRecService.generateFirstFeedback(req.body.dominantStrategy, req.body.userProfile);
        return res.json({ feedback: fb });
    } catch (error) {
        console.error("❌ Gagal menghasilkan feedback:", error.message);
        return res.status(500).json({ success: false, message: "Gagal menghasilkan feedback: " + error.message });
    }
};

module.exports = {
    getQuestions,
    submitQuiz,
    getFeedback
};