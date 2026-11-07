'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserActivityLog extends Model {
    static associate(models) {
      UserActivityLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  UserActivityLog.init({
    logId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'log_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      field: 'user_id'
    },
    activityType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'activity_type'
    },
    refId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'ref_id'
    },
    metadata: {
      type: DataTypes.JSONB,
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
    modelName: 'UserActivityLog',
    tableName: 'user_activity_logs',
    timestamps: false
  });

  return UserActivityLog;
};