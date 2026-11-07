const { getUserAvatar, updateUserAvatar } = require('../services/userAvatarService');

const get = async (req, res, next) => {
  try {
    const avatar = await getUserAvatar(req.user.userId);
    res.json({ avatar });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const avatar = await updateUserAvatar(req.user.userId, req.body);
    res.json({ avatar });
  } catch (error) {
    next(error);
  }
};

module.exports = { get, update };