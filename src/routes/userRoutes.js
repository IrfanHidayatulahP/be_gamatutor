// const express = require('express');
// const { getUsers, getUser, updateUserProfile, updateUserStatusController, deleteUserAccount } = require('../controllers/userController');
// const { authenticate, authorize } = require('../middleware/auth');
// const { uuidParamValidation } = require('../middleware/validation');
// const { searchUsers } = require('../controllers/userController');

// const router = express.Router();

// // All user routes require authentication
// router.use(authenticate);

// // Admin routes
// router.get('/', authorize('admin'), getUsers);
// router.delete('/:id', authorize('admin'), uuidParamValidation, deleteUserAccount);

// // User profile routes
// router.get('/:id', uuidParamValidation, getUser);
// router.put('/:id', uuidParamValidation, updateUserProfile);
// router.put('/:id/status', uuidParamValidation, updateUserStatusController);

// router.get('/search', searchUsers);

// module.exports = router;

const express = require('express');
const { 
  getUsers, 
  getUser, 
  updateUserProfile, 
  updateUserStatusController, 
  deleteUserAccount, 
  searchUsers 
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { uuidParamValidation } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

router.get('/search', searchUsers);

// Admin routes
router.get('/', authorize('admin'), getUsers);
router.delete('/:id', authorize('admin'), uuidParamValidation, deleteUserAccount);

// User profile routes
router.get('/:id', uuidParamValidation, getUser);
router.put('/:id', uuidParamValidation, updateUserProfile);
router.put('/:id/status', uuidParamValidation, updateUserStatusController);

module.exports = router;