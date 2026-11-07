const { CardListCollab, Card, User, Notification } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const { getIo } = require('../websocket/ioInstance');

const addCollaborator = async(cardId, userId, inviterId = null, role = 'member') => {
    const card = await Card.findByPk(cardId);
    if (!card) {
        throw new AppError('Card not found', 404);
    }

    const user = await User.findByPk(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Jika parameter ke-3 ternyata adalah nama role (misal: 'owner'/'member')
    let actualInviterId = inviterId;
    let actualRole = role;
    if (inviterId === 'owner' || inviterId === 'member') {
        actualRole = inviterId;
        actualInviterId = null;
    }

    let inviter = null;
    if (actualInviterId) {
        inviter = await User.findByPk(actualInviterId, { attributes: ['firstName', 'lastName', 'userId'] });
    }

    const existing = await CardListCollab.findOne({ where: { cardId, userId } });
    if (existing) {
        throw new AppError('User is already a collaborator on this card', 400);
    }

    const collaboration = await CardListCollab.create({ cardId, userId, role: actualRole });
    const collabIdentifier = collaboration.collabId || collaboration.id;

    // Jika ada data pengundang, buat notifikasi dan tembakkan event WebSocket
    if (inviter) {
        const inviterName = `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() || 'Seseorang';

        await Notification.create({
            userId,
            type: 'push',
            title: 'Collaboration Invitation',
            message: `${inviterName} invited you to collaborate on "${card.title}"`,
            triggerAction: 'collaboration_invite',
            triggerUserId: actualInviterId,
        });

        const io = getIo();
        if (io) {
            io.emitToUser(userId, 'notificationReceived', {
                event: 'notificationReceived',
                data: {
                    type: 'collaboration_invite',
                    message: 'New collaboration invite',
                    triggerUserId: actualInviterId,
                    collabId: collabIdentifier,
                }
            });
            io.emitToUser(userId, 'collaboration_invite', {
                event: 'collaboration_invite',
                data: {
                    collaborationId: collabIdentifier,
                    cardId,
                    cardTitle: card.title,
                    inviter: {
                        userId: inviter.userId,
                        firstName: inviter.firstName,
                        lastName: inviter.lastName
                    }
                }
            });
        }
    }

    return collaboration;
};

const getAllCollaborations = async(filters = {}) => {
    const where = {};
    if (filters.cardId) where.cardId = filters.cardId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.role) where.role = filters.role;

    return CardListCollab.findAll({
        where,
        include: [{
                model: Card,
                as: 'card',
                include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }]
            },
            {
                model: User,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'username']
            }
        ],
        order: [
            ['addedAt', 'DESC']
        ],
        limit: filters.limit || 50,
        offset: filters.offset || 0
    });
};

const getCollaborationById = async(id) => {
    const collab = await CardListCollab.findByPk(id, {
        include: [
            { model: Card, as: 'card' },
            { model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }
        ]
    });
    if (!collab) {
        throw new AppError('Collaboration not found', 404);
    }
    return collab;
};

const getCollaborationsByCard = async(cardId) => {
    return CardListCollab.findAll({
        where: { cardId },
        include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username', 'role'] }],
        order: [
            ['addedAt', 'ASC']
        ]
    });
};

const getCollaborationsByUser = async(userId) => {
    return CardListCollab.findAll({
        where: { userId },
        include: [{
            model: Card,
            as: 'card',
            include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }]
        }],
        order: [
            ['addedAt', 'DESC']
        ]
    });
};

const updateCollaboratorRole = async(id, role) => {
    const collab = await CardListCollab.findByPk(id);
    if (!collab) {
        throw new AppError('Collaboration not found', 404);
    }
    return collab.update({ role });
};

const removeCollaborator = async(id) => {
    const collab = await CardListCollab.findByPk(id);
    if (!collab) {
        throw new AppError('Collaboration not found', 404);
    }
    await collab.destroy();
    return { message: 'Collaborator removed' };
};

module.exports = {
    addCollaborator,
    getAllCollaborations,
    getCollaborationById,
    getCollaborationsByCard,
    getCollaborationsByUser,
    updateCollaboratorRole,
    removeCollaborator
};