const { UserAvatar, User } = require('../models');

exports.getUserAvatar = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');

  let avatar = await UserAvatar.findByPk(userId);
  if (!avatar) {
    avatar = await UserAvatar.create({ userId, avatarConfig: {} });
  }
  return avatar;
};

exports.updateUserAvatar = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');

  let avatar = await UserAvatar.findByPk(userId);
  if (!avatar) {
    avatar = await UserAvatar.create({ userId, avatarConfig: data.avatarConfig });
  } else {
    await avatar.update({ avatarConfig: data.avatarConfig });
  }
  return avatar;
};