import { randomBytes, timingSafeEqual } from 'node:crypto';

export function createAuth({ username, password }) {
  const sessions = new Set();

  return {
    login(input) {
      if (!safeEqual(String(input?.username ?? ''), username) || !safeEqual(String(input?.password ?? ''), password)) {
        return null;
      }
      const token = randomBytes(24).toString('hex');
      sessions.add(token);
      return token;
    },
    middleware(req, res, next) {
      const header = req.get('authorization') ?? '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : '';
      if (!token || !sessions.has(token)) return res.status(401).json({ error: 'unauthorized' });
      next();
    }
  };
}

function safeEqual(a, b) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}
