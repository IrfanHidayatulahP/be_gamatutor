// const { Friendship, User } = require('../models');
// const { AppError } = require('../middleware/errorHandler');
// const { Op } = require('sequelize');

// const sendFriendRequest = async (userId, friendId) => {
//   if (userId === friendId) {
//     throw new AppError('Cannot send friend request to yourself', 400);
//   }

//   const friend = await User.findByPk(friendId);
//   if (!friend) {
//     throw new AppError('User not found', 404);
//   }

//   const existing = await Friendship.findOne({
//     where: {
//       [Op.or]: [
//         { userId, friendId },
//         { userId: friendId, friendId: userId }
//       ]
//     }
//   });

//   if (existing) {
//     throw new AppError('Friend request already exists', 400);
//   }

//   return Friendship.create({
//     userId,
//     friendId,
//     status: 'pending'
//   });
// };

// const getAllFriendships = async (filters = {}) => {
//   const where = {};
//   if (filters.status) where.status = filters.status;

//   return Friendship.findAll({
//     where,
//     include: [
//       { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
//       { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] }
//     ],
//     order: [['createdAt', 'DESC']],
//     limit: filters.limit || 50,
//     offset: filters.offset || 0
//   });
// };

// const getFriendshipById = async (id) => {
//   const friendship = await Friendship.findByPk(id, {
//     include: [
//       { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
//       { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] }
//     ]
//   });
//   if (!friendship) {
//     throw new AppError('Friendship not found', 404);
//   }
//   return friendship;
// };

// const getUserFriends = async (userId, filters = {}) => {
//   const where = {
//     [Op.or]: [
//       { userId, status: 'accepted' },
//       { friendId: userId, status: 'accepted' }
//     ]
//   };

//   return Friendship.findAll({
//     where,
//     include: [
//       { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
//       { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] }
//     ],
//     order: [['createdAt', 'DESC']],
//     limit: filters.limit || 50,
//     offset: filters.offset || 0
//   });
// };

// const getPendingRequests = async (userId, filters = {}) => {
//   const where = {
//     friendId: userId,
//     status: 'pending'
//   };

//   return Friendship.findAll({
//     where,
//     include: [
//       { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] }
//     ],
//     order: [['createdAt', 'DESC']],
//     limit: filters.limit || 50,
//     offset: filters.offset || 0
//   });
// };

// const acceptFriendRequest = async (id, userId) => {
//   const friendship = await Friendship.findByPk(id);
//   if (!friendship) {
//     throw new AppError('Friend request not found', 404);
//   }

//   if (friendship.friendId !== userId) {
//     throw new AppError('Not authorized to accept this request', 403);
//   }

//   if (friendship.status !== 'pending') {
//     throw new AppError('Request is not pending', 400);
//   }

//   return friendship.update({ status: 'accepted', updatedAt: new Date() });
// };

// const blockFriend = async (id, userId) => {
//   const friendship = await Friendship.findByPk(id);
//   if (!friendship) {
//     throw new AppError('Friendship not found', 404);
//   }

//   if (friendship.userId !== userId && friendship.friendId !== userId) {
//     throw new AppError('Not authorized', 403);
//   }

//   return friendship.update({ status: 'blocked', updatedAt: new Date() });
// };

// const rejectFriendRequest = async (id, userId) => {
//   const friendship = await Friendship.findByPk(id);
//   if (!friendship) {
//     throw new AppError('Friend request not found', 404);
//   }

//   if (friendship.friendId !== userId) {
//     throw new AppError('Not authorized to reject this request', 403);
//   }

//   if (friendship.status !== 'pending') {
//     throw new AppError('Request is not pending', 400);
//   }

//   return friendship.update({ status: 'declined', updatedAt: new Date() });
// };

// const removeFriendship = async (id, userId) => {
//   const friendship = await Friendship.findByPk(id);
//   if (!friendship) {
//     throw new AppError('Friendship not found', 404);
//   }

//   if (friendship.userId !== userId && friendship.friendId !== userId) {
//     throw new AppError('Not authorized', 403);
//   }

//   await friendship.destroy();
//   return { message: 'Friendship removed' };
// };

// module.exports = {
//   sendFriendRequest,
//   getAllFriendships,
//   getFriendshipById,
//   getUserFriends,
//   getPendingRequests,
//   acceptFriendRequest,
//   blockFriend,
//   rejectFriendRequest,
//   removeFriendship
// };

const { Friendship, User, Notification } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const sendFriendRequest = async (userId, friendId) => {
  if (userId === friendId) {
    throw new AppError('Cannot send friend request to yourself', 400);
  }

  const friend = await User.findByPk(friendId);
  if (!friend) {
    throw new AppError('User not found', 404);
  }

  const existing = await Friendship.findOne({
    where: {
      [Op.or]: [
        { userId, friendId },
        { userId: friendId, friendId: userId }
      ]
    }
  });

  if (existing) {
    throw new AppError('Friend request already exists', 400);
  }

  // 1. Buat data pertemanan (status: pending)
  const friendship = await Friendship.create({
    userId,
    friendId,
    status: 'pending'
  });

  // 2. Ambil data nama pengirim untuk isi teks notifikasi
  const requester = await User.findByPk(userId, {
    attributes: ['firstName', 'lastName', 'username']
  });
  
  const senderName = [requester.firstName, requester.lastName].filter(Boolean).join(' ') || requester.username;

  // 3. Buat Notifikasi otomatis dengan tipe 'collaboration' agar masuk ke tab Kanban/Collaboration
  // await Notification.create({
  //   userId: friendId,
  //   type: 'collaboration',
  //   title: 'Permintaan Pertemanan Baru',
  //   message: `${senderName} mengirimkan permintaan pertemanan kepada Anda.`,
  //   triggerUserId: userId,
  //   triggerAction: 'friend_request',
  //   delivered: true,
  //   sentAt: new Date(),
  //   read: false,
  //   clicked: false
  // });

  // 3. Buat Notifikasi otomatis untuk penerima permintaan (friendId)
  // try {
  //   await Notification.create({
  //     userId: friendId,
  //     type: 'collaboration', // 👈 Coba ganti ke 'task' (atau 'collaboration' jika sebelumnya tidak error di tipe ini)
  //     title: 'Permintaan Pertemanan Baru',
  //     message: `${senderName} mengirimkan permintaan pertemanan kepada Anda.`,
  //     triggerUserId: userId,
  //     triggerAction: 'friend_request',
  //     delivered: true,
  //     sentAt: new Date(),
  //     read: false,
  //     clicked: false
  //   });
  // } catch (notifErr) {
  //   console.error('Gagal membuat notifikasi, tapi pertemanan tetap diproses:', notifErr.message);
  // }

  // try {
  //   await Notification.create({
  //     userId: friendId,
  //     type: 'kanban', // Pastikan seragam huruf kecil 'kanban' atau 'collaboration'
  //     title: 'Permintaan Pertemanan Baru',
  //     message: `${senderName} mengirimkan permintaan pertemanan kepada Anda.`,
  //     triggerUserId: userId,
  //     triggerAction: 'friend_request',
  //     delivered: true,
  //     sentAt: new Date(),
  //     read: false,
  //     clicked: false
  //   });
  // } catch (notifErr) {
  //   console.error('Gagal membuat notifikasi:', notifErr.message);
  // }

  try {
    await Notification.create({
      userId: friendId,
      type: 'kanban',
      title: 'Permintaan Pertemanan Baru',
      message: `${senderName} mengirimkan permintaan pertemanan kepada Anda.`,
      triggerUserId: userId,
      triggerAction: 'friend_request',
      referenceId: friendship.fsId, // 👈 Pastikan kolom ini ada atau simpan fsId di triggerAction / properti lain jika ada
      delivered: true,
      sentAt: new Date(),
      read: false,
      clicked: false
    });
  } catch (notifErr) {
    console.error('Gagal membuat notifikasi:', notifErr.message);
  }

  return friendship;
};

const cancelFriendRequest = async (userId, friendId) => {
  const friendship = await Friendship.findOne({
    where: {
      [Op.or]: [
        { userId, friendId, status: 'pending' },
        { userId: friendId, friendId: userId, status: 'pending' }
      ]
    }
  });

  if (!friendship) {
    throw new AppError('Pending friend request not found', 404);
  }

  // Hapus juga notifikasi terkait
  await Notification.destroy({
    where: {
      [Op.or]: [
        { userId: friendId, triggerUserId: userId, triggerAction: 'friend_request' },
        { userId: userId, triggerUserId: friendId, triggerAction: 'friend_request' }
      ]
    }
  });

  await friendship.destroy();
  return { message: 'Friend request cancelled' };
};

const getAllFriendships = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;

  return Friendship.findAll({
    where,
    include: [
      { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getFriendshipById = async (id) => {
  const friendship = await Friendship.findByPk(id, {
    include: [
      { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ]
  });
  if (!friendship) {
    throw new AppError('Friendship not found', 404);
  }
  return friendship;
};

const getUserFriends = async (userId, filters = {}) => {
  const where = {
    [Op.or]: [
      { userId, status: 'accepted' },
      { friendId: userId, status: 'accepted' }
    ]
  };

  return Friendship.findAll({
    where,
    include: [
      { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getPendingRequests = async (userId, filters = {}) => {
  const where = {
    friendId: userId,
    status: 'pending'
  };

  return Friendship.findAll({
    where,
    include: [
      { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

// const acceptFriendRequest = async (id, userId) => {
//   const friendship = await Friendship.findByPk(id);
//   if (!friendship) {
//     throw new AppError('Friend request not found', 404);
//   }

//   if (friendship.friendId !== userId) {
//     throw new AppError('Not authorized to accept this request', 403);
//   }

//   if (friendship.status !== 'pending') {
//     throw new AppError('Request is not pending', 400);
//   }

//   await friendship.update({ status: 'accepted', updatedAt: new Date() });

//   await Notification.create({
//     userId: friendship.userId,
//     type: 'social_presence',
//     title: 'Permintaan Pertemanan Diterima',
//     message: 'Permintaan pertemanan Anda telah diterima.',
//     triggerUserId: userId,
//     triggerAction: 'friend_accepted',
//     delivered: true,
//     sentAt: new Date()
//   });

//   return friendship;
// };

const acceptFriendRequest = async (id, userId) => {
  const friendship = await Friendship.findByPk(id);
  if (!friendship) {
    throw new AppError('Friend request not found', 404);
  }

  if (friendship.friendId !== userId) {
    throw new AppError('Not authorized to accept this request', 403);
  }

  if (friendship.status !== 'pending') {
    throw new AppError('Request is not pending', 400);
  }

  // 1. Ubah status pertemanan menjadi accepted
  await friendship.update({ status: 'accepted', updatedAt: new Date() });

  // 2. Hapus notifikasi 'friend_request' yang terkait agar langsung hilang dari daftar penerima
  await Notification.destroy({
    where: {
      user_id: userId,
      trigger_user_id: friendship.userId,
      trigger_action: 'friend_request'
    }
  });

  // (Opsional) Kirim notifikasi balasan jika diperlukan, atau biarkan kosong
  try {
    await Notification.create({
      userId: friendship.userId,
      type: 'kanban',
      title: 'Permintaan Pertemanan Diterima',
      message: 'Permintaan pertemanan Anda telah diterima.',
      triggerUserId: userId,
      triggerAction: 'friend_accepted',
      delivered: true,
      sentAt: new Date(),
      read: false,
      clicked: false
    });
  } catch (e) {
    console.error('Gagal membuat notifikasi balik:', e.message);
  }

  return friendship;
};

const blockFriend = async (id, userId) => {
  const friendship = await Friendship.findByPk(id);
  if (!friendship) {
    throw new AppError('Friendship not found', 404);
  }

  if (friendship.userId !== userId && friendship.friendId !== userId) {
    throw new AppError('Not authorized', 403);
  }

  return friendship.update({ status: 'blocked', updatedAt: new Date() });
};

const rejectFriendRequest = async (id, userId) => {
  const friendship = await Friendship.findByPk(id);
  if (!friendship) {
    throw new AppError('Friend request not found', 404);
  }

  if (friendship.friendId !== userId) {
    throw new AppError('Not authorized to reject this request', 403);
  }

  if (friendship.status !== 'pending') {
    throw new AppError('Request is not pending', 400);
  }

  return friendship.update({ status: 'declined', updatedAt: new Date() });
};

const removeFriendship = async (id, userId) => {
  const friendship = await Friendship.findByPk(id);
  if (!friendship) {
    throw new AppError('Friendship not found', 404);
  }

  if (friendship.userId !== userId && friendship.friendId !== userId) {
    throw new AppError('Not authorized', 403);
  }

  await friendship.destroy();
  return { message: 'Friendship removed' };
};

module.exports = {
  sendFriendRequest,
  cancelFriendRequest,
  getAllFriendships,
  getFriendshipById,
  getUserFriends,
  getPendingRequests,
  acceptFriendRequest,
  blockFriend,
  rejectFriendRequest,
  removeFriendship
};