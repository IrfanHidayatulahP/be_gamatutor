'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CardListChat extends Model {
    static associate(models) {
      CardListChat.belongsTo(models.CardListCollab, { foreignKey: 'collabId', as: 'collab' });
      CardListChat.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  CardListChat.init({
    chatColabId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'chat_colab_id'
    },
    collabId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'card_list_collab', key: 'collab_id' },
      field: 'collab_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      field: 'user_id'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'sent_at'
    }
  }, {
    sequelize,
    modelName: 'CardListChat',
    tableName: 'card_list_chat',
    timestamps: false
  });

  return CardListChat;
};