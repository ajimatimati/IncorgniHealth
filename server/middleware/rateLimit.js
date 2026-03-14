const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                   // raised from 100 → 300 for normal usage
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: 'Too many requests, please try again later.' },
});

// Auth-specific limiter (stricter for prod, generous for dev)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,                   // raised from 10 → 50
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: 'Too many auth attempts, please try again later.' },
});

// Prescribe/payment limiter
const sensitiveLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: 'Too many requests for this action, slow down.' },
});

module.exports = { apiLimiter, authLimiter, sensitiveLimiter };
