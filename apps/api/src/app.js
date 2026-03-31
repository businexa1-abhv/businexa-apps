/**
 * Businexa Express application
 * @see NODEJS_API_GENERATION_PROMPT.md — Express setup, security middleware, routes
 *
 * Usage:
 *   const app = require('./app');
 *   await app.initApp(); // MongoDB + Firebase Admin (call before listen)
 *   http.createServer(app).listen(PORT);
 */
const express = require('express');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const { connectMongoDB } = require('./config/mongodb');
const { initFirebaseAdmin } = require('./config/firebase');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { corsMiddleware } = require('./middleware/corsMiddleware');
const { requestLogger } = require('./middleware/requestLogger');

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shops');
const productRoutes = require('./routes/products');
const subscriptionRoutes = require('./routes/subscriptions');
const userRoutes = require('./routes/users');
const qrRoutes = require('./routes/qr');
const analyticsRoutes = require('./routes/analytics');

const app = express();

/** Behind reverse proxy (rate limit IP, HTTPS, X-Forwarded-*). */
if (process.env.TRUST_PROXY === '1' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

/** Enforce HTTPS in production. Set ENFORCE_HTTPS=false to disable. */
function requireHttps(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();
  if (process.env.ENFORCE_HTTPS === 'false') return next();
  const forwarded = req.headers['x-forwarded-proto'];
  if (forwarded === 'https' || req.secure) return next();
  return res.status(403).json({
    success: false,
    message: 'HTTPS required',
    code: 'HTTPS_REQUIRED',
  });
}

// —— Security & parsing ——
app.use(requireHttps);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(corsMiddleware());
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(apiLimiter);

// —— Health & API docs ——
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'businexa-api' });
});

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Businexa API',
      version: '1.0.0',
      description: 'QR advertisement platform API — see NODEJS_API_GENERATION_PROMPT.md for full contract.',
    },
    servers: [{ url: '/api' }],
  },
  apis: [],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// —— API routes ——
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/analytics', analyticsRoutes);

// —— Global handlers (order matters) ——
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Connect MongoDB and initialize Firebase Admin (load from `.env`).
 * Call once before `http.createServer(app).listen(...)`.
 */
async function initApp() {
  await connectMongoDB();
  initFirebaseAdmin();
}

app.initApp = initApp;

module.exports = app;
