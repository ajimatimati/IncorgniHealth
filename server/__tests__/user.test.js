const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/user');
const prisma = require('../db');

// Mock Prisma
jest.mock('../db', () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  consultation: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  prescription: {
    create: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
  },
  notification: {
    create: jest.fn(),
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

  describe('POST /order', () => {
    it('should place a direct purchase order successfully', async () => {
      const mockUser = { id: 'user-123', walletBalance: 20000 };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.findMany.mockResolvedValue([{ id: 'pharmacy-1' }]);
      prisma.consultation.create.mockResolvedValue({ id: 'consult-1' });
      prisma.prescription.create.mockResolvedValue({ id: 'presc-1' });
      prisma.order.create.mockResolvedValue({
        id: 'order-1',
        publicOrderId: '#ORD-ABCD',
        secureCode: '1234',
        deliveryAddress: 'Ikeja, Lagos',
      });
      prisma.transaction.create.mockResolvedValue({ id: 'tx-1' });
      prisma.user.update.mockResolvedValue({ id: 'user-123', walletBalance: 7500 });

      const res = await request(app)
        .post('/api/v1/user/order')
        .send({
          deliveryAddress: 'Ikeja, Lagos',
          itemName: 'Complete STI Panel',
          price: 12500,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.order.publicOrderId).toBe('#ORD-ABCD');
      expect(prisma.order.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should block order if balance is insufficient', async () => {
      const mockUser = { id: 'user-123', walletBalance: 1000 };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/user/order')
        .send({
          deliveryAddress: 'Ikeja, Lagos',
          itemName: 'Complete STI Panel',
          price: 12500,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe('Insufficient wallet balance');
    });
  });

  describe('POST /erase', () => {
    it('should shred user identity', async () => {
      prisma.user.update.mockResolvedValue({ id: 'user-123', nickname: 'Deleted User' });

      const res = await request(app)
        .post('/api/v1/user/erase');

      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toBe('Identity erased successfully');
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });
});
