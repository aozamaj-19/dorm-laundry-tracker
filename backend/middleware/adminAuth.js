const crypto = require('crypto');

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// HTTP Basic Auth gate for admin routes. Credentials come from
// ADMIN_USER / ADMIN_PASSWORD env vars; if either is unset, access is denied.
function requireAdminAuth(req, res, next) {
  const { ADMIN_USER, ADMIN_PASSWORD } = process.env;
  const deny = () => {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).json({ error: 'Authentication required' });
  };

  if (!ADMIN_USER || !ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'Admin auth not configured' });
  }

  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return deny();

  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) return deny();

  const user = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  if (!timingSafeEqual(user, ADMIN_USER) || !timingSafeEqual(password, ADMIN_PASSWORD)) {
    return deny();
  }

  next();
}

module.exports = { requireAdminAuth };
