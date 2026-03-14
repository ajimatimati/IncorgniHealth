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
const IS_DEV = process.env.NODE_ENV !== 'production';

// In development: allow any localhost origin (Vite auto-increments ports 5173–517x)
// In production: require CORS_ORIGIN env var to be explicitly set
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);

    if (IS_DEV) {
      return callback(null, true);
    }

    const allowed = process.env.CORS_ORIGIN;
    if (allowed && origin === allowed) {
      return callback(null, true);
    }

    callback(new Error(`CORS: origin '${origin}' not allowed.`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

if (!IS_DEV && !process.env.CORS_ORIGIN) {
  console.error('[SECURITY] CORS_ORIGIN env var is not set. API will block all production cross-origin requests.');
}

const io = new Server(server, {
  cors: corsOptions,
});

// Make io accessible in routes
app.set('io', io);

app.use(cors(corsOptions));
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
app.use('/api/v1/lab', require('./routes/lab'));
app.use('/api/v1/admin', require('./routes/admin'));

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

// Server-side active patients store for the virtual waiting room
const activeWaitingPatients = new Map();

io.on('connection', (socket) => {
  logger.info('Socket connected', { publicId: socket.user?.publicId, socketId: socket.id });

  // --- WebRTC Telemedicine Signaling ---

  // Patient lands on waiting room URL
  socket.on('join-waiting-room', (data) => {
    // data: { doctorPublicId, patientInfo } 
    // Note: doctorPublicId is actually the consultationId in this flow since patients join a general queue
    const { doctorPublicId, patientInfo } = data;
    
    // Store patient in a temporary queue room scoped to the consultation
    const waitingRoomId = `waiting-${doctorPublicId}`;
    socket.join(waitingRoomId);
    
    // Attach info to socket for easy retrieval
    socket.patientInfo = { ...patientInfo, socketId: socket.id, consultationId: doctorPublicId, joinedAt: new Date() };
    
    // Store in global memory map to handle page refreshes from the doctor's end
    activeWaitingPatients.set(socket.id, socket.patientInfo);
    
    logger.info('Patient joined waiting room', { consultationId: doctorPublicId, socketId: socket.id });
    
    // Notify all doctors in the pool
    io.to('doctor-pool').emit('patient-arrived', socket.patientInfo);
  });

  // Doctor connects to their dashboard
  socket.on('doctor-join', (doctorPublicId) => {
    socket.join(`doctor-${doctorPublicId}`);
    socket.join('doctor-pool'); // Doctors join the general pool
    logger.info('Doctor joined queue channel', { doctorPublicId });
    
    // Instantly hydrate the doctor's view with anyone already waiting
    socket.emit('active-patients', Array.from(activeWaitingPatients.values()));
  });

  socket.on('admit-patient', (data) => {
    // Doctor admits patient from waiting room to a specific Jitsi room
    if (data.to) {
      io.to(data.to).emit('admit-patient', { roomId: data.roomId });
    }
  });

  // --- Chat Messaging Signaling ---

  socket.on('join_room', (consultationId) => {
    socket.join(consultationId);
    logger.info('User joined chat room', { socketId: socket.id, consultationId });
  });

  socket.on('send_message', async (data) => {
    // data should contain { consultationId, senderId, content }
    try {
      const { consultationId, senderId, content } = data;
      
      // Save to database
      const newMessage = await prisma.message.create({
        data: {
          consultationId,
          senderId,
          content,
          isSystem: false,
        }
      });
      
      // Broadcast to the whole room (including sender, for immediate confirmation)
      io.to(consultationId).emit('receive_message', newMessage);
      logger.info('Message sent and saved', { consultationId, messageId: newMessage.id });
    } catch (error) {
      logger.error('Failed to save message', { error: error.message, data });
    }
  });

  socket.on('typing', (data) => {
    // data like { consultationId, nickname }
    socket.to(data.consultationId).emit('typing', data);
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.consultationId).emit('stop_typing', data);
  });

  // --- End WebRTC Signaling ---

  socket.on('disconnect', () => {
    logger.debug('Socket disconnected', { socketId: socket.id });
    
    if (socket.patientInfo) {
      activeWaitingPatients.delete(socket.id);
      io.to('doctor-pool').emit('patient-left', socket.id);
    }
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
