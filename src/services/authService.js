const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Token } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { verifyGoogleIdToken } = require('../config/googleOAuth');

const generateToken = (user) => {
    return jwt.sign({ id: user.userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

const register = async({ email, password, firstName, lastName, username, role, status }) => {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw new AppError('Email already registered', 400);
    }

    const finalUsername = username || email.split('@')[0];

    const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        username: finalUsername,
        role: role || 'user',
        status: status || 'online'
    });

    const token = generateToken(user);

    await Token.create({
        userId: user.userId,
        accessToken: token,
        accessTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return { user, token };
};

const login = async(email, password) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new AppError('Invalid credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new AppError('Invalid credentials', 401);
    }

    await user.update({ status: 'online' });

    const jwtToken = generateToken(user);

    await Token.create({
        userId: user.userId,
        accessToken: jwtToken,
        accessTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return { user, token: jwtToken };
};

// Fungsi loginGoogle legacy (berdasarkan email)
const loginGoogle = async(email) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new AppError('User not registered', 404);
    }

    await user.update({ status: 'online' });

    const jwtToken = generateToken(user);

    await Token.create({
        userId: user.userId,
        accessToken: jwtToken,
        accessTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return { user, token: jwtToken };
};

const getMe = async(userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    return user;
};

const logout = async(userId, currentToken) => {
    await Token.destroy({
        where: {
            userId,
            accessToken: currentToken
        }
    });
    return { message: 'Logged out successfully' };
};

const refresh = async(userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    await Token.destroy({ where: { userId } });

    const newToken = generateToken(user);

    await Token.create({
        userId: user.userId,
        accessToken: newToken,
        accessTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return { user, token: newToken };
};

const forgotPassword = async(email) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await user.update({
        resetToken,
        resetTokenExpiry
    });

    return {
        message: 'If the email exists, a reset link has been sent',
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    };
};

const resetPassword = async(resetToken, newPassword) => {
    const user = await User.findOne({
        where: {
            resetToken,
            resetTokenExpiry: {
                [Op.gt]: new Date()
            }
        }
    });

    if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await user.update({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
    });

    await Token.destroy({ where: { userId: user.userId } });

    return { message: 'Password reset successful' };
};

// Fitur Pembaruan Profil
const updateProfile = async(userId, data) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const { password, resetToken, resetTokenExpiry, userId: _, createdAt, ...allowedData } = data;

    if (allowedData.email && allowedData.email !== user.email) {
        const existingUser = await User.findOne({ where: { email: allowedData.email } });
        if (existingUser) {
            throw new AppError('Email already in use', 400);
        }
    }

    if (allowedData.username && allowedData.username !== user.username) {
        const existingUser = await User.findOne({ where: { username: allowedData.username } });
        if (existingUser) {
            throw new AppError('Username already in use', 400);
        }
    }

    return user.update(allowedData);
};

// Fitur Google OAuth Resmi 
const googleLogin = async(idToken) => {
    const payload = await verifyGoogleIdToken(idToken);

    if (!payload.email_verified) {
        throw new AppError('Google email not verified', 400);
    }

    const { sub: googleId, email, given_name: firstName, family_name: lastName } = payload;

    let user = await User.findOne({ where: { googleId } });

    if (user) {
        await user.update({ status: 'online' });
    } else {
        user = await User.findOne({ where: { email } });

        if (user) {
            await user.update({ googleId, status: 'online' });
        } else {
            const baseUsername = email.split('@')[0];
            let username = baseUsername;
            let counter = 1;

            while (await User.findOne({ where: { username } })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }

            user = await User.create({
                email,
                password: uuidv4(),
                firstName: firstName || '',
                lastName: lastName || '',
                username,
                googleId,
                status: 'online'
            });
        }
    }

    const token = generateToken(user);

    await Token.create({
        userId: user.userId,
        accessToken: token,
        accessTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return { user, token };
};

module.exports = {
    register,
    login,
    loginGoogle,
    getMe,
    generateToken,
    logout,
    refresh,
    forgotPassword,
    resetPassword,
    googleLogin,
    updateProfile
};