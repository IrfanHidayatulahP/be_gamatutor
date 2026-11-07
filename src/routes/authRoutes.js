const express = require('express');
const {
    registerUser,
    registerUserbyGoogle,
    loginUser,
    loginByGoogle,
    getCurrentUser,
    logoutUser,
    refreshToken,
    forgotPasswordController,
    resetPasswordController,
    googleLoginController,
    updateProfileController
} = require('../controllers/authController');
const {
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    updateProfileValidation
} = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Autentikasi Standar (Dilindungi Rate Limiter)
router.post('/register', authLimiter, registerValidation, registerUser);
router.post('/login', authLimiter, loginValidation, loginUser);

// Sesi & Profil Pengguna
router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, updateProfileValidation, updateProfileController);
router.post('/logout', authenticate, logoutUser);
router.post('/refresh', authenticate, refreshToken);

// Reset Password
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, forgotPasswordController);
router.post('/reset-password', passwordResetLimiter, resetPasswordValidation, resetPasswordController);

// Google Sign-In 
router.post('/google', authLimiter, googleLoginController);
router.post('/login/google', authLimiter, loginByGoogle);
router.post('/register/google', authLimiter, registerValidation, registerUserbyGoogle);

module.exports = router;