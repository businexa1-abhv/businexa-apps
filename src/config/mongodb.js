/**
 * Mongoose connection — reads `MONGODB_URI` and optional pool / timeout settings from `.env`.
 */
const mongoose = require('mongoose');
const logger = require('./logger');

let connected = false;

function getConnectionOptions() {
  return {
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE) || 10,
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) || 10000,
  };
}

async function connectMongoDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || !String(uri).trim()) {
    throw new Error('MONGODB_URI is not set in environment');
  }

  if (connected) return mongoose.connection;

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, getConnectionOptions());
  connected = true;
  logger.info('MongoDB connected', {
    db: mongoose.connection.name,
    host: mongoose.connection.host,
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { err: err.message });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  return mongoose.connection;
}

async function disconnectMongoDB() {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
  logger.info('MongoDB disconnected by application');
}

module.exports = { connectMongoDB, disconnectMongoDB, mongoose };
