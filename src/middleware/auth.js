const jwt = require('jsonwebtoken');
const { User, Token } = require('../models');

const authenticate = async(req, res, next) => {
    try {
        const authHeader = req.header('Authorization') || req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Akses ditolak. Token tidak ada.' });
        }

        const token = authHeader.startsWith('Bearer ') ?
            authHeader.slice(7).trim() :
            authHeader.trim();

        if (!token) {
            return res.status(401).json({ error: 'Format token tidak valid.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const targetUserId = decoded.id || decoded.userId;

        const user = await User.findByPk(targetUserId);
        if (!user) {
            return res.status(401).json({ error: 'User tidak ditemukan.' });
        }

        const tokenRecord = await Token.findOne({
            where: {
                userId: user.userId,
                accessToken: token
            }
        });

        if (!tokenRecord) {
            return res.status(401).json({ error: 'Token tidak ditemukan atau sudah dicabut (revoked).' });
        }

        if (tokenRecord.accessTokenExpiry && new Date() > new Date(tokenRecord.accessTokenExpiry)) {
            return res.status(401).json({ error: 'Token sudah kadaluarsa.' });
        }

        user.id = user.userId;
        req.user = user;
        req.user.userId = user.userId;
        req.user.id = user.userId;
        req.token = token;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token kadaluarsa.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token tidak valid.' });
        }
        next(error);
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
        }
        next();
    };
};

module.exports = { authenticate, authorize };