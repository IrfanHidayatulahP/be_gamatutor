const {
    createCard,
    getCardById,
    updateCard,
    deleteCard,
    getUserCards
} = require('../services/cardService');

const createNewCard = async(req, res, next) => {
    try {
        const card = await createCard(req.user.userId, req.body);
        res.status(201).json({ card });
    } catch (error) {
        next(error);
    }
};

const getCard = async(req, res, next) => {
    try {
        const card = await getCardById(req.params.id, req.user.userId);
        res.json({ card });
    } catch (error) {
        next(error);
    }
};

const updateExistingCard = async(req, res, next) => {
    try {
        const card = await updateCard(req.params.id, req.user.userId, req.body);
        res.json({ card });
    } catch (error) {
        next(error);
    }
};

const deleteExistingCard = async(req, res, next) => {
    try {
        await deleteCard(req.params.id, req.user.userId);
        res.json({ message: 'Card deleted' });
    } catch (error) {
        next(error);
    }
};

const getCards = async(req, res, next) => {
    try {
        console.time('GetCardsDuration');
        const cards = await getUserCards(req.user.userId, req.query);
        console.timeEnd('GetCardsDuration');
        res.json({ cards });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createNewCard,
    getCard,
    getCards,
    updateExistingCard,
    deleteExistingCard
};