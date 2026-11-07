'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LearningStrat extends Model {
    static associate(models) {
      LearningStrat.hasMany(models.CardList, { foreignKey: 'learningId', as: 'cardLists' });
    }
  }

  LearningStrat.init({
    learningId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'learning_id'
    },
    keyCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'key_code'
    },
    learningStrategy: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'learning_strategy'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'LearningStrat',
    tableName: 'learning_strats',
    timestamps: false
  });

  return LearningStrat;
};