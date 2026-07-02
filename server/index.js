const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// jsonwebtoken was only needed for socket auth in this file, which is removed

dotenv.config();

const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimit');
const prisma = require('./db');
const { SECRET_KEY } = require('./utils/crypto');

const app = express();
app.set('trust proxy', 1);
const IS_DEV = process.env.NODE_ENV !== 'production';

// In development: allow any localhost origin (Vite auto-increments ports)
// In production: require CORS_ORIGIN env var to be explicitly set (comma separated for multiple)
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);

    if (IS_DEV || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('https://localhost') || origin.startsWith('https://127.0.0.1')) {
      return callback(null, true);
    }

    const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(url => url.trim());
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: Multi-Origin security blocked request from '${origin}'.`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-requested-with', 'bypass-tunnel-reminder', 'ngrok-skip-browser-warning'],
  credentials: true,
};

if (!IS_DEV && !process.env.CORS_ORIGIN) {
  logger.warn('[SECURITY WARNING] CORS_ORIGIN env var is not set. API will block ALL production cross-origin requests from Netlify.');
}

// Socket.IO has been retired from the backend. Real-time connections are now handled
// directly on the client by Supabase Realtime channels.

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);

// ─── HTTPS Enforcement (production only) ─────────────────────────────────────
// Handles deployments behind a TLS-terminating proxy (Render, Railway, Heroku)
// that sets the X-Forwarded-Proto header. No effect in development.
if (!IS_DEV) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// ─── Request Logging Middleware ───
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip || req.connection?.remoteAddress
    });
  });
  next();
});

// ─── API v1 Routes ───
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/user', require('./routes/user'));
app.use('/api/v1/doctor', require('./routes/doctor'));
app.use('/api/v1/consultation', require('./routes/consultation'));
app.use('/api/v1/ai', require('./routes/ai'));
app.use('/api/v1/pharmacy', require('./routes/pharmacy'));
app.use('/api/v1/rider', require('./routes/rider'));
app.use('/api/v1/payments', require('./routes/payments'));
app.use('/api/v1/notifications', require('./routes/notification'));
app.use('/api/v1/lab', require('./routes/lab'));
app.use('/api/v1/admin', require('./routes/admin'));

// Health check (basic)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'IncogniCare API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Deep health check — verifies database connectivity
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', db: 'connected', uptime: process.uptime() });
  } catch (err) {
    logger.error('Health check failed', { error: err.message });
    res.status(503).json({ status: 'unhealthy', db: 'disconnected' });
  }
});

// --- Legacy Socket.IO WebRTC & Chat Signaling has been removed ---
// These responsibilities have been fully migrated to Supabase Realtime using 
// Postgres pub/sub, allowing this Node backend to run statelessly on Vercel.

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ msg: 'Internal server error' });
});

// ─── Process-level error handlers ────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason: reason?.message || reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception — shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
function gracefulShutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);
  if (app.locals.serverInstance) {
    app.locals.serverInstance.close(async () => {
      logger.info('HTTP server closed');
      await prisma.$disconnect();
      logger.info('Database disconnected');
      process.exit(0);
    });
  } else {
    prisma.$disconnect().then(() => {
      logger.info('Database disconnected');
      process.exit(0);
    });
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const PORT = process.env.PORT || 3001;

// Only listen actively if running locally
if (process.env.NODE_ENV !== 'production' || process.env.IS_VERCEL !== 'true') {
  app.locals.serverInstance = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} (Local Mode)`);
  });
}

// Export the Express API to serve as a serverless function in Vercel
module.exports = app;
