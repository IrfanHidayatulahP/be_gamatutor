const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CallActivity = sequelize.define('CallActivity', {
    activityId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    callId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'call_id',
      references: {
        model: 'calls',
        key: 'call_id'
      }
    },
    groupCallId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'group_call_id',
      references: {
        model: 'group_calls',
        key: 'group_call_id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    activityType: {
      type: DataTypes.ENUM(
        'call_initiated',
        'call_ringing',
        'call_answered',
        'call_rejected',
        'call_ended',
        'call_missed',
        'call_cancelled',
        'participant_joined',
        'participant_left',
        'participant_muted',
        'participant_unmuted',
        'video_enabled',
        'video_disabled',
        'screen_share_started',
        'screen_share_stopped',
        'recording_started',
        'recording_stopped',
        'connection_lost',
        'connection_restored'
      ),
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'call_activities',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['call_id'] },
      { fields: ['group_call_id'] },
      { fields: ['user_id'] },
      { fields: ['activity_type'] },
      { fields: ['created_at'] }
    ]
  });

  CallActivity.associate = (models) => {
    CallActivity.belongsTo(models.Call, { foreignKey: 'callId', as: 'call' });
    CallActivity.belongsTo(models.GroupCall, { foreignKey: 'groupCallId', as: 'groupCall' });
    CallActivity.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return CallActivity;
};