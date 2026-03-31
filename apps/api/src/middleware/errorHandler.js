/**
 * Centralized error responses (JSON).
 * Maps Mongoose, Multer, and operational errors to stable `{ success, message, code? }` payloads.
 *
 * @see NODEJS_API_GENERATION_PROMPT.md — Security Middleware
 */
const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
}

function normalizeError(err) {
  if (err instanceof AppError) return err;

  const name = err.name;

  if (name === 'CastError' && err.kind === 'ObjectId') {
    return new AppError('Invalid resource id', 400, 'INVALID_OBJECT_ID');
  }

  if (name === 'ValidationError' && err.errors) {
    const first = Object.values(err.errors)[0];
    const msg = first?.message || 'Validation failed';
    return new AppError(msg, 400, 'VALIDATION_ERROR');
  }

  if (name === 'MongoServerError' && err.code === 11000) {
    return new AppError('Duplicate key — resource already exists', 409, 'DUPLICATE_KEY');
  }

  if (name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new AppError('File too large', 413, 'FILE_TOO_LARGE');
    }
    return new AppError(err.message || 'Upload error', 400, 'UPLOAD_ERROR');
  }

  if (err.name === 'ZodError' && Array.isArray(err.issues)) {
    const msg = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return new AppError(msg, 400, 'ZOD_VALIDATION');
  }

  return err;
}

function errorHandler(err, req, res, _next) {
  const normalized = normalizeError(err);
  const status = normalized.statusCode || normalized.status || 500;
  const message = normalized.message || 'Internal Server Error';
  const code = normalized.code;

  if (status >= 500) {
    logger.error(message, {
      path: req.originalUrl,
      method: req.method,
      code,
      stack: err.stack,
    });
  } else if (process.env.NODE_ENV === 'development') {
    logger.warn(message, { path: req.originalUrl, code });
  }

  const body = {
    success: false,
    message,
    ...(code && { code }),
    ...(process.env.NODE_ENV === 'development' && status >= 500 && { stack: err.stack }),
  };

  res.status(status).json(body);
}

/** Wrap async route handlers so rejected promises reach `errorHandler`. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { AppError, notFoundHandler, errorHandler, asyncHandler };
