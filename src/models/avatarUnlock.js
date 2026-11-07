'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AvatarUnlock extends Model {
    static associate(models) {
      AvatarUnlock.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      AvatarUnlock.belongsTo(models.AvatarComponent, { foreignKey: 'componentId', as: 'component' });
    }
  }

  AvatarUnlock.init({
    avaUnId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'ava_un_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      field: 'user_id'
    },
    componentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'avatar_components', key: 'ava_id' },
      field: 'component_id'
    },
    unlockedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'unlocked_at'
    }
  }, {
    sequelize,
    modelName: 'AvatarUnlock',
    tableName: 'avatar_unlocks',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'component_id']
      }
    ]
  });

  return AvatarUnlock;
};