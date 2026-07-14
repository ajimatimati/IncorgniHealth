process.env.NODE_ENV = 'test';
const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const prisma = require('../db');
const { getTOTPCode } = require('../utils/totp');
const jwt = require('jsonwebtoken');
const { hashData, SECRET_KEY } = require('../utils/crypto');

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
    it('should generate email registration OTP when email is new (OTP not exposed in response)', async () => {
      prisma.user.findFirst.mockResolvedValue(null); // new email

      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'newuser@example.com', role: 'PATIENT' });

      expect(res.statusCode).toBe(200);
      expect(res.body.isExisting).toBe(false);
      expect(res.body.emailSent).toBeDefined();
      // OTP must NOT be leaked in the response (security fix)
      expect(res.body).not.toHaveProperty('testOtp');
      expect(res.body).not.toHaveProperty('demoOtp');
      // But we can verify OTP was stored internally for testing
      const cached = authRoutes._otpCache.get('newuser@example.com');
      expect(cached).toBeDefined();
      expect(cached.otp).toHaveLength(6);
    });

    it('should return isExisting true for registered emails without generating OTP', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'user-123' });

      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'existing@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.isExisting).toBe(true);
      expect(res.body).not.toHaveProperty('testOtp');
    });

    it('should fail with invalid email validation', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'invalid-email' });

      expect(res.statusCode).toBe(400); // Zod validation failure
    });
  });

  describe('POST /verify', () => {
    it('should register a new user successfully if correct email OTP is supplied', async () => {
      prisma.user.findFirst.mockResolvedValue(null); // user does not exist yet
      prisma.user.findUnique.mockResolvedValue(null); // GhostId unique
      prisma.user.create.mockResolvedValue({
        id: 'user-123',
        publicId: '#GH-TEST',
        role: 'PATIENT',
      });

      // 1. Generate OTP first
      await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'newuser@example.com', role: 'PATIENT' });

      // Get OTP from internal cache (not from response — that's the security fix)
      const cached = authRoutes._otpCache.get('newuser@example.com');
      const testOtp = cached.otp;

      // 2. Submit verify with incorrect OTP -> should fail
      const failedVerify = await request(app)
        .post('/api/v1/auth/verify')
        .send({ email: 'newuser@example.com', otp: '111111', emailOtp: '999999' });
      expect(failedVerify.statusCode).toBe(400);

      // 3. Submit verify with correct OTP -> should succeed
      const verifyRes = await request(app)
        .post('/api/v1/auth/verify')
        .send({ email: 'newuser@example.com', otp: '111111', emailOtp: testOtp, role: 'PATIENT' });

      expect(verifyRes.statusCode).toBe(200);
      expect(verifyRes.body).toHaveProperty('token');
      expect(verifyRes.body).toHaveProperty('refreshToken');
    });

    it('should log in an existing user directly without email OTP using correct PIN', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-123',
        publicId: '#GH-TEST',
        role: 'PATIENT',
        pinHash: hashData('111111'), // Mock hashed PIN
      });

      const res = await request(app)
        .post('/api/v1/auth/verify')
        .send({ email: 'existing@example.com', otp: '111111' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should trigger 2FA tempToken response for DOCTOR role instead of direct login', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'doc-123',
        publicId: '#GH-DOC1',
        role: 'DOCTOR',
        pinHash: hashData('111111'), // PIN 111111
      });

      const res = await request(app)
        .post('/api/v1/auth/verify')
        .send({ email: 'doctor@example.com', otp: '111111' });

      expect(res.statusCode).toBe(200);
      expect(res.body.requires2FA).toBe(true);
      expect(res.body).toHaveProperty('tempToken');
    });
  });

  describe('POST /verify-2fa', () => {
    it('should verify TOTP code and issue JWT tokens', async () => {
      const mockSecret = 'ORSXG5BRGIZTINJWG4======'; // standard base32 secret
      const encryptedDataWithMfa = require('../utils/crypto').encryptData({ mfaSecret: mockSecret });

      prisma.user.findUnique.mockResolvedValue({
        id: 'doc-123',
        publicId: '#GH-DOC1',
        role: 'DOCTOR',
        encryptedData: encryptedDataWithMfa,
      });

      const tempToken = jwt.sign({ tempUserId: 'doc-123', isFirstSetup: false }, SECRET_KEY);
      const correctCode = getTOTPCode(mockSecret);

      const res = await request(app)
        .post('/api/v1/auth/verify-2fa')
        .send({ tempToken, code: correctCode });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid TOTP codes', async () => {
      const mockSecret = 'ORSXG5BRGIZTINJWG4======';
      const encryptedDataWithMfa = require('../utils/crypto').encryptData({ mfaSecret: mockSecret });

      prisma.user.findUnique.mockResolvedValue({
        id: 'doc-123',
        publicId: '#GH-DOC1',
        role: 'DOCTOR',
        encryptedData: encryptedDataWithMfa,
      });

      const tempToken = jwt.sign({ tempUserId: 'doc-123', isFirstSetup: false }, SECRET_KEY);

      const res = await request(app)
        .post('/api/v1/auth/verify-2fa')
        .send({ tempToken, code: '000000' }); // invalid code

      expect(res.statusCode).toBe(401);
      expect(res.body.msg).toBe('Invalid authenticator code.');
    });
  });
});
