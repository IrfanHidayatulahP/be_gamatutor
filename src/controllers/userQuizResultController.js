const {
    createQuizResult,
    getAllQuizResults,
    getQuizResultById,
    getQuizResultsByUser,
    getLatestQuizResultByUser,
    updateQuizResult,
    deleteQuizResult
} = require('../services/userQuizResultService');

const create = async(req, res, next) => {
    try {
        // Kompatibel untuk body langsung maupun yang dibungkus answersPayload
        const payload = req.body.answersPayload && Object.keys(req.body).length === 1 ?
            req.body.answersPayload :
            req.body;

        const result = await createQuizResult(req.user.userId || req.user.id, payload);
        res.status(201).json({ quizResult: result });
    } catch (error) {
        next(error);
    }
};

const getAll = async(req, res, next) => {
    try {
        const filters = {
            userId: req.query.userId,
            dominantStrategy: req.query.dominantStrategy,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };
        const results = await getAllQuizResults(filters);
        res.json({ quizResults: results });
    } catch (error) {
        next(error);
    }
};

const getById = async(req, res, next) => {
    try {
        const result = await getQuizResultById(req.params.id);
        res.json({ quizResult: result });
    } catch (error) {
        next(error);
    }
};

const getByUser = async(req, res, next) => {
    try {
        const filters = {
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };
        const results = await getQuizResultsByUser(req.params.userId, filters);
        res.json({ quizResults: results });
    } catch (error) {
        next(error);
    }
};

const getLatestByUser = async(req, res, next) => {
    try {
        const result = await getLatestQuizResultByUser(req.params.userId);
        res.json({ quizResult: result });
    } catch (error) {
        next(error);
    }
};

const update = async(req, res, next) => {
    try {
        const result = await updateQuizResult(req.params.id, req.body);
        res.json({ quizResult: result });
    } catch (error) {
        next(error);
    }
};

const remove = async(req, res, next) => {
    try {
        await deleteQuizResult(req.params.id);
        res.json({ message: 'Quiz result deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    create,
    getAll,
    getById,
    getByUser,
    getLatestByUser,
    update,
    remove
};