const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Call = sequelize.define('Call', {
    callId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    callerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'caller_id',
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    calleeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'callee_id',
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    type: {
      type: DataTypes.ENUM('audio', 'video'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'ringing', 'answered', 'rejected', 'ended', 'missed', 'cancelled'),
      defaultValue: 'pending'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER, // in seconds
      defaultValue: 0
    },
    signalingData: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'calls',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['caller_id'] },
      { fields: ['callee_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] }
    ]
  });

  Call.associate = (models) => {
    Call.belongsTo(models.User, { foreignKey: 'callerId', as: 'caller' });
    Call.belongsTo(models.User, { foreignKey: 'calleeId', as: 'callee' });
    Call.hasMany(models.CallParticipant, { foreignKey: 'callId', as: 'participants' });
  };

  return Call;
};