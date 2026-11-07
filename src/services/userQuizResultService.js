const { UserQuizResult, User, MslqStaticQuestion } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const CATEGORIES = [
    'organization',
    'time_management',
    'metacognitive_self_regulation',
    'help_seeking',
    'elaboration',
    'rehearsal'
];

const THRESHOLDS = { HIGH: 70, MEDIUM: 40, UNLOCK: 60, BALANCED_SPREAD: 20 };

const PROFILE_NAMES = {
    organization: 'The Architect',
    time_management: 'The Planner',
    metacognitive_self_regulation: 'The Reflector',
    help_seeking: 'The Collaborator',
    elaboration: 'The Connector',
    rehearsal: 'The Memorizer',
};

const XP_PER_QUESTION = 10;
const XP_BONUS_IDEAL = 5;

function calculateXp(answers) {
    if (Array.isArray(answers)) {
        return answers.reduce((sum, a) => sum + XP_PER_QUESTION + (a.score === 3 ? XP_BONUS_IDEAL : 0), 0);
    }
    const count = typeof answers === 'object' && answers !== null ? Object.keys(answers).length : 24;
    return count * XP_PER_QUESTION;
}

async function calculateStreak(userId) {
    const results = await UserQuizResult.findAll({
        where: { userId },
        order: [
            ['createdAt', 'DESC']
        ],
        limit: 60,
        raw: true
    });
    if (results.length === 0) return 1;

    const dayKey = (dt) => {
        const d = new Date(dt);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    };

    let streak = 1;
    let prev = new Date(results[0].createdAt);
    prev.setHours(0, 0, 0, 0);

    for (let i = 1; i < results.length; i++) {
        const curr = new Date(results[i].createdAt);
        curr.setHours(0, 0, 0, 0);
        if (dayKey(curr) === dayKey(prev)) continue;
        const diff = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
            streak++;
            prev = curr;
        } else {
            break;
        }
    }
    return streak;
}

async function processAnswersPayload(payload) {
    // Jika payload berupa array [{ category, score }] 
    if (Array.isArray(payload)) {
        const raw = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
        const counts = Object.fromEntries(CATEGORIES.map(c => [c, 0]));

        payload.forEach(a => {
            if (raw[a.category] !== undefined) {
                raw[a.category] += Number(a.score);
                counts[a.category] += 1;
            }
        });

        const normalized = {};
        CATEGORIES.forEach(cat => {
            const min = counts[cat] * 1;
            const max = counts[cat] * 3;
            const range = max - min;
            const ratio = range === 0 ? 0 : (raw[cat] - min) / range;
            normalized[cat] = Math.round(Math.max(0, Math.min(100, ratio * 100)));
        });

        const ranked = Object.entries(normalized)
            .map(([category, score]) => ({ category, score }))
            .sort((a, b) => b.score - a.score);

        const top = ranked[0];
        const bottom = ranked[ranked.length - 1];
        const spread = top.score - bottom.score;
        const isBalanced = spread <= THRESHOLDS.BALANCED_SPREAD;

        return {
            dominant_strategy: isBalanced ? null : top.category,
            user_profile: isBalanced ? 'The All-Rounder' : PROFILE_NAMES[top.category],
            normalized_scores: normalized,
            ranked,
            unlocked_features: ranked.filter(r => r.score < THRESHOLDS.UNLOCK).map(r => r.category),
            locked_features: ranked.filter(r => r.score >= THRESHOLDS.UNLOCK).map(r => r.category),
        };
    }

    // Jika payload berupa objek { questionId: selectedOption } 
    const questions = await MslqStaticQuestion.findAll({
        attributes: ['staticQId', 'category']
    });

    const questionCategoryMap = {};
    questions.forEach(q => {
        questionCategoryMap[q.staticQId] = q.category;
    });

    const categoryScores = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
    const categoryCounts = Object.fromEntries(CATEGORIES.map(c => [c, 0]));

    for (const [qId, optVal] of Object.entries(payload)) {
        const cat = questionCategoryMap[qId];
        const score = parseInt(optVal, 10);
        if (cat && categoryScores[cat] !== undefined && !isNaN(score)) {
            categoryScores[cat] += score;
            categoryCounts[cat] += 1;
        }
    }

    const normalized = {};
    CATEGORIES.forEach(cat => {
        const count = categoryCounts[cat] || 1;
        const rawScore = categoryScores[cat] || 0;
        const maxScore = count * 3;
        normalized[cat] = Math.round((rawScore / maxScore) * 100);
    });

    const ranked = Object.entries(normalized)
        .map(([category, score]) => ({ category, score }))
        .sort((a, b) => b.score - a.score);

    const topCategory = ranked[0].category;

    return {
        dominant_strategy: topCategory,
        user_profile: PROFILE_NAMES[topCategory] || 'The Adaptive Learner',
        normalized_scores: normalized,
        ranked,
        unlocked_features: ranked.slice(0, 3).map(r => r.category),
        locked_features: ranked.slice(3).map(r => r.category),
    };
}

const createQuizResult = async(userId, dataPayload) => {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    const rawAnswers = dataPayload.answersPayload || dataPayload;
    const processed = await processAnswersPayload(rawAnswers);

    const xpEarned = calculateXp(rawAnswers);
    const streakDays = await calculateStreak(userId);

    const saved = await UserQuizResult.create({
        userId,
        dominantStrategy: processed.dominant_strategy,
        userProfile: processed.user_profile,
        unlockedFeatures: processed.unlocked_features,
        lockedFeatures: processed.locked_features,
        answersPayload: {
            answers: rawAnswers,
            normalized_scores: processed.normalized_scores,
            xp_earned: xpEarned,
            streak_days: streakDays
        }
    });

    // Tambahkan XP ke akun pengguna secara atomik 
    await User.increment('xp', { by: xpEarned, where: { userId } });

    return {
        quiz_result_id: saved.quizResultId,
        user_profile: processed.user_profile,
        dominant_strategy: processed.dominant_strategy,
        unlocked_features: processed.unlocked_features,
        locked_features: processed.locked_features,
        normalized_scores: processed.normalized_scores,
        xp_earned: xpEarned,
        streak_days: streakDays,
    };
};

const getAllQuizResults = async(filters = {}) => {
    const where = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.dominantStrategy) where.dominantStrategy = filters.dominantStrategy;

    return UserQuizResult.findAll({
        where,
        include: [{
            model: User,
            as: 'user',
            attributes: ['userId', 'firstName', 'lastName', 'username'],
        }],
        order: [
            ['createdAt', 'DESC']
        ],
        limit: filters.limit || 50,
        offset: filters.offset || 0,
    });
};

const getQuizResultById = async(id) => {
    const result = await UserQuizResult.findByPk(id, {
        include: [{
            model: User,
            as: 'user',
            attributes: ['userId', 'firstName', 'lastName', 'username'],
        }],
    });
    if (!result) throw new AppError('Quiz result not found', 404);
    return result;
};

const getQuizResultsByUser = async(userId, filters = {}) => {
    return UserQuizResult.findAll({
        where: { userId },
        order: [
            ['createdAt', 'DESC']
        ],
        limit: filters.limit || 50,
        offset: filters.offset || 0,
    });
};

const getLatestQuizResultByUser = async(userId) => {
    return UserQuizResult.findOne({
        where: { userId },
        order: [
            ['createdAt', 'DESC']
        ],
    });
};

const updateQuizResult = async(id, data) => {
    const result = await UserQuizResult.findByPk(id);
    if (!result) throw new AppError('Quiz result not found', 404);
    return result.update(data);
};

const deleteQuizResult = async(id) => {
    const result = await UserQuizResult.findByPk(id);
    if (!result) throw new AppError('Quiz result not found', 404);
    await result.destroy();
    return { message: 'Quiz result deleted' };
};

module.exports = {
    createQuizResult,
    getAllQuizResults,
    getQuizResultById,
    getQuizResultsByUser,
    getLatestQuizResultByUser,
    updateQuizResult,
    deleteQuizResult,
    _internal: {
        processAnswersPayload,
        calculateXp,
        calculateStreak
    }
};