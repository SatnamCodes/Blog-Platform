import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Verifies the access token from the Authorization header and attaches
 * req.user = { id, role }. Access tokens live in memory on the client
 * (never localStorage) to limit XSS exfiltration blast radius; they are
 * short-lived, so this middleware just needs to verify + decode.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Optional auth: attaches req.user if a valid token is present, else continues. */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // ignore invalid token on optional routes
  }
  return next();
}

/**
 * Role-gate middleware. Unused for now (no admin-only routes exist in this
 * base project) but kept in place as the documented extension point: adding
 * an admin route later is `router.get('/x', requireAuth, requireRole('admin'), handler)`
 * with zero changes to auth plumbing.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}
