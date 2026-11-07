'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AvatarComponent extends Model {
    static associate(models) {
      AvatarComponent.hasMany(models.UserAvatar, { foreignKey: 'hairId', as: 'hairUsers' });
      AvatarComponent.hasMany(models.UserAvatar, { foreignKey: 'faceId', as: 'faceUsers' });
      AvatarComponent.hasMany(models.UserAvatar, { foreignKey: 'shirtId', as: 'shirtUsers' });
      AvatarComponent.hasMany(models.UserAvatar, { foreignKey: 'pantsId', as: 'pantsUsers' });
      AvatarComponent.hasMany(models.UserAvatar, { foreignKey: 'specialId', as: 'specialUsers' });
      AvatarComponent.hasMany(models.AvatarUnlock, { foreignKey: 'componentId', as: 'unlocks' });
    }
  }

  AvatarComponent.init({
    avaId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'ava_id'
    },
    category: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['head', 'hair', 'face', 'shirt', 'pants', 'special']]
      }
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    assetPath: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'asset_path'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'AvatarComponent',
    tableName: 'avatar_components',
    timestamps: false
  });

  return AvatarComponent;
};