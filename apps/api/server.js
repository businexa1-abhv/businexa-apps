/**
 * Process entry — loads environment, initializes app services, binds HTTP, graceful shutdown.
 */
require('./src/config/loadEnv');

const http = require('http');
const app = require('./src/app');
const { disconnectMongoDB } = require('./src/config/mongodb');
const logger = require('./src/utils/logger');

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 15000;

/** @type {import('http').Server | null} */
let server = null;
let shuttingDown = false;

async function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`Shutdown signal received: ${signal}`, { pid: process.pid });

  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info('HTTP server closed (no new connections)');
    }
    await disconnectMongoDB();
    logger.info('Graceful shutdown complete');
    clearTimeout(forceExit);
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown', { err: err.message });
    clearTimeout(forceExit);
    process.exit(1);
  }
}

process.once('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.once('SIGINT', () => void gracefulShutdown('SIGINT'));

async function bootstrap() {
  logger.info('Starting Businexa API', {
    pid: process.pid,
    node: process.version,
    env: process.env.NODE_ENV || 'development',
    port: PORT,
    host: HOST,
  });

  try {
    await app.initApp();

    server = http.createServer(app);

    server.on('error', (err) => {
      logger.error('HTTP server failed to start', { err: err.message, code: err.code });
      process.exit(1);
    });

    server.listen(PORT, HOST, () => {
      logger.info('Businexa API is listening', {
        url: `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`,
        port: PORT,
        host: HOST,
      });
    });
  } catch (err) {
    logger.error('Failed to start server', { err: err.message, stack: err.stack });
    process.exit(1);
  }
}

bootstrap();
