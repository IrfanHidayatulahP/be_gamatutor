const { CardList, Card } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const createCardList = async (cardId, userId, data) => {
  const card = await Card.findOne({ where: { cardId, userId } });
  if (!card) throw new AppError('Card not found', 404);

  return CardList.create({
    cardId,
    subTitle: data.subTitle,
    endTimeList: data.endTimeList,
    startTimeList: data.startTimeList,
  });
};

const getCardListByCardId = async (cardId, userId) => {
  const card = await Card.findOne({ where: { cardId, userId } });
  if (!card) throw new AppError('Card not found', 404);

  // findAll (bukan findOne) supaya return array subtask
  return CardList.findAll({ where: { cardId } });
};

const updateCardList = async (cardId, clId, userId, data) => {
  const card = await Card.findOne({ where: { cardId, userId } });
  if (!card) throw new AppError('Card not found', 404);

  const cardList = await CardList.findOne({ where: { clId, cardId } });
  if (!cardList) throw new AppError('Card list not found', 404);

  return cardList.update({
    subTitle: data.subTitle,
    endTimeList: data.endTimeList,
    startTimeList: data.startTimeList,
  });
};

const deleteCardList = async (cardId, clId, userId) => {
  const card = await Card.findOne({ where: { cardId, userId } });
  if (!card) throw new AppError('Card not found', 404);

  const cardList = await CardList.findOne({ where: { clId, cardId } });
  if (!cardList) throw new AppError('Card list not found', 404);

  await cardList.destroy();
  return { message: 'Card list deleted' };
};

module.exports = {
  createCardList,
  getCardListByCardId,
  updateCardList,
  deleteCardList,
};