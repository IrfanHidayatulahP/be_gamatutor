'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GroupCallParticipant extends Model {
    static associate(models) {
      GroupCallParticipant.belongsTo(models.GroupCall, { foreignKey: 'groupCallId', as: 'groupCall' });
      GroupCallParticipant.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  GroupCallParticipant.init({
    participantId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'participant_id'
    },
    groupCallId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'group_calls', key: 'group_call_id' },
      field: 'group_call_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      field: 'user_id'
    },
    role: {
      type: DataTypes.ENUM('host', 'moderator', 'participant'),
      defaultValue: 'participant'
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'joined_at'
    },
    leftAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'left_at'
    },
    isMuted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isVideoEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isScreenSharing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    connectionStatus: {
      type: DataTypes.ENUM('connecting', 'connected', 'disconnected', 'reconnecting'),
      defaultValue: 'connecting'
    }
  }, {
    sequelize,
    modelName: 'GroupCallParticipant',
    tableName: 'group_call_participants',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['group_call_id'] },
      { fields: ['user_id'] },
      { unique: true, fields: ['group_call_id', 'user_id'] }
    ]
  });

  return GroupCallParticipant;
};