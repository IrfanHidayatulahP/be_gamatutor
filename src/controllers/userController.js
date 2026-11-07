const { getAllUsers, getUserById, updateUser, updateUserStatus, deleteUser } = require('../services/userService');
const { User } = require('../models');
const { Op } = require('sequelize');

const getUsers = async (req, res, next) => {
  try {
    const users = await getAllUsers(req.query);
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const user = await updateUser(req.params.id, req.body);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const updateUserStatusController = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await updateUserStatus(req.params.id, status);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const deleteUserAccount = async (req, res, next) => {
  try {
    await deleteUser(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    // Ambil query dengan aman (berikan default string kosong jika undefined)
    const query = req.query.query ? req.query.query.trim() : '';
    const currentUserId = req.user.userId;

    const whereCondition = {
      userId: { [Op.ne]: currentUserId } // Mengecualikan user yang sedang login
    };

    // Jika pengguna mengetik sesuatu di search bar, terapkan filter pencarian
    if (query !== '') {
      whereCondition[Op.or] = [
        { firstName: { [Op.iLike]: `%${query}%` } }, // Gunakan iLike untuk PostgreSQL (Case-Insensitive)
        { lastName: { [Op.iLike]: `%${query}%` } },
        { username: { [Op.iLike]: `%${query}%` } }
      ];
    }

    const users = await User.findAll({
      where: whereCondition,
      attributes: ['userId', 'firstName', 'lastName', 'username', 'status'],
      limit: 20
    });

    return res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUserProfile,
  updateUserStatusController,
  deleteUserAccount,
  searchUsers
};