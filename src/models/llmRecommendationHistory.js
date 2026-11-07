'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LlmRecommendationHistory extends Model {
    static associate(models) {
      LlmRecommendationHistory.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  LlmRecommendationHistory.init({
    recId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'rec_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      field: 'user_id'
    },
    triggerType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'trigger_type'
    },
    inputContext: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'input_context'
    },
    llmOutput: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'llm_output'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'LlmRecommendationHistory',
    tableName: 'llm_recommendation_histories',
    timestamps: false
  });

  return LlmRecommendationHistory;
};