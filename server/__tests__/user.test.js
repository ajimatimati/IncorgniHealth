const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/user');
const prisma = require('../db');

// Mock Prisma
jest.mock('../db', () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
  },
  consultation: {
    findMany: jest.fn(),
  },
}));

// Mock Auth Middleware
jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { id: 'user-123', role: 'PATIENT' };
  next();
});

const app = express();
app.use(express.json());
app.use('/api/v1/user', userRoutes);

describe('User Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /profile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-123',
        publicId: '#GH-TEST',
        role: 'PATIENT',
        walletBalance: 1000,
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app).get('/api/v1/user/profile');

      expect(res.statusCode).toBe(200);
      expect(res.body.publicId).toBe('#GH-TEST');
    });
  });

  describe('PUT /profile', () => {
    it('should update profile fields', async () => {
      prisma.user.update.mockResolvedValue({
        id: 'user-123',
        nickname: 'NewNick',
      });

      const res = await request(app)
        .put('/api/v1/user/profile')
        .send({ nickname: 'NewNick', age: 25 });

      expect(res.statusCode).toBe(200);
      expect(res.body.nickname).toBe('NewNick');
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should validate input', async () => {
      const res = await request(app)
        .put('/api/v1/user/profile')
        .send({ age: 200 }); // Invalid age

      expect(res.statusCode).toBe(400); // Zod error
    });
  });
});
