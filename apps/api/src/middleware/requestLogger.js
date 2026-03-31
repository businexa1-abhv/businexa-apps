/**
 * HTTP request logging (method, path, status, duration, client IP).
 * Uses Winston; skips verbose logging for `/health` in production.
 */
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const logPayload = {
      method,
      url: originalUrl,
      status: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (originalUrl === '/health' && process.env.NODE_ENV === 'production') {
      return;
    }

    if (res.statusCode >= 500) {
      logger.error('HTTP', logPayload);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP', logPayload);
    } else {
      logger.info('HTTP', logPayload);
    }
  });

  next();
}

module.exports = { requestLogger };
