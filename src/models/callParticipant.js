const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CallParticipant = sequelize.define('CallParticipant', {
    participantId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    callId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'call_id',
      references: {
        model: 'calls',
        key: 'call_id'
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
    role: {
      type: DataTypes.ENUM('host', 'participant'),
      defaultValue: 'participant'
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    leftAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isMuted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isVideoEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    connectionStatus: {
      type: DataTypes.ENUM('connecting', 'connected', 'disconnected', 'reconnecting'),
      defaultValue: 'connecting'
    }
  }, {
    tableName: 'call_participants',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['call_id'] },
      { fields: ['user_id'] }
    ]
  });

  CallParticipant.associate = (models) => {
    CallParticipant.belongsTo(models.Call, { foreignKey: 'callId', as: 'call' });
    CallParticipant.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return CallParticipant;
};