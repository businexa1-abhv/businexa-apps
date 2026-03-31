/**
 * Winston logger — levels and formats driven by environment variables.
 *
 * Env:
 *   NODE_ENV          — development | production (affects format)
 *   LOG_LEVEL         — error | warn | info | http | verbose | debug | silly (default: info prod, debug dev)
 *   LOG_SERVICE_NAME  — default: businexa-api
 *   LOG_FILE          — optional file path; when set, logs also append to this file
 */
const winston = require('winston');
const path = require('path');
const fs = require('fs');

const isProd = process.env.NODE_ENV === 'production';

const level =
  process.env.LOG_LEVEL ||
  (isProd ? 'info' : 'debug');

const serviceName = process.env.LOG_SERVICE_NAME || 'businexa-api';

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level: lvl, message, timestamp, ...meta }) => {
    const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${lvl}] ${message}${rest}`;
  })
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [new winston.transports.Console()];

if (process.env.LOG_FILE) {
  const logPath = path.resolve(process.env.LOG_FILE);
  const dir = path.dirname(logPath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // eslint-disable-next-line no-console
    console.warn(`[logger] Could not create log directory: ${dir}`);
  }
  transports.push(
    new winston.transports.File({
      filename: logPath,
      maxsize: Number(process.env.LOG_MAX_FILE_BYTES) || 5 * 1024 * 1024,
      maxFiles: Number(process.env.LOG_MAX_FILES) || 3,
      tailable: true,
    })
  );
}

const logger = winston.createLogger({
  level,
  format: isProd ? prodFormat : devFormat,
  defaultMeta: { service: serviceName },
  transports,
});

module.exports = logger;
