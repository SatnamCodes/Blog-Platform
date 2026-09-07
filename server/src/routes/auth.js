import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../schemas/authSchemas.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from '../utils/tokens.js';
import { ApiError } from '../middleware/errorHandler.js';
import { authRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

function publicUser(user) {
  return { id: user._id, email: user.email, name: user.name, role: user.role };
}

router.post('/register', authRateLimiter, validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, 'Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name, role: role || 'author' });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    res.status(201).json({ user: publicUser(user), accessToken });
  } catch (err) {
    next(err);
  }
});

router.post('/login', authRateLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(401, 'Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new ApiError(401, 'Invalid credentials');

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    res.json({ user: publicUser(user), accessToken });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) throw new ApiError(401, 'No refresh token');

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError(401, 'Invalid refresh token');

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    res.json({ user: publicUser(user), accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.status(204).end();
});

export default router;
