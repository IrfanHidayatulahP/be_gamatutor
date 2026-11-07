'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Token extends Model {
    static associate(models) {
      Token.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  Token.init({
    tokenId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'token_id'
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'access_token'
    },
    accessTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'access_token_expiry'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      field: 'user_id'
    }
  }, {
    sequelize,
    modelName: 'Token',
    tableName: 'token',
    timestamps: false
  });

  return Token;
};