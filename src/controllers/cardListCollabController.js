const {
    addCollaborator,
    getAllCollaborations,
    getCollaborationById,
    getCollaborationsByCard,
    getCollaborationsByUser,
    updateCollaboratorRole,
    removeCollaborator
} = require('../services/cardListCollabService');

const { CardListCollab, Notification } = require('../models');

const add = async(req, res, next) => {
    try {
        const collab = await addCollaborator(req.params.cardId, req.body.userId, req.user.userId, req.body.role);
        res.status(201).json({ collaboration: collab });
    } catch (error) {
        next(error);
    }
};

const getAll = async(req, res, next) => {
    try {
        const filters = {
            cardId: req.query.cardId,
            userId: req.query.userId,
            role: req.query.role,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };
        const collaborations = await getAllCollaborations(filters);
        res.json({ collaborations });
    } catch (error) {
        next(error);
    }
};

const getById = async(req, res, next) => {
    try {
        const collab = await getCollaborationById(req.params.id);
        res.json({ collaboration: collab });
    } catch (error) {
        next(error);
    }
};

const getByCard = async(req, res, next) => {
    try {
        const collaborations = await getCollaborationsByCard(req.params.cardId);
        res.json({ collaborations });
    } catch (error) {
        next(error);
    }
};

const getByUser = async(req, res, next) => {
    try {
        const collaborations = await getCollaborationsByUser(req.params.userId);
        res.json({ collaborations });
    } catch (error) {
        next(error);
    }
};

const updateRole = async(req, res, next) => {
    try {
        const collab = await updateCollaboratorRole(req.params.id, req.body.role);
        res.json({ collaboration: collab });
    } catch (error) {
        next(error);
    }
};

const remove = async(req, res, next) => {
    try {
        await removeCollaborator(req.params.id);
        res.json({ message: 'Collaborator removed' });
    } catch (error) {
        next(error);
    }
};

const acceptCollaboration = async(req, res, next) => {
    try {
        const cardId = req.params.cardId;
        const userId = req.user.userId;

        await CardListCollab.findOrCreate({
            where: { cardId, userId },
            defaults: { role: 'member' }
        });

        await Notification.destroy({
            where: {
                userId: userId,
                referenceId: cardId,
                triggerAction: 'collaboration_request'
            }
        });

        return res.status(200).json({ message: 'Kolaborasi diterima' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    add,
    getAll,
    getById,
    getByCard,
    getByUser,
    updateRole,
    remove,
    acceptCollaboration
};