const { Card, ColumnMovement, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Calculate progress percentage based on column name
 */
const getProgressPercent = (column) => {
  switch ((column || 'planning').toLowerCase()) {
    case 'planning':
      return 25;
    case 'monitoring':
      return 50;
    case 'controlling':
      return 75;
    case 'reflection':
      return 100;
    default:
      return 25;
  }
};

/**
 * Check if a column represents completed (reflection)
 */
const isCompleted = (column) => {
  return (column || 'planning').toLowerCase() === 'reflection';
};

/**
 * Get date filter based on period
 */
const getDateFilter = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'all':
    default:
      return null;
  }

  return { [Op.gte]: startDate };
};

/**
 * Get all cards with their current column for a user
 */
const getAllCardsWithProgress = async (userId) => {
  const cards = await Card.findAll({
    where: {
      userId,
      deleted: false
    },
    include: [
      {
        model: ColumnMovement,
        as: 'columnMovements',
        separate: true,
        order: [['timestamp', 'ASC']]
      }
    ],
    order: [['createdAt', 'ASC']]
  });

  return cards.map(card => {
    const cardJson = card.toJSON();
    let currentColumn = 'planning';

    if (cardJson.columnMovements && cardJson.columnMovements.length > 0) {
      const latestMovement = cardJson.columnMovements[cardJson.columnMovements.length - 1];
      if (latestMovement.toColumn) {
        currentColumn = latestMovement.toColumn;
      }
    }

    return {
      ...cardJson,
      currentColumn
    };
  });
};

/**
 * Get progress summary and task list for a user
 */
const getProgressSummary = async (userId, period = 'week') => {
  const dateFilter = getDateFilter(period);
  const whereClause = {
    userId,
    deleted: false
  };

  if (dateFilter) {
    whereClause.createdAt = dateFilter;
  }

  const cards = await Card.findAll({
    where: whereClause,
    include: [
      {
        model: ColumnMovement,
        as: 'columnMovements',
        separate: true,
        order: [['timestamp', 'ASC']]
      }
    ],
    order: [['createdAt', 'ASC']]
  });

  const taskProgressList = cards.map(card => {
    const cardJson = card.toJSON();
    let currentColumn = 'planning';

    if (cardJson.columnMovements && cardJson.columnMovements.length > 0) {
      const latestMovement = cardJson.columnMovements[cardJson.columnMovements.length - 1];
      if (latestMovement.toColumn) {
        currentColumn = latestMovement.toColumn;
      }
    }

    const progressPercent = getProgressPercent(currentColumn);
    const completed = isCompleted(currentColumn);

    return {
      cardId: cardJson.cardId,
      title: cardJson.title,
      currentColumn,
      createdAt: cardJson.createdAt,
      deleted: cardJson.deleted || false,
      progressPercent
    };
  });

  const totalCards = taskProgressList.length;
  const completedCards = taskProgressList.filter(t => t.progressPercent === 100).length;
  const completionRate = totalCards > 0
    ? (taskProgressList.reduce((sum, t) => sum + t.progressPercent, 0) / totalCards)
    : 0;

  return {
    totalCards,
    completedCards,
    completionRate: parseFloat(completionRate.toFixed(1)),
    taskProgressList
  };
};

/**
 * Get growth data points for the chart
 * Groups by date and calculates average progress per day
 */
const getGrowthData = async (userId, period = 'week') => {
  const dateFilter = getDateFilter(period);
  const whereClause = {
    userId,
    deleted: false
  };

  if (dateFilter) {
    whereClause.createdAt = dateFilter;
  }

  const cards = await Card.findAll({
    where: whereClause,
    include: [
      {
        model: ColumnMovement,
        as: 'columnMovements',
        separate: true,
        order: [['timestamp', 'ASC']]
      }
    ],
    order: [['createdAt', 'ASC']]
  });

  // Group by date (day level)
  const dailyData = {};

  cards.forEach(card => {
    const cardJson = card.toJSON();
    let currentColumn = 'planning';

    if (cardJson.columnMovements && cardJson.columnMovements.length > 0) {
      const latestMovement = cardJson.columnMovements[cardJson.columnMovements.length - 1];
      if (latestMovement.toColumn) {
        currentColumn = latestMovement.toColumn;
      }
    }

    const progressPercent = getProgressPercent(currentColumn);
    const completed = isCompleted(currentColumn);
    const dateKey = new Date(cardJson.createdAt).toISOString().split('T')[0];

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        totalProgress: 0,
        totalTasks: 0,
        completedTasks: 0
      };
    }

    dailyData[dateKey].totalProgress += progressPercent;
    dailyData[dateKey].totalTasks += 1;
    if (completed) {
      dailyData[dateKey].completedTasks += 1;
    }
  });

  // Convert to array and sort by date
  const growthData = Object.values(dailyData)
    .map(day => ({
      date: day.date,
      averageProgress: parseFloat((day.totalProgress / day.totalTasks).toFixed(1)),
      totalTasks: day.totalTasks,
      completedTasks: day.completedTasks
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return growthData;
};

/**
 * Get all cards for progress tracking (without period filter)
 */
const getAllCardsForProgress = async (userId) => {
  const cards = await Card.findAll({
    where: {
      userId,
      deleted: false
    },
    include: [
      {
        model: ColumnMovement,
        as: 'columnMovements',
        separate: true,
        order: [['timestamp', 'ASC']]
      },
      {
        model: require('../models').LearningStrat,
        as: 'learningStrat'
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  return cards.map(card => {
    const cardJson = card.toJSON();
    let currentColumn = 'planning';

    if (cardJson.columnMovements && cardJson.columnMovements.length > 0) {
      const latestMovement = cardJson.columnMovements[cardJson.columnMovements.length - 1];
      if (latestMovement.toColumn) {
        currentColumn = latestMovement.toColumn;
      }
    }

    return {
      cardId: cardJson.cardId,
      userId: cardJson.userId,
      title: cardJson.title,
      learningId: cardJson.learningId,
      learningStrat: cardJson.learningStrat,
      description: cardJson.description,
      courseName: cardJson.courseName,
      difficulty: cardJson.difficulty,
      priority: cardJson.priority,
      deadline: cardJson.deadline,
      url: cardJson.url,
      startTime: cardJson.startTime,
      endTime: cardJson.endTime,
      deleted: cardJson.deleted || false,
      columnMovements: cardJson.columnMovements,
      collaborations: cardJson.collaborations,
      currentColumn,
      createdAt: cardJson.createdAt,
      updatedAt: cardJson.updatedAt
    };
  });
};

module.exports = {
  getProgressSummary,
  getGrowthData,
  getAllCardsForProgress,
  getProgressPercent,
  isCompleted
};