const { createLearningStrat, getAllLearningStrats, getLearningStratByName, getLearningByID, updateLearningStrat, deleteLearningStrat } = require('../services/learningStratService');

const create = async (req, res, next) => {
  try {
    const learningStrat = await createLearningStrat(req.body);
    res.status(201).json({ learningStrat });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const learningStrats = await getAllLearningStrats();
    res.json({ learningStrats });
  } catch (error) {
    next(error);
  }
};

const getByName = async (req, res, next) => {
  try {
    const paramValue = req.params.learningStrategy;

    if (!paramValue) {
      throw new AppError('Parameter is missing', 400);
    }

    const strategyName = paramValue.toLowerCase();
    const learningStrat = await getLearningStratByName(strategyName);
    res.json({ learningStrat });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { learningId } = req.params;

    // Panggil langsung getLearningByID karena sudah di-destructure di atas
    const strategy = await getLearningByID(learningId);

    if (!strategy) {
      return res.status(404).json({
        message: 'Learning strategy tidak ditemukan'
      });
    }

    return res.status(200).json({
      message: 'Berhasil mengambil learning strategy',
      learningStrat: strategy
    });
  } catch (error) {
    console.error('Error fetching learning strategy by ID:', error);
    return res.status(500).json({
      message: 'Terjadi kesalahan pada server',
      error: error.message
    });
  }
};

const update = async (req, res, next) => {
  try {
    const learningStrat = await updateLearningStrat(req.params.id, req.body);
    res.json({ learningStrat });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteLearningStrat(req.params.id);
    res.json({ message: 'Learning strategy deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getByName, getById, update, remove };