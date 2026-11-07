'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MonthlyEvaluation extends Model {
    static associate(models) {
      MonthlyEvaluation.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  MonthlyEvaluation.init({
    evalId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'eval_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      field: 'user_id'
    },
    monthYear: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'month_year'
    },
    isSynchronized: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'is_synchronized'
    },
    requiresQuizRetake: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'requires_quiz_retake'
    },
    detectedIssues: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'detected_issues'
    },
    llmFeedback: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'llm_feedback'
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'MonthlyEvaluation',
    tableName: 'monthly_evaluations',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'month_year'],
        name: 'unique_user_monthly_eval'
      }
    ]
  });

  return MonthlyEvaluation;
};