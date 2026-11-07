'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class UserAvatar extends Model {
        static associate(models) {
            UserAvatar.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
            UserAvatar.belongsTo(models.AvatarComponent, { foreignKey: 'hairId', as: 'hair' });
            UserAvatar.belongsTo(models.AvatarComponent, { foreignKey: 'faceId', as: 'face' });
            UserAvatar.belongsTo(models.AvatarComponent, { foreignKey: 'shirtId', as: 'shirt' });
            UserAvatar.belongsTo(models.AvatarComponent, { foreignKey: 'pantsId', as: 'pants' });
            UserAvatar.belongsTo(models.AvatarComponent, { foreignKey: 'specialId', as: 'special' });
        }
    }

    UserAvatar.init({
        userId: {
            type: DataTypes.UUID,
            primaryKey: true,
            references: { model: 'users', key: 'user_id' },
            field: 'user_id'
        },
        hairId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'avatar_components', key: 'ava_id' },
            field: 'hair_id'
        },
        faceId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'avatar_components', key: 'ava_id' },
            field: 'face_id'
        },
        shirtId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'avatar_components', key: 'ava_id' },
            field: 'shirt_id'
        },
        pantsId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'avatar_components', key: 'ava_id' },
            field: 'pants_id'
        },
        specialId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'avatar_components', key: 'ava_id' },
            field: 'special_id'
        },
        // Opsional untuk fleksibilitas JSON config jika dibutuhkan
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