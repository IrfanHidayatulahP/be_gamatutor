const { MonthlyEvaluation, Card, User } = require('../models');
const { evaluatePerformance } = require('../utils/evalAlgorithma');
const llmEvalService = require('./llmEvalService');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

exports.checkAndGenerate = async (userId) => {
  if (!userId) throw new Error('userId tidak valid');

  const allCards = await Card.findAll({
    where: { userId, deleted: false },
    order: [['createdAt', 'ASC']],
  });

  if (allCards.length === 0) {
    console.log(`⏳ User ${userId} belum punya card — belum waktunya evaluasi`);
    return { show_eval: false };
  }

  const firstCardDate = new Date(allCards[0].createdAt);
  const daysSinceFirstCard = Math.floor(
    (Date.now() - firstCardDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceFirstCard < 30) {
    console.log(
      `⏳ User baru ${daysSinceFirstCard} hari belajar — belum 30 hari, skip evaluasi`
    );
    return { show_eval: false };
  }

  if (allCards.length < 3) {
    console.log(
      `⏳ Hanya ${allCards.length} card — minimal 3 card untuk evaluasi bulanan`
    );
    return { show_eval: false };
  }
  const currentMonth = new Date().toISOString().slice(0, 7);

  const existing = await MonthlyEvaluation.findOne({
    where: { userId, monthYear: currentMonth },
  });

  if (existing) {
    const issues = existing.detectedIssues || {};
    const hasAnomalies = (issues.stalled_cards ?? 0) > 0;
    const hasReflection = !!issues.user_reflection_reason;

    if (hasAnomalies && !hasReflection) {
      console.log('⏸️  Anomalies detected — waiting for reflection');
      return {
        show_eval: true,
        needs_reflection: true,
        evaluation: existing,
      };
    }

    console.log('♻️  Reusing existing evaluation (no LLM call)');
    return {
      show_eval: true,
      needs_reflection: false,
      evaluation: existing,
    };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const cards = await Card.findAll({
    where: {
      userId,
      createdAt: { [Op.gte]: thirtyDaysAgo },
      deleted: false,
    },
  });

  const evalResult =
    cards && cards.length > 0
      ? evaluatePerformance(cards)
      : {
          total_score: 0,
          total_cards: 0,
          completion_rate: 0,
          avg_completion_hours: 0,
          stalled_cards: 0,
          requires_retake: false,
        };

  const hasAnomalies = (evalResult.stalled_cards ?? 0) > 0;

  if (hasAnomalies) {
    const newEval = await MonthlyEvaluation.create({
      userId,
      monthYear: currentMonth,
      isSynchronized: !evalResult.requires_retake,
      requiresQuizRetake: evalResult.requires_retake,
      detectedIssues: { ...evalResult },
      llmFeedback: '(Menunggu jawaban refleksi kamu...)',
    });

    console.log(
      `⏸️  Saved metrics, waiting for reflection (stalled=${evalResult.stalled_cards})`
    );

    return {
      show_eval: true,
      needs_reflection: true,
      evaluation: newEval,
    };
  }

  let feedback;
  try {
    feedback = await llmEvalService.generateMonthlyFeedback({
      ...evalResult,
      total_cards: cards.length,
      userReason: null,
    });
  } catch (e) {
    console.error('LLM failed, using fallback:', e.message);
    feedback =
      'Evaluasi bulan ini selesai diproses. Tetap semangat belajar! 🌱';
  }

  const newEval = await MonthlyEvaluation.create({
    userId,
    monthYear: currentMonth,
    isSynchronized: !evalResult.requires_retake,
    requiresQuizRetake: evalResult.requires_retake,
    detectedIssues: { ...evalResult },
    llmFeedback: feedback,
  });

  return {
    show_eval: true,
    needs_reflection: false,
    evaluation: newEval,
  };
};


exports.submitReflection = async (userId, monthYear, userReason) => {
  if (!userId) throw new Error('userId tidak valid');
  if (!monthYear) throw new Error('monthYear tidak valid');
  if (!userReason) throw new Error('userReason tidak valid');

  const monthlyEval = await MonthlyEvaluation.findOne({
    where: { userId, monthYear },
  });
  if (!monthlyEval) throw new Error('Evaluasi tidak ditemukan');

  const updatedIssues = {
    ...monthlyEval.detectedIssues,
    user_reflection_reason: userReason,
  };

  let newFeedback;
  try {
    newFeedback = await llmEvalService.generateMonthlyFeedback(
      {
        total_score: updatedIssues.total_score,
        total_cards: updatedIssues.total_cards,
        completion_rate: updatedIssues.completion_rate,
        avg_completion_hours: updatedIssues.avg_completion_hours,
        stalled_cards: updatedIssues.stalled_cards,
        requires_retake: updatedIssues.requires_retake,
      },
      userReason
    );
  } catch (e) {
    console.error('LLM failed on reflection:', e.message);
    newFeedback =
      'Makasih udah jujur! Yuk coba kuis ulang biar strategi belajar lebih pas. 💪';
  }

  await monthlyEval.update({
    detectedIssues: updatedIssues,
    llmFeedback: newFeedback,
  });

  return { show_eval: true, needs_reflection: false, evaluation: monthlyEval };
};

const createMonthlyEvaluation = async (userId, dataPayload) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);

  const existing = await MonthlyEvaluation.findOne({
    where: { userId, monthYear: dataPayload.monthYear },
  });
  if (existing) {
    throw new AppError('Monthly evaluation for this month already exists', 400);
  }

  return MonthlyEvaluation.create({ userId, ...dataPayload });
};

const getAllMonthlyEvaluations = async (filters = {}) => {
  const where = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.monthYear) where.monthYear = filters.monthYear;
  if (filters.isSynchronized !== undefined)
    where.isSynchronized = filters.isSynchronized;

  return MonthlyEvaluation.findAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['userId', 'firstName', 'lastName', 'username'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  });
};

const getMonthlyEvaluationById = async (id) => {
  const evaluation = await MonthlyEvaluation.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['userId', 'firstName', 'lastName', 'username'],
      },
    ],
  });
  if (!evaluation) throw new AppError('Monthly evaluation not found', 404);
  return evaluation;
};

const getMonthlyEvaluationsByUser = async (userId, filters = {}) => {
  const where = { userId };
  if (filters.monthYear) where.monthYear = filters.monthYear;

  return MonthlyEvaluation.findAll({
    where,
    order: [['monthYear', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  });
};

const getMonthlyEvaluationByUserAndMonth = async (userId, monthYear) => {
  return MonthlyEvaluation.findOne({ where: { userId, monthYear } });
};

const updateMonthlyEvaluation = async (id, dataPayload) => {
  const evaluation = await MonthlyEvaluation.findByPk(id);
  if (!evaluation) throw new AppError('Monthly evaluation not found', 404);
  return evaluation.update(dataPayload);
};

const deleteMonthlyEvaluation = async (id) => {
  const evaluation = await MonthlyEvaluation.findByPk(id);
  if (!evaluation) throw new AppError('Monthly evaluation not found', 404);
  await evaluation.destroy();
  return { message: 'Monthly evaluation deleted' };
};

module.exports = {
  checkAndGenerate: exports.checkAndGenerate,
  submitReflection: exports.submitReflection,
  createMonthlyEvaluation,
  getAllMonthlyEvaluations,
  getMonthlyEvaluationById,
  getMonthlyEvaluationsByUser,
  getMonthlyEvaluationByUserAndMonth,
  updateMonthlyEvaluation,
  deleteMonthlyEvaluation,
};