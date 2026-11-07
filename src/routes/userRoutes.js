const express = require('express');
const { getUsers, getUser, updateUserProfile, updateUserStatusController, deleteUserAccount, searchUsers, registerFcmToken, unregisterFcmToken } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { uuidParamValidation, fcmTokenValidation } = require('../middleware/validation');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Search users (for friend requests)
router.get('/search', searchUsers);

// Admin routes
router.get('/', authorize('admin'), getUsers);
router.delete('/:id', authorize('admin'), uuidParamValidation, deleteUserAccount);

// User profile routes
router.get('/:id', uuidParamValidation, getUser);
router.put('/:id', uuidParamValidation, updateUserProfile);
router.put('/:id/status', uuidParamValidation, updateUserStatusController);

// FCM Token routes
router.post('/fcm-token', fcmTokenValidation, registerFcmToken);
router.delete('/fcm-token', unregisterFcmToken);

module.exports = router;