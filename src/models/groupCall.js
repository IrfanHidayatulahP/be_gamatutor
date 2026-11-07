'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GroupCall extends Model {
    static associate(models) {
      GroupCall.belongsTo(models.User, { foreignKey: 'hostId', as: 'host' });
      GroupCall.belongsTo(models.Card, { foreignKey: 'taskId', as: 'task' });
      GroupCall.hasMany(models.GroupCallParticipant, { foreignKey: 'groupCallId', as: 'participants' });
    }
  }

  GroupCall.init({
    groupCallId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'group_call_id'
    },
    hostId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      field: 'host_id'
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'cards', key: 'card_id' },
      field: 'task_id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('audio'),
      defaultValue: 'audio'
    },
    status: {
      type: DataTypes.ENUM('waiting', 'active', 'ended', 'cancelled'),
      defaultValue: 'waiting'
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_at'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'started_at'
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'ended_at'
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      field: 'max_participants'
    },
    isRecording: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_recording'
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        allowScreenShare: true,
        allowChat: true,
        muteOnEntry: false
      }
    }
  }, {
    sequelize,
    modelName: 'GroupCall',
    tableName: 'group_calls',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['host_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] },
      { fields: ['task_id'] },
      { unique: true, fields: ['task_id', 'status'], where: { status: ['waiting', 'active'] } }
    ]
  });

  return GroupCall;
};