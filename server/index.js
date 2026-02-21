const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();
const server = http.createServer(app);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Make io accessible in routes (for socket emit in prescriptions etc.)
app.set('io', io);

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(apiLimiter);

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
app.use('/api/v1/admin', require('./routes/admin'));

// Backwards compat: mirror routes without /api/v1/ prefix
app.use('/auth', require('./routes/auth'));
app.use('/user', require('./routes/user'));
app.use('/doctor', require('./routes/doctor'));
app.use('/consultation', require('./routes/consultation'));
app.use('/ai', require('./routes/ai'));
app.use('/pharmacy', require('./routes/pharmacy'));
app.use('/rider', require('./routes/rider'));
app.use('/payments', require('./routes/payments'));
app.use('/notifications', require('./routes/notification'));
app.use('/admin', require('./routes/admin'));

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'IncorgniHealth API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

const prisma = require('./db');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('./utils/crypto');

// Socket.IO auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    socket.user = decoded.user;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  logger.info('Socket connected', { publicId: socket.user?.publicId, socketId: socket.id });

  socket.on('join_room', (consultationId) => {
    socket.join(consultationId);
    logger.debug('Joined room', { publicId: socket.user?.publicId, consultationId });
  });

  socket.on('send_message', async (data) => {
    const { consultationId, senderId, content } = data;

    try {
      const message = await prisma.message.create({
        data: { consultationId, senderId, content },
      });
      io.to(consultationId).emit('receive_message', message);
    } catch (err) {
      logger.error('Message save error', { error: err.message });
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.consultationId).emit('user_typing', {
      userId: socket.user?.id,
      publicId: socket.user?.publicId,
    });
  });

  socket.on('disconnect', () => {
    logger.debug('Socket disconnected', { socketId: socket.id });
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ msg: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
