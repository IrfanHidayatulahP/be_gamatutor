'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MslqStaticQuestion extends Model {
    static associate(models) {
      // No direct associations
    }
  }

  MslqStaticQuestion.init({
    staticQId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'static_q_id'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    questionText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'question_text'
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'MslqStaticQuestion',
    tableName: 'mslq_static_questions',
    timestamps: false
  });

  return MslqStaticQuestion;
};