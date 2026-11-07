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
const logActivity = async({ userId, activityType, title, description, refId }) => {
    try {
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
const createCard = async(userId, data) => {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    if (!data.courseName) throw new AppError('courseName is required', 400);

    const learningId = data.learningStrat || data.learningId || data.learning_id;
    if (!learningId) throw new AppError('Learning strategy ID is required', 400);

    const strategy = await LearningStrat.findByPk(learningId);
    if (!strategy) throw new AppError('Learning strategy not found', 404);

    // Pisahkan field yang bukan kolom tabel cards
    const { collaborators, subtasks, ...cardData } = data;

    const transaction = await sequelize.transaction();

    try {
        // 1. Insert Data Kartu Utama
        const newCard = await Card.create({ userId, ...cardData }, { transaction });

        // 2. Insert Subtasks
        if (Array.isArray(subtasks) && subtasks.length > 0) {
            const subtaskRows = subtasks
                .map((sub) => {
                    const title =
                        typeof sub === 'string' ? sub.trim() : ((sub && sub.subTitle) ? sub.subTitle : '').trim();
                    if (!title) return null;
                    return {
                        cardId: newCard.cardId,
                        subTitle: title,
                        startTimeList: sub && typeof sub === 'object' ? (sub.startTimeList ?? null) : null,
                        endTimeList: sub && typeof sub === 'object' ? (sub.endTimeList ?? null) : null,
                    };
                })
                .filter(Boolean);

            if (subtaskRows.length > 0) {
                await CardList.bulkCreate(subtaskRows, { transaction });
            }
        }

        // 3. Insert Kolaborator & Notifikasi Undangan
        if (Array.isArray(collaborators) && collaborators.length > 0) {
            for (const friendId of collaborators) {
                if (!friendId) continue;

                await CardListCollab.findOrCreate({
                    where: { cardId: newCard.cardId, userId: friendId },
                    defaults: { role: 'member' },
                    transaction,
                });

                await Notification.create({
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
                }, { transaction });
            }
        }

        await transaction.commit();

        // Catat log aktivitas pembuatan kartu
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
        console.error('❌ Transaction createCard ROLLED BACK:', error.message);
        throw error;
    }
};

// ============================================================
// GET CARD BY ID
// ============================================================
const getCardById = async(cardId, userId) => {
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
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'firstName', 'lastName', 'username'],
                }, ],
            },
        ],
    });
    if (!card) throw new AppError('Card not found', 404);
    return card;
};

// ============================================================
// UPDATE CARD
// ============================================================
const updateCard = async(cardId, userId, data) => {
    const transaction = await sequelize.transaction();

    try {
        const card = await Card.findOne({ where: { cardId, userId }, transaction });
        if (!card) throw new AppError('Card not found', 404);

        if (data.learningId) {
            const learningStrat = await LearningStrat.findByPk(data.learningId, {
                transaction,
            });
            if (!learningStrat) throw new AppError('Learning strategy not found', 404);
        }

        // Status lama sebelum update
        const wasStarted = card.startTime != null;
        const wasEnded = card.endTime != null;
        const wasReflected = card.reflectionCompletedAt != null;

        // Handle pembaruan subtasks jika ada
        if (data.subtasks !== undefined) {
            await CardList.destroy({ where: { cardId }, transaction });
            if (Array.isArray(data.subtasks) && data.subtasks.length > 0) {
                const subtasksData = data.subtasks
                    .map((sub) => {
                        const title =
                            typeof sub === 'string'
                                ? sub.trim()
                                : (sub && typeof sub === 'object'
                                    ? (sub.subTitle ?? '').trim()
                                    : '');
                        if (!title) return null;
                        return {
                            cardId: card.cardId,
                            subTitle: title,
                            startTimeList: typeof sub === 'object' && sub !== null
                                ? (sub.startTimeList ?? null)
                                : null,
                            endTimeList: typeof sub === 'object' && sub !== null
                                ? (sub.endTimeList ?? null)
                                : null,
                        };
                    })
                    .filter(Boolean);

                if (subtasksData.length > 0) {
                    await CardList.bulkCreate(subtasksData, { transaction });
                }
            }
            delete data.subtasks;
        }

        // Catat perpindahan kolom secara independen
        if (data.startTime && !wasStarted) {
            await ColumnMovement.create({
                cardId: card.cardId,
                fromColumn: 'planning',
                toColumn: 'monitoring',
                timestamp: data.startTime,
            }, { transaction });
        }

        if (data.endTime && !wasEnded) {
            await ColumnMovement.create({
                cardId: card.cardId,
                fromColumn: 'monitoring',
                toColumn: 'controlling',
                timestamp: data.endTime,
            }, { transaction });
        }

        const reflectionTime = data.reflectionCompletedAt || data.reflection_completed_at;
        if (reflectionTime && !wasReflected) {
            await ColumnMovement.create({
                cardId: card.cardId,
                fromColumn: 'controlling',
                toColumn: 'reflection',
                timestamp: reflectionTime,
            }, { transaction });
        }

        await card.update(data, { transaction });
        await transaction.commit();

        // Catat aktivitas di background
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

        if (reflectionTime && !wasReflected) {
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
const deleteCard = async(cardId, userId) => {
    const card = await Card.findOne({ where: { cardId, userId } });
    if (!card) throw new AppError('Card not found', 404);

    const cardTitle = card.title;
    await card.destroy();

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
const getUserCards = async(userId, filters = {}) => {
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
                order: [
                    ['timestamp', 'ASC']
                ],
            },
            {
                model: CardListCollab,
                as: 'collaborations',
                separate: true,
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'firstName', 'lastName', 'username'],
                }, ],
            },
        ],
        order: [
            ['createdAt', 'DESC']
        ],
    });
};

module.exports = {
    createCard,
    getCardById,
    updateCard,
    deleteCard,
    getUserCards,
};