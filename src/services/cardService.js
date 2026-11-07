// const {
//   Card,
//   User,
//   LearningStrat,
//   CardList,
//   ColumnMovement,
//   CardListCollab,
//   UserActivityLog,
//   Notification,
//   sequelize,
// } = require('../models');
// const { AppError } = require('../middleware/errorHandler');

// // ============================================================
// // CREATE CARD
// // ============================================================
// const createCard = async (userId, data) => {
//   console.log('=== 🔵 createCard DIPANGGIL ===');
//   console.log('userId:', userId);
//   console.log('data:', JSON.stringify(data, null, 2));

//   const user = await User.findByPk(userId);
//   if (!user) throw new AppError('User not found', 404);
//   if (!data.courseName) throw new AppError('course_name is required', 400);

//   const learningId = data.learningStrat || data.learningId || data.learning_id;
//   if (!learningId) throw new AppError('Learning strategy ID is required', 400);

//   const strategy = await LearningStrat.findByPk(learningId);
//   if (!strategy) throw new AppError('Learning strategy not found', 404);

//   // Pisahkan field yang BUKAN kolom tabel cards
//   const { collaborators, subtasks, ...cardData } = data;

//   const transaction = await sequelize.transaction();

//   try {
//     // 1. Insert Card
//     console.log('🔵 [1] Insert Card. cardData:', cardData);
//     const newCard = await Card.create({ userId, ...cardData }, { transaction });
//     console.log('✅ [1] Card inserted:', newCard.cardId);

//     // 2. Insert Subtasks
//     if (Array.isArray(subtasks) && subtasks.length > 0) {
//       const subtaskRows = subtasks
//         .map((sub) => {
//           const title =
//             typeof sub === 'string' ? sub.trim() : (sub?.subTitle ?? '').trim();
//           if (!title) return null;
//           return {
//             cardId: newCard.cardId,
//             subTitle: title,
//             startTimeList:
//               typeof sub === 'object' ? (sub?.startTimeList ?? null) : null,
//             endTimeList:
//               typeof sub === 'object' ? (sub?.endTimeList ?? null) : null,
//           };
//         })
//         .filter(Boolean);

//       if (subtaskRows.length > 0) {
//         await CardList.bulkCreate(subtaskRows, { transaction });
//         console.log('✅ [2] Subtasks inserted:', subtaskRows.length);
//       }
//     }

//     // 3. Insert Collaborators + Notification
//     if (Array.isArray(collaborators) && collaborators.length > 0) {
//       for (const friendId of collaborators) {
//         if (!friendId) continue;

//         await CardListCollab.findOrCreate({
//           where: { cardId: newCard.cardId, userId: friendId },
//           defaults: { role: 'member' },
//           transaction,
//         });

//         await Notification.create(
//           {
//             userId: friendId,
//             type: 'collaboration',
//             title: 'Undangan Kolaborasi Task',
//             message: `${user.firstName || 'Superadmin'} mengajak Anda berkolaborasi dalam task "${newCard.title}".`,
//             triggerUserId: userId,
//             triggerAction: 'collaboration_request',
//             referenceId: newCard.cardId,
//             delivered: true,
//             sentAt: new Date(),
//             read: false,
//             clicked: false,
//           },
//           { transaction }
//         );
//         console.log('✅ [3] Collaborator + Notif inserted:', friendId);
//       }
//     }

//     await transaction.commit();
//     console.log('✅✅✅ Transaction COMMITTED for card:', newCard.cardId);
//     return newCard;
//   } catch (error) {
//     await transaction.rollback();
//     console.error('❌❌❌ Transaction ROLLED BACK:', error.message);
//     console.error('Stack:', error.stack);
//     throw error;
//   }
// };

// // ============================================================
// // GET CARD BY ID
// // ============================================================
// const getCardById = async (cardId, userId) => {
//   const card = await Card.findOne({
//     where: { cardId, userId },
//     include: [
//       { model: LearningStrat, as: 'learningStrat' },
//       { model: CardList, as: 'cardList', separate: true },
//       { model: ColumnMovement, as: 'columnMovements', separate: true },
//       {
//         model: CardListCollab,
//         as: 'collaborations',
//         separate: true,
//         include: [
//           {
//             model: User,
//             as: 'user',
//             attributes: ['userId', 'firstName', 'lastName', 'username'],
//           },
//         ],
//       },
//     ],
//   });
//   if (!card) throw new AppError('Card not found', 404);
//   return card;
// };

// // ============================================================
// // UPDATE CARD
// // ============================================================
// const updateCard = async (cardId, userId, data) => {
//   const transaction = await sequelize.transaction();

//   try {
//     const card = await Card.findOne({ where: { cardId, userId }, transaction });
//     if (!card) throw new AppError('Card not found', 404);

//     if (data.learningId) {
//       const learningStrat = await LearningStrat.findByPk(data.learningId, {
//         transaction,
//       });
//       if (!learningStrat)
//         throw new AppError('Learning strategy not found', 404);
//     }

//     // Handle subtasks replacement
//     if (data.subtasks !== undefined) {
//       await CardList.destroy({ where: { cardId }, transaction });
//       if (Array.isArray(data.subtasks) && data.subtasks.length > 0) {
//         const subtasksData = data.subtasks
//           .map((sub) => {
//             const title =
//               typeof sub === 'string'
//                 ? sub.trim()
//                 : (sub?.subTitle ?? '').trim();
//             if (!title) return null;
//             return {
//               cardId: card.cardId,
//               subTitle: title,
//               startTimeList:
//                 typeof sub === 'object'
//                   ? (sub?.startTimeList ?? null)
//                   : null,
//               endTimeList:
//                 typeof sub === 'object' ? (sub?.endTimeList ?? null) : null,
//             };
//           })
//           .filter(Boolean);

//         if (subtasksData.length > 0) {
//           await CardList.bulkCreate(subtasksData, { transaction });
//         }
//       }
//       delete data.subtasks;
//     }

//     // Catat ColumnMovement secara independen (bukan else-if)
//     if (data.startTime && !card.startTime) {
//       await ColumnMovement.create(
//         {
//           cardId: card.cardId,
//           fromColumn: 'planning',
//           toColumn: 'monitoring',
//           timestamp: data.startTime,
//         },
//         { transaction }
//       );
//     }

//     if (data.endTime && !card.endTime) {
//       await ColumnMovement.create(
//         {
//           cardId: card.cardId,
//           fromColumn: 'monitoring',
//           toColumn: 'controlling',
//           timestamp: data.endTime,
//         },
//         { transaction }
//       );
//     }

//     if (data.reflectionCompletedAt && !card.reflectionCompletedAt) {
//       await ColumnMovement.create(
//         {
//           cardId: card.cardId,
//           fromColumn: 'controlling',
//           toColumn: 'reflection',
//           timestamp: data.reflectionCompletedAt,
//         },
//         { transaction }
//       );
//     }

//     await card.update(data, { transaction });
//     await transaction.commit();
//     return getCardById(cardId, userId);
//   } catch (error) {
//     await transaction.rollback();
//     console.error('❌ updateCard error:', error.message);
//     throw error;
//   }
// };

// // ============================================================
// // DELETE CARD
// // ============================================================
// const deleteCard = async (cardId, userId) => {
//   const card = await Card.findOne({ where: { cardId, userId } });
//   if (!card) throw new AppError('Card not found', 404);
//   await card.destroy();
//   return { message: 'Card deleted' };
// };

// // ============================================================
// // GET USER CARDS
// // ============================================================
// const getUserCards = async (userId, filters = {}) => {
//   const where = { userId };
//   return Card.findAll({
//     where,
//     include: [
//       { model: LearningStrat, as: 'learningStrat' },
//       { model: CardList, as: 'cardList', separate: true },
//       {
//         model: ColumnMovement,
//         as: 'columnMovements',
//         separate: true,
//         order: [['timestamp', 'ASC']],
//       },
//       {
//         model: CardListCollab,
//         as: 'collaborations',
//         separate: true,
//         include: [
//           {
//             model: User,
//             as: 'user',
//             attributes: ['userId', 'firstName', 'lastName', 'username'],
//           },
//         ],
//       },
//     ],
//     order: [['createdAt', 'DESC']],
//   });
// };

// module.exports = {
//   createCard,
//   getCardById,
//   updateCard,
//   deleteCard,
//   getUserCards,
// };

const {
  Card,
  User,
  LearningStrat,
  CardList,
  ColumnMovement,
  CardListCollab,
  UserActivityLog,
  Notification,
  sequelize,
} = require('../models');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// HELPER: CATAT AKTIVITAS
// ============================================================
// const logActivity = async ({ userId, activityType, title, description, refId }) => {
//   try {
//     await UserActivityLog.create({
//       userId,
//       activityType,
//       title,
//       description,
//       refId,
//     });
//     console.log(`✅ [ActivityLog] ${activityType} - ${title}`);
//   } catch (error) {
//     // Jangan sampai gagal log membuat proses utama gagal
//     console.warn('⚠️ [ActivityLog] Gagal mencatat aktivitas:', error.message);
//   }
// };

const logActivity = async ({ userId, activityType, title, description, refId }) => {
  try {
    // Karena tabel tidak punya kolom title/description, simpan ke metadata
    await UserActivityLog.create({
      userId,
      activityType,
      refId,
      metadata: {
        title: title,
        description: description,
      }
    });
    console.log(`✅ [ActivityLog] ${activityType} - ${title}`);
  } catch (error) {
    console.warn('⚠️ [ActivityLog] Gagal mencatat aktivitas:', error.message);
  }
};

// ============================================================
// CREATE CARD
// ============================================================
const createCard = async (userId, data) => {
  console.log('=== 🔵 createCard DIPANGGIL ===');
  console.log('userId:', userId);
  console.log('data:', JSON.stringify(data, null, 2));

  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);
  if (!data.courseName) throw new AppError('course_name is required', 400);

  const learningId = data.learningStrat || data.learningId || data.learning_id;
  if (!learningId) throw new AppError('Learning strategy ID is required', 400);

  const strategy = await LearningStrat.findByPk(learningId);
  if (!strategy) throw new AppError('Learning strategy not found', 404);

  // Pisahkan field yang BUKAN kolom tabel cards
  const { collaborators, subtasks, ...cardData } = data;

  const transaction = await sequelize.transaction();

  try {
    // 1. Insert Card
    console.log('🔵 [1] Insert Card. cardData:', cardData);
    const newCard = await Card.create({ userId, ...cardData }, { transaction });
    console.log('✅ [1] Card inserted:', newCard.cardId);

    // 2. Insert Subtasks
    if (Array.isArray(subtasks) && subtasks.length > 0) {
      const subtaskRows = subtasks
        .map((sub) => {
          const title =
            typeof sub === 'string' ? sub.trim() : (sub?.subTitle ?? '').trim();
          if (!title) return null;
          return {
            cardId: newCard.cardId,
            subTitle: title,
            startTimeList:
              typeof sub === 'object' ? (sub?.startTimeList ?? null) : null,
            endTimeList:
              typeof sub === 'object' ? (sub?.endTimeList ?? null) : null,
          };
        })
        .filter(Boolean);

      if (subtaskRows.length > 0) {
        await CardList.bulkCreate(subtaskRows, { transaction });
        console.log('✅ [2] Subtasks inserted:', subtaskRows.length);
      }
    }

    // 3. Insert Collaborators + Notification
    if (Array.isArray(collaborators) && collaborators.length > 0) {
      for (const friendId of collaborators) {
        if (!friendId) continue;

        await CardListCollab.findOrCreate({
          where: { cardId: newCard.cardId, userId: friendId },
          defaults: { role: 'member' },
          transaction,
        });

        await Notification.create(
          {
            userId: friendId,
            type: 'collaboration',
            title: 'Undangan Kolaborasi Task',
            message: `${user.firstName || 'Superadmin'} mengajak Anda berkolaborasi dalam task "${newCard.title}".`,
            triggerUserId: userId,
            triggerAction: 'collaboration_request',
            referenceId: newCard.cardId,
            delivered: true,
            sentAt: new Date(),
            read: false,
            clicked: false,
          },
          { transaction }
        );
        console.log('✅ [3] Collaborator + Notif inserted:', friendId);
      }
    }

    await transaction.commit();
    console.log('✅✅✅ Transaction COMMITTED for card:', newCard.cardId);

    // ⚡ CATAT AKTIVITAS CARD DIBUAT
    await logActivity({
      userId,
      activityType: 'card_created',
      title: 'Menambahkan tugas baru',
      description: `Membuat tugas "${newCard.title}" untuk mata kuliah ${newCard.courseName || '-'}`,
      refId: newCard.cardId,
    });

    return newCard;
  } catch (error) {
    await transaction.rollback();
    console.error('❌❌❌ Transaction ROLLED BACK:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
};

// ============================================================
// GET CARD BY ID
// ============================================================
const getCardById = async (cardId, userId) => {
  const card = await Card.findOne({
    where: { cardId, userId },
    include: [
      { model: LearningStrat, as: 'learningStrat' },
      { model: CardList, as: 'cardList', separate: true },
      { model: ColumnMovement, as: 'columnMovements', separate: true },
      {
        model: CardListCollab,
        as: 'collaborations',
        separate: true,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['userId', 'firstName', 'lastName', 'username'],
          },
        ],
      },
    ],
  });
  if (!card) throw new AppError('Card not found', 404);
  return card;
};

// ============================================================
// UPDATE CARD
// ============================================================
const updateCard = async (cardId, userId, data) => {
  const transaction = await sequelize.transaction();

  try {
    const card = await Card.findOne({ where: { cardId, userId }, transaction });
    if (!card) throw new AppError('Card not found', 404);

    if (data.learningId) {
      const learningStrat = await LearningStrat.findByPk(data.learningId, {
        transaction,
      });
      if (!learningStrat)
        throw new AppError('Learning strategy not found', 404);
    }

    // ─── SIMPAN STATUS LAMA SEBELUM UPDATE ───
    const wasStarted = card.startTime != null;
    const wasEnded = card.endTime != null;
    const wasReflected = card.reflectionCompletedAt != null;

    // Handle subtasks replacement
    if (data.subtasks !== undefined) {
      await CardList.destroy({ where: { cardId }, transaction });
      if (Array.isArray(data.subtasks) && data.subtasks.length > 0) {
        const subtasksData = data.subtasks
          .map((sub) => {
            const title =
              typeof sub === 'string'
                ? sub.trim()
                : (sub?.subTitle ?? '').trim();
            if (!title) return null;
            return {
              cardId: card.cardId,
              subTitle: title,
              startTimeList:
                typeof sub === 'object'
                  ? (sub?.startTimeList ?? null)
                  : null,
              endTimeList:
                typeof sub === 'object' ? (sub?.endTimeList ?? null) : null,
            };
          })
          .filter(Boolean);

        if (subtasksData.length > 0) {
          await CardList.bulkCreate(subtasksData, { transaction });
        }
      }
      delete data.subtasks;
    }

    // Catat ColumnMovement secara independen
    if (data.startTime && !wasStarted) {
      await ColumnMovement.create(
        {
          cardId: card.cardId,
          fromColumn: 'planning',
          toColumn: 'monitoring',
          timestamp: data.startTime,
        },
        { transaction }
      );
    }

    if (data.endTime && !wasEnded) {
      await ColumnMovement.create(
        {
          cardId: card.cardId,
          fromColumn: 'monitoring',
          toColumn: 'controlling',
          timestamp: data.endTime,
        },
        { transaction }
      );
    }

    if (data.reflectionCompletedAt && !wasReflected) {
      await ColumnMovement.create(
        {
          cardId: card.cardId,
          fromColumn: 'controlling',
          toColumn: 'reflection',
          timestamp: data.reflectionCompletedAt,
        },
        { transaction }
      );
    }

    await card.update(data, { transaction });
    await transaction.commit();

    // ⚡ CATAT AKTIVITAS BERDASARKAN PERUBAHAN STATUS
    if (data.startTime && !wasStarted) {
      await logActivity({
        userId,
        activityType: 'card_started',
        title: 'Memulai tugas',
        description: `Mulai mengerjakan "${data.title || card.title}"`,
        refId: cardId,
      });
    }

    if (data.endTime && !wasEnded) {
      await logActivity({
        userId,
        activityType: 'card_completed',
        title: 'Menyelesaikan tugas',
        description: `Menyelesaikan "${data.title || card.title}"`,
        refId: cardId,
      });
    }

    if (data.reflectionCompletedAt && !wasReflected) {
      await logActivity({
        userId,
        activityType: 'reflection_done',
        title: 'Refleksi selesai',
        description: `Melakukan refleksi untuk "${data.title || card.title}"`,
        refId: cardId,
      });
    }

    return getCardById(cardId, userId);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ updateCard error:', error.message);
    throw error;
  }
};

// ============================================================
// DELETE CARD
// ============================================================
const deleteCard = async (cardId, userId) => {
  const card = await Card.findOne({ where: { cardId, userId } });
  if (!card) throw new AppError('Card not found', 404);

  const cardTitle = card.title; // simpan judul sebelum dihapus
  await card.destroy();

  // ⚡ CATAT AKTIVITAS CARD DIHAPUS
  await logActivity({
    userId,
    activityType: 'card_deleted',
    title: 'Menghapus tugas',
    description: `Menghapus tugas "${cardTitle}"`,
    refId: cardId,
  });

  return { message: 'Card deleted' };
};

// ============================================================
// GET USER CARDS
// ============================================================
const getUserCards = async (userId, filters = {}) => {
  const where = { userId };
  return Card.findAll({
    where,
    include: [
      { model: LearningStrat, as: 'learningStrat' },
      { model: CardList, as: 'cardList', separate: true },
      {
        model: ColumnMovement,
        as: 'columnMovements',
        separate: true,
        order: [['timestamp', 'ASC']],
      },
      {
        model: CardListCollab,
        as: 'collaborations',
        separate: true,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['userId', 'firstName', 'lastName', 'username'],
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
};

module.exports = {
  createCard,
  getCardById,
  updateCard,
  deleteCard,
  getUserCards,
};