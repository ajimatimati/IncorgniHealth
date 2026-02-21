const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const prisma = require('../db');

// Mock Prisma
jest.mock('../db', () => ({
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

// Mock rate limiters
jest.mock('../middleware/rateLimit', () => ({
  apiLimiter: (req, res, next) => next(),
  authLimiter: (req, res, next) => next(),
  sensitiveLimiter: (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /signup', () => {
    it('should create a new user when valid data provided', async () => {
      prisma.user.findFirst.mockResolvedValue(null); // No existing user
      prisma.user.findUnique.mockResolvedValue(null); // Ghost ID unused
      prisma.user.create.mockResolvedValue({
        id: '123',
        publicId: '#GH-TEST',
        role: 'PATIENT',
      });

      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ phone: '1234567890' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('tempId');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should fail if phone is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ role: 'PATIENT' });

      if (res.statusCode !== 400) {
        console.log('Signup fail response:', res.statusCode, res.text, res.body);
      }
      expect(res.statusCode).toBe(400); // Zod validation error
    });
  });

  describe('POST /verify', () => {
    it('should fail with invalid OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify')
        .send({ phone: '1234567890', otp: '000000' });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe('Invalid OTP');
    });

    it('should return tokens on valid OTP', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: '123',
        publicId: '#GH-TEST',
        role: 'PATIENT',
      });
      prisma.user.update.mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/verify')
        .send({ phone: '1234567890', otp: '123456' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
    });
  });
});
