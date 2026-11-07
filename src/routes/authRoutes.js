const express = require('express');
const { registerUser, registerUserbyGoogle, loginUser, loginByGoogle, getCurrentUser, logoutUser, refreshToken, forgotPasswordController, resetPasswordController } = require('../controllers/authController');
const { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerValidation, registerUser);
router.post('/register/google', registerValidation, registerUserbyGoogle);
router.post('/login', loginValidation, loginUser);
router.post('/login/google', loginByGoogle);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logoutUser);
router.post('/refresh', authenticate, refreshToken);
router.post('/forgot-password', forgotPasswordValidation, forgotPasswordController);
router.post('/reset-password', resetPasswordValidation, resetPasswordController);

module.exports = router;