'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CardList extends Model {
    static associate(models) {
      CardList.belongsTo(models.Card, { foreignKey: 'cardId', as: 'card' });
    }
  }

  CardList.init({
    clId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'cl_id'
    },
    cardId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'cards', key: 'card_id' },
      field: 'card_id'
    },
    subTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'sub_title'
    },
    endTimeList: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_time_list'
    },
    startTimeList: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'start_time_list'
    }
  }, {
    sequelize,
    modelName: 'CardList',
    tableName: 'card_list',
    timestamps: false
  });

  return CardList;
};