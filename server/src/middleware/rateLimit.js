import rateLimit from 'express-rate-limit';

// Auth endpoints are brute-force targets: cap attempts per IP.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth requests, please try again later' },
});

// Comment creation is a spam vector.
export const commentRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many comments, slow down' },
});
