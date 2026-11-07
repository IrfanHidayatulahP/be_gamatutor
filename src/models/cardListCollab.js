'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CardListCollab extends Model {
    static associate(models) {
      CardListCollab.belongsTo(models.Card, { foreignKey: 'cardId', as: 'card' });
      CardListCollab.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      CardListCollab.hasMany(models.CardListChat, { foreignKey: 'collabId', as: 'chats' });
    }
  }

  CardListCollab.init({
    collabId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'collab_id'
    },
    cardId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'cards', key: 'card_id' },
      field: 'card_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      field: 'user_id'
    },
    role: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        isIn: [['owner', 'member']]
      }
    },
    addedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'added_at'
    }
  }, {
    sequelize,
    modelName: 'CardListCollab',
    tableName: 'card_list_collab',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['card_id', 'user_id']
      }
    ]
  });

  return CardListCollab;
};