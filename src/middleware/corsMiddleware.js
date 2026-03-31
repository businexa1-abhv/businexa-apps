/**
 * CORS — allow only origins listed in `CORS_ORIGIN` (comma-separated).
 * Browser requests must send `Origin` matching the allowlist.
 * Non-browser clients (no `Origin`) are allowed for health checks and tooling.
 *
 * @see NODEJS_API_GENERATION_PROMPT.md — CORS: Allow only frontend domains
 */
const cors = require('cors');

function getAllowedOrigins() {
  const raw = process.env.CORS_ORIGIN;
  if (!raw || !raw.trim()) {
    return ['http://localhost:3000'];
  }
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function corsMiddleware() {
  const allowed = getAllowedOrigins();

  return cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'Accept',
      'Origin',
    ],
    maxAge: 86400,
    optionsSuccessStatus: 204,
  });
}

module.exports = { corsMiddleware, getAllowedOrigins };
