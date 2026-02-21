const prisma = require('../db');

// Mock Prisma
const prismaMock = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  consultation: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('../db', () => prismaMock);

// Mock Auth Middleware
const mockAuth = (req, res, next) => {
  req.user = { 
    id: 'user-123', 
    publicId: '#GH-1234-LAG', 
    role: 'PATIENT' 
  };
  next();
};

const mockDoctorAuth = (req, res, next) => {
  req.user = { 
    id: 'doc-123', 
    publicId: '#DOC-1234-LAG', 
    role: 'DOCTOR' 
  };
  next();
};

beforeEach(() => {
  jest.clearAllMocks();
});

module.exports = {
  prismaMock,
  mockAuth,
  mockDoctorAuth
};
