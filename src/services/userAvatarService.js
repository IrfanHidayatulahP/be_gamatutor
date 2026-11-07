const { UserAvatar, User, AvatarComponent } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const avatarIncludes = [
    { model: AvatarComponent, as: 'hair', attributes: ['avaId', 'name', 'assetPath'] },
    { model: AvatarComponent, as: 'face', attributes: ['avaId', 'name', 'assetPath'] },
    { model: AvatarComponent, as: 'shirt', attributes: ['avaId', 'name', 'assetPath'] },
    { model: AvatarComponent, as: 'pants', attributes: ['avaId', 'name', 'assetPath'] },
    { model: AvatarComponent, as: 'special', attributes: ['avaId', 'name', 'assetPath'] }
];

const getUserAvatar = async(userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    let avatar = await UserAvatar.findByPk(userId, {
        include: avatarIncludes
    });

    if (!avatar) {
        avatar = await UserAvatar.create({ userId });
        avatar = await UserAvatar.findByPk(userId, {
            include: avatarIncludes
        });
    }

    return avatar;
};

const updateUserAvatar = async(userId, data) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Validasi ID komponen avatar jika dikirim
    for (const key of['hairId', 'faceId', 'shirtId', 'pantsId', 'specialId']) {
        if (data[key]) {
            const component = await AvatarComponent.findByPk(data[key]);
            if (!component) {
                throw new AppError(`Avatar component ${key} not found`, 404);
            }
            const expectedCategory = key.replace('Id', '');
            if (component.category !== expectedCategory) {
                throw new AppError(`Invalid component for ${expectedCategory}`, 400);
            }
        }
    }

    let avatar = await UserAvatar.findByPk(userId);
    if (!avatar) {
        avatar = await UserAvatar.create({ userId, ...data });
    } else {
        await avatar.update(data);
    }

    return UserAvatar.findByPk(userId, {
        include: avatarIncludes
    });
};

module.exports = {
    getUserAvatar,
    updateUserAvatar
};