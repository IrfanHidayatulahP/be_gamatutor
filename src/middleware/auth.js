const jwt = require('jsonwebtoken');
const { User, Token } = require('../models');

const authenticate = async (req, res, next) => {
  const authHeader = req.header('Authorization') || req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Akses ditolak. Token tidak ada.' });

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    // ★ Cukup verifikasi JWT secara lokal (tanpa query DB)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      ...decoded,
      userId: decoded.id || decoded.userId,
      id: decoded.id
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token tidak valid atau kadaluarsa.' });
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