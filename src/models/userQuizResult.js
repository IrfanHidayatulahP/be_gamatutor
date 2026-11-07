'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserQuizResult extends Model {
    static associate(models) {
      UserQuizResult.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  UserQuizResult.init({
    quizResultId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'quiz_result_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      field: 'user_id'
    },
    dominantStrategy: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'dominant_strategy'
    },
    userProfile: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'user_profile'
    },
    unlockedFeatures: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'unlocked_features'
    },
    lockedFeatures: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'locked_features'
    },
    answersPayload: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'answers_payload'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'UserQuizResult',
    tableName: 'user_quiz_results',
    timestamps: false
  });

  return UserQuizResult;
};