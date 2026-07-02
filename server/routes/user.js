const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../db');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');
const paginate = require('../utils/pagination');

// --- Validation schemas ---
const profileUpdateSchema = z.object({
  nickname: z.string().max(30).optional(),
  avatar: z.string().max(10).optional(),
  age: z.union([
    z.number().int().min(1).max(150),
    z.string().transform(v => { const n = parseInt(v, 10); return isNaN(n) ? undefined : n; })
  ]).optional().nullable(),
  sex: z.enum(['Male', 'Female', 'Other', 'PREFER_NOT_TO_SAY', '']).transform(v => v || null).optional().nullable(),
});

// @route   GET /api/v1/user/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, publicId: true, role: true, age: true, sex: true,
        avatar: true, nickname: true, walletBalance: true,
        isOnline: true, specialization: true, createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    logger.error('Profile fetch error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/v1/user/profile
router.put('/profile', auth, validate(profileUpdateSchema), async (req, res) => {
  try {
    const { nickname, avatar, age, sex } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(nickname !== undefined && { nickname }),
        ...(avatar !== undefined && { avatar }),
        ...(age !== undefined && { age: parseInt(age) || null }),
        ...(sex !== undefined && { sex: sex || null }),
      },
      select: {
        id: true, publicId: true, role: true, age: true, sex: true,
        avatar: true, nickname: true, walletBalance: true,
      },
    });

    logger.info('Profile updated', { publicId: updated.publicId });
    res.json(updated);
  } catch (err) {
    logger.error('Profile update error', { error: err.message, code: err.code });
    res.status(500).json({ msg: err.message || 'Server Error' });
  }
});

// @route   GET /api/v1/user/orders
router.get('/orders', auth, async (req, res) => {
  try {
    const { paginationArgs, buildResponse } = paginate(req.query);

    const orders = await prisma.order.findMany({
      ...paginationArgs,
      where: { patientId: req.user.id, deletedAt: null },
      include: {
        prescription: { select: { medications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(buildResponse(orders));
  } catch (err) {
    logger.error('Orders fetch error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/v1/user/consultations
router.get('/consultations', auth, async (req, res) => {
  try {
    const { paginationArgs, buildResponse } = paginate(req.query);
    const role = req.user.role;
    const filter = role === 'DOCTOR'
      ? { doctorId: req.user.id }
      : { patientId: req.user.id };

    const consultations = await prisma.consultation.findMany({
      ...paginationArgs,
      where: { ...filter, deletedAt: null },
      include: {
        patient: { select: { publicId: true, avatar: true } },
        doctor: { select: { publicId: true, avatar: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(buildResponse(consultations));
  } catch (err) {
    logger.error('Consultations fetch error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/v1/user/doctors
router.get('/doctors', auth, async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR', deletedAt: null },
      select: {
        id: true,
        publicId: true,
        nickname: true,
        avatar: true,
        specialization: true,
        isOnline: true,
        reviewsAsDoctor: { select: { rating: true } }
      }
    });

    const formatted = doctors.map(doc => {
      const totalRatings = doc.reviewsAsDoctor.length;
      const avgRating = totalRatings > 0 
        ? doc.reviewsAsDoctor.reduce((acc, r) => acc + r.rating, 0) / totalRatings 
        : 0;
      
      return {
        id: doc.id,
        publicId: doc.publicId,
        nickname: doc.nickname,
        avatar: doc.avatar,
        specialization: doc.specialization,
        isOnline: doc.isOnline,
        rating: Number(avgRating.toFixed(1)),
        reviewCount: totalRatings
      };
    });

    res.json({ data: formatted });
  } catch (err) {
    logger.error('Fetch doctors error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/user/order/:id/source
const { createNotification } = require('../utils/notify');
const sourceSchema = z.object({ source: z.enum(['IN_HOUSE', 'EXTERNAL']) });

router.post('/order/:id/source', auth, validate(sourceSchema), async (req, res) => {
  try {
    const { source } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.patientId !== req.user.id) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    if (order.status !== 'AWAITING_SOURCE') {
      return res.status(400).json({ msg: 'This order has already been sourced.' });
    }

    const newStatus = source === 'IN_HOUSE' ? 'PENDING' : 'SOURCED_ELSEWHERE';
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: newStatus },
    });

    if (source === 'IN_HOUSE') {
      const pharmacists = await prisma.user.findMany({
        where: { role: 'PHARMACY', deletedAt: null },
        select: { id: true },
      });
      for (const p of pharmacists) {
        await createNotification(p.id, 'ORDER', 'New order received', `Order ${order.publicOrderId} needs preparation.`);
      }
    }

    res.json({ msg: 'Order source updated', order: updated });
  } catch (err) {
    logger.error('Order source error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/user/order
const directOrderSchema = z.object({
  deliveryAddress: z.string().min(3, 'Address must be at least 3 characters'),
  itemName: z.string().min(2),
  price: z.number().positive(),
});

router.post('/order', auth, validate(directOrderSchema), async (req, res) => {
  try {
    const { deliveryAddress, itemName, price } = req.body;

    // Check balance
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.deletedAt) return res.status(404).json({ msg: 'User not found' });
    
    const balance = Number(user.walletBalance);
    if (balance < price) {
      return res.status(400).json({ msg: 'Insufficient wallet balance' });
    }

    const orderId = `#ORD-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const secureCode = String(Math.floor(1000 + Math.random() * 9000));

    // 1. Create a Completed Consultation
    const consultation = await prisma.consultation.create({
      data: {
        patientId: req.user.id,
        status: 'COMPLETED',
      },
    });

    // 2. Create the Prescription
    const prescription = await prisma.prescription.create({
      data: {
        consultationId: consultation.id,
        medications: [{ name: itemName, dosage: '1 unit', instructions: `Direct Shop Purchase` }],
        status: 'FULFILLED',
      },
    });

    // 3. Create the Order
    const order = await prisma.order.create({
      data: {
        publicOrderId: orderId,
        prescriptionId: prescription.id,
        patientId: req.user.id,
        status: 'PENDING',
        secureCode,
        deliveryAddress,
      },
    });

    // 4. Create Transaction
    const platformFee = price * 0.05;
    const netAmount = price - platformFee;
    const transaction = await prisma.transaction.create({
      data: {
        amount: price,
        type: 'MEDICATION',
        status: 'SUCCESS',
        payerId: req.user.id,
        platformFee,
        netAmount,
      },
    });

    // 5. Debit Wallet
    await prisma.user.update({
      where: { id: req.user.id },
      data: { walletBalance: { decrement: price } },
    });

    // 6. Notify all pharmacies
    const pharmacists = await prisma.user.findMany({
      where: { role: 'PHARMACY', deletedAt: null },
      select: { id: true },
    });
    for (const p of pharmacists) {
      await createNotification(p.id, 'ORDER', 'New order received', `Direct purchase order ${order.publicOrderId} needs preparation.`);
    }

    logger.info('Direct purchase order placed', { userId: req.user.id, orderId: order.publicOrderId });
    res.json({ msg: 'Order placed successfully', order, transaction });
  } catch (err) {
    logger.error('Direct purchase error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/user/erase
router.post('/erase', auth, async (req, res) => {
  try {
    // Shred all user data: set deletedAt, clear PII logs, clear refresh token, and reset wallet balance
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        deletedAt: new Date(),
        dataHash: null,
        encryptedData: null,
        googleId: null,
        appleId: null,
        nickname: 'Deleted User',
        avatar: 'deleted',
        walletBalance: 0.00,
        refreshToken: null,
      },
    });

    logger.info('User identity erased permanently', { userId: req.user.id });
    res.json({ msg: 'Identity erased successfully' });
  } catch (err) {
    logger.error('Erase identity error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
