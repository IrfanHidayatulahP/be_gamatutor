'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ColumnMovement extends Model {
    static associate(models) {
      ColumnMovement.belongsTo(models.Card, { foreignKey: 'cardId', as: 'card' });
    }
  }

  ColumnMovement.init({
    ccmId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'ccm_id'
    },
    cardId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'cards', key: 'card_id' },
      field: 'card_id'
    },
    fromColumn: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'from_column'
    },
    toColumn: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'to_column'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'ColumnMovement',
    tableName: 'card_column_movements',
    timestamps: false
  });

  return ColumnMovement;
};