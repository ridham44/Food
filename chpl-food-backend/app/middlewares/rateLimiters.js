const rateLimit = require('express-rate-limit');

// General ceiling for all API traffic — generous enough for normal dashboard
// usage (polling, pagination) but stops unbounded abuse from a single IP.
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests. Please try again later.' },
});

// Login/OTP/password-reset endpoints are the classic brute-force targets —
// far stricter, keyed by IP since these are hit pre-authentication.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many attempts. Please try again later.' },
});

// AI chat endpoints proxy to a paid LLM API per request — throttled
// separately so a single abusive caller can't run up the API bill.
const aiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many AI requests. Please slow down and try again shortly.' },
});

module.exports = { generalLimiter, authLimiter, aiLimiter };
