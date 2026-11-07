'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Token, { foreignKey: 'userId', as: 'tokens' });
      User.hasMany(models.Card, { foreignKey: 'userId', as: 'cards' });
      User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
      User.hasMany(models.Chat, { foreignKey: 'userId', as: 'chats' });
      User.hasMany(models.Friendship, { foreignKey: 'userId', as: 'friendRequestsSent' });
      User.hasMany(models.Friendship, { foreignKey: 'friendId', as: 'friendRequestsReceived' });
    }

    async comparePassword(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    }

    toJSON() {
      const values = Object.assign({}, this.get());
      delete values.password;
      delete values.resetToken;
      delete values.resetTokenExpiry;
      return values;
    }
  }

  User.init({
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'user_id'
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'last_name'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { len: [6, 16] }
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user',
      validate: {
        isIn: [['user', 'admin']]
      }
    },
    status: {
      type: DataTypes.CHAR(7),
      allowNull: false,
      defaultValue: 'offline',
      validate: {
        isIn: [['online', 'offline']]
      }
    },
    resetToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reset_token'
    },
    resetTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reset_token_expiry'
    },
    archived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'archived'
    },
    xp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue:0
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 12);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  });

  return User;
};