'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LlmPromptTemplate extends Model {
    static associate(models) {
      // No direct associations
    }
  }

  LlmPromptTemplate.init({
    promptId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'prompt_id'
    },
    templateName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'template_name'
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    systemPrompt: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'system_prompt'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'LlmPromptTemplate',
    tableName: 'llm_prompt_templates',
    timestamps: false
  });

  return LlmPromptTemplate;
};