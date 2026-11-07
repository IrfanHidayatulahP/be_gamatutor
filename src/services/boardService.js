const { Card, CardList, ColumnMovement, CardListCollab, User, LearningStrat, GroupCall, GroupCallParticipant } = require('../models');
const { Op } = require('sequelize');

const getBoard = async (userId, filters = {}) => {
  const where = { userId };

  const cards = await Card.findAll({
    where,
    include: [
      { model: LearningStrat, as: 'learningStrat' },
      {
        model: CardList,
        as: 'cardList',
        separate: true
      },
      {
        model: ColumnMovement,
        as: 'columnMovements',
        separate: true,
        order: [['timestamp', 'ASC']]
      },
      {
        model: CardListCollab,
        as: 'collaborations',
        separate: true,
        include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 100,
    offset: filters.offset || 0
  });

  // Transform to include current column based on latest columnMovement
  const cardsWithColumn = cards.map(card => {
    const cardJson = card.toJSON();
    let currentColumn = 'planning'; // default

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

  // Filter by column if specified
  let filteredCards = cardsWithColumn;
  if (filters.column) {
    filteredCards = cardsWithColumn.filter(card => card.currentColumn === filters.column);
  }

  return {
    cards: filteredCards,
    total: cards.length
  };
};

const getBoardColumns = async (userId) => {
  // Get all cards for user
  const cards = await Card.findAll({
    where: { userId },
    include: [
      {
        model: ColumnMovement,
        as: 'columnMovements',
        separate: true,
        order: [['timestamp', 'ASC']]
      }
    ]
  });

  // Define column order
  const columns = ['planning', 'monitoring', 'controlling', 'reflection'];

  const columnData = columns.map(columnName => {
    const cardsInColumn = cards.filter(card => {
      const movements = card.columnMovements || [];
      if (movements.length === 0) return columnName === 'planning';

      const latestMovement = movements[movements.length - 1];
      return latestMovement.toColumn === columnName;
    });

    return {
      id: columnName,
      title: columnName.charAt(0).toUpperCase() + columnName.slice(1),
      cards: cardsInColumn.map(card => ({
        cardId: card.cardId,
        title: card.title,
        description: card.description,
        courseName: card.courseName,
        difficulty: card.difficulty,
        priority: card.priority,
        deadline: card.deadline,
        startTime: card.startTime,
        endTime: card.endTime,
        learningStrat: card.learningStrat,
        deleted: card.deleted,
        createdAt: card.createdAt
      }))
    };
  });

  return columnData;
};

const getCollaborativeTasks = async (userId) => {
  // 1. Cards user owns
  const ownedCards = await Card.findAll({
    where: { userId, deleted: false },
    include: [{ model: LearningStrat, as: 'learningStrat' }],
  });

  // 2. Cards user collaborates on
  const collabRows = await CardListCollab.findAll({
    where: { userId },
    include: [{
      model: Card, as: 'card',
      include: [{ model: LearningStrat, as: 'learningStrat' }],
    }],
  });

  // 3. Merge (owned takes precedence for role)
  const map = new Map();
  ownedCards.forEach(c => map.set(c.cardId, { card: c, isOwner: true, role: 'owner' }));
  collabRows.forEach(r => {
    if (!map.has(r.cardId)) map.set(r.cardId, { card: r.card, isOwner: false, role: r.role });
  });

  // 4. Attach active call info
  const cardIds = [...map.keys()];
  const activeCalls = cardIds.length
    ? await GroupCall.findAll({
        where: { taskId: { [Op.in]: cardIds }, status: { [Op.in]: ['waiting', 'active'] } },
        include: [{
          model: GroupCallParticipant, as: 'participants',
          where: { leftAt: null }, required: false,
        }],
      })
    : [];

  const callByTask = {};
  activeCalls.forEach(gc => {
    callByTask[gc.taskId] = {
      groupCallId: gc.groupCallId,
      status: gc.status,
      hostId: gc.hostId,
      participantCount: gc.participants?.length ?? 0,
    };
  });

  return [...map.values()].map(({ card, isOwner, role }) => ({
    cardId: card.cardId,
    title: card.title,
    courseName: card.courseName,
    difficulty: card.difficulty,
    priority: card.priority,
    deadline: card.deadline,
    learningStrat: card.learningStrat,
    isOwner, role,
    activeGroupCall: callByTask[card.cardId] ?? null,
  }));
};

module.exports = {
  getBoard,
  getBoardColumns,
  getCollaborativeTasks
};