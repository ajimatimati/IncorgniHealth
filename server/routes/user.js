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
        where: { role: 'PHARMACIST', deletedAt: null },
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

module.exports = router;
