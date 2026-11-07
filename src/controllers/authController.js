const {
    register,
    login,
    getMe,
    logout,
    refresh,
    forgotPassword,
    resetPassword,
    googleLogin,
    updateProfile
} = require('../services/authService');
const { AppError } = require('../middleware/errorHandler');

const registerUser = async(req, res, next) => {
    try {
        const { email, password, firstName, lastName, username, role, status } = req.body;

        const { user, token } = await register({
            email,
            password,
            firstName,
            lastName,
            username,
            role,
            status
        });

        res.status(201).json({ user, token });
    } catch (error) {
        next(error);
    }
};

// Fitur Register Google 
const registerUserbyGoogle = async(req, res, next) => {
    try {
        const { email, firstName, lastName, username, role, status } = req.body;

        const { user, token } = await register({
            email,
            password: 'GOOGLE_AUTH',
            firstName,
            lastName,
            username,
            role: role || 'user',
            status: status || 'online'
        });

        res.status(201).json({ user, token });
    } catch (error) {
        next(error);
    }
};

const loginUser = async(req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await login(email, password);
        res.json({ user, token });
    } catch (error) {
        next(error);
    }
};

// Google Login Handler
const googleLoginController = async(req, res, next) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            throw new AppError('Google ID token is required', 400);
        }
        const { user, token } = await googleLogin(idToken);
        res.json({ user, token });
    } catch (error) {
        next(error);
    }
};

const getCurrentUser = async(req, res, next) => {
    try {
        const user = await getMe(req.user.userId);
        res.json({ user });
    } catch (error) {
        next(error);
    }
};

const logoutUser = async(req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const currentToken = authHeader && authHeader.split(' ')[1];
        await logout(req.user.userId, currentToken);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

const refreshToken = async(req, res, next) => {
    try {
        const { user, token } = await refresh(req.user.userId);
        res.json({ user, token });
    } catch (error) {
        next(error);
    }
};

const forgotPasswordController = async(req, res, next) => {
    try {
        const { email } = req.body;
        const result = await forgotPassword(email);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const resetPasswordController = async(req, res, next) => {
    try {
        const { resetToken, newPassword, token } = req.body;
        const activeToken = resetToken || token;
        const result = await resetPassword(activeToken, newPassword);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const updateProfileController = async(req, res, next) => {
    try {
        const user = await updateProfile(req.user.userId, req.body);
        res.json({ user });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerUser,
    registerUserbyGoogle,
    loginUser,
    loginByGoogle: googleLoginController,
    googleLoginController,
    getCurrentUser,
    logoutUser,
    refreshToken,
    forgotPasswordController,
    resetPasswordController,
    updateProfileController
};