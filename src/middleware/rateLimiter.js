const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health'
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limiter for write endpoints
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 write requests per minute
  message: { error: 'Too many write requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

// Very strict limiter for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: { error: 'Too many password reset requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  authLimiter,
  writeLimiter,
  passwordResetLimiter
};