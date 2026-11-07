'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Friendship extends Model {
        static associate(models) {
            Friendship.belongsTo(models.User, { foreignKey: 'userId', as: 'requester' });
            Friendship.belongsTo(models.User, { foreignKey: 'friendId', as: 'friend' });
        }
    }

    Friendship.init({
        fsId: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            field: 'fs_id'
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'user_id' },
            field: 'user_id'
        },
        friendId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'user_id' },
            field: 'friend_id'
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: [
                    ['pending', 'accepted', 'declined', 'blocked']
                ]
            },
            defaultValue: 'pending'
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'updated_at'
        }
    }, {
        sequelize,
        modelName: 'Friendship',
        tableName: 'friendships',
        timestamps: false
    });

    return Friendship;
};