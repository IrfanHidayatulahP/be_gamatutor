'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserAvatar extends Model {
    static associate(models) {
      UserAvatar.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  UserAvatar.init({
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: { model: 'users', key: 'user_id' },
      field: 'user_id'
    },
    avatarConfig: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'avatar_config'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'UserAvatar',
    tableName: 'user_avatar',
    timestamps: false
  });

  return UserAvatar;
};