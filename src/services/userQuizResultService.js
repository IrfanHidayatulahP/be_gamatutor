const { UserQuizResult, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const CATEGORIES = ['organization', 'time_management', 'metacognitive_self_regulation', 'help_seeking', 'elaboration', 'rehearsal'];
const EXPECTED_QUESTIONS_PER_CATEGORY = 4;
const EXPECTED_TOTAL_QUESTIONS = 24;
const THRESHOLDS = { HIGH: 70, MEDIUM: 40, UNLOCK: 60, BALANCED_SPREAD: 20 };
const PROFILE_NAMES = {
  organization: 'The Architect', time_management: 'The Planner',
  metacognitive_self_regulation: 'The Reflector', help_seeking: 'The Collaborator',
  elaboration: 'The Connector', rehearsal: 'The Memorizer',
};
const XP_PER_QUESTION = 10;
const XP_BONUS_IDEAL = 5;

function calculateXp(answers) {
  return answers.reduce((sum, a) => sum + XP_PER_QUESTION + (a.score === 3 ? XP_BONUS_IDEAL : 0), 0);
}

async function calculateStreak(userId) {
  const results = await UserQuizResult.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 60, raw: true });
  if (results.length === 0) return 1;
  const dayKey = (dt) => { const d = new Date(dt); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
  let streak = 1; let prev = new Date(results[0].createdAt); prev.setHours(0, 0, 0, 0);
  for (let i = 1; i < results.length; i++) {
    const curr = new Date(results[i].createdAt); curr.setHours(0, 0, 0, 0);
    if (dayKey(curr) === dayKey(prev)) continue;
    const diff = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
    if (diff === 1) { streak++; prev = curr; } else break;
  }
  return streak;
}

const calculateQuizResult = (answersPayload) => {
  const raw = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
  const counts = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
  answersPayload.forEach(a => { raw[a.category] += a.score; counts[a.category] += 1; });

  const normalized = {};
  CATEGORIES.forEach(cat => {
    const min = counts[cat] * 1, max = counts[cat] * 3, range = max - min;
    const ratio = range === 0 ? 0 : (raw[cat] - min) / range;
    normalized[cat] = Math.round(Math.max(0, Math.min(100, ratio * 100)));
  });

  const ranked = Object.entries(normalized).map(([category, score]) => ({ category, score })).sort((a, b) => b.score - a.score);
  const top = ranked[0], bottom = ranked[ranked.length - 1];
  const spread = top.score - bottom.score;
  const isBalanced = spread <= THRESHOLDS.BALANCED_SPREAD;

  const unlocked = ranked.filter(r => r.score < THRESHOLDS.UNLOCK).map(r => r.category);

  return {
    dominant_strategy: isBalanced ? null : top.category,
    user_profile: isBalanced ? 'The All-Rounder' : PROFILE_NAMES[top.category],
    is_balanced: isBalanced,
    spread,
    normalized_scores: normalized,
    ranked,
    unlocked_features: unlocked,
    locked_features: ranked.filter(r => r.score >= THRESHOLDS.UNLOCK).map(r => r.category),
  };
};


const createQuizResult = async (userId, answersPayload) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User tidak ditemukan');

  const calculatedData = calculateQuizResult(answersPayload);
  const xp_earned = calculateXp(answersPayload);
  const streak_days = await calculateStreak(userId);

  const saved = await UserQuizResult.create({
    userId,
    dominantStrategy: calculatedData.dominant_strategy,
    userProfile: calculatedData.user_profile,
    unlockedFeatures: calculatedData.unlocked_features,
    lockedFeatures: calculatedData.locked_features,
    answersPayload: {
      answers: answersPayload,
      normalized_scores: calculatedData.normalized_scores,
      xp_earned, streak_days
    }
  });

  // Update tabel Users (Atomic Increment)
  await User.increment('xp', { by: xp_earned, where: { userId } });

  return {
    quiz_result_id: saved.quizResultId,
    user_profile: calculatedData.user_profile,
    dominant_strategy: calculatedData.dominant_strategy,
    unlocked_features: calculatedData.unlocked_features,
    locked_features: calculatedData.locked_features,
    normalized_scores: calculatedData.normalized_scores,
    xp_earned, streak_days,
  };
};


const getAllQuizResults = async (filters = {}) => {
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
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  });
};

const getQuizResultById = async (id) => {
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

const getQuizResultsByUser = async (userId, filters = {}) => {
  return UserQuizResult.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  });
};

const getLatestQuizResultByUser = async (userId) => {
  return UserQuizResult.findOne({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });
};

const updateQuizResult = async (id, data) => {
  const result = await UserQuizResult.findByPk(id);
  if (!result) throw new AppError('Quiz result not found', 404);
  return result.update(data);
};

const deleteQuizResult = async (id) => {
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

  // Expose helpers untuk unit test
  _internal: {
    calculateQuizResult,
    calculateXp,
    calculateStreak
  },
};