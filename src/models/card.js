'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Card extends Model {
    static associate(models) {
      Card.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Card.belongsTo(models.LearningStrat, { foreignKey: 'learningId', as: 'learningStrat' });
      Card.hasMany(models.CardList, { foreignKey: 'cardId', as: 'cardList' });
      Card.hasMany(models.ColumnMovement, { foreignKey: 'cardId', as: 'columnMovements' });
      Card.hasMany(models.CardListCollab, { foreignKey: 'cardId', as: 'collaborations' });
    }
  }

  Card.init({
    cardId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'card_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      field: 'user_id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    learningId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'learning_strats', key: 'learning_id' },
      field: 'learning_id'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    courseName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'course_name'
    },
    difficulty: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        isIn: [['easy', 'medium', 'hard', 'expert']]
      }
    },
    priority: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        isIn: [['low', 'medium', 'high', 'critical']]
      }
    },
    deadline: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'deadline'
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_time'
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    satisfactionRating: {
      type: DataTypes.NUMERIC,
      allowNull: true,
      field: 'satisfaction_rating'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    preTestGrade: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'pre_test_grade'
    },
    postTestGrade: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'post_test_grade'
    },
    reflectionQ1Strategy: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reflection_q1_strategy'
    },
    reflectionQ2Confidence: {
      type: DataTypes.NUMERIC,
      allowNull: true,
      field: 'reflection_q2_confidence'
    },
    reflectionQ3WhatLearned: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reflection_q3_what_learned'
    },
    reflectionQ4Value: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reflection_q4_value'
    },
    reflectionCompletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reflection_completed_at'
    },
    goalCheckRating: {
      type: DataTypes.NUMERIC,
      allowNull: true,
      field: 'goal_check_rating'
    },
    goalCheckTimestamp: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'goal_check_timestamp'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'Card',
    tableName: 'cards',
    timestamps: false
  });

  return Card;
};