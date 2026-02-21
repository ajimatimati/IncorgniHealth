const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../db');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');
const { createNotification } = require('../utils/notify');

function doctorGuard(req, res, next) {
  if (req.user.role !== 'DOCTOR') return res.status(403).json({ msg: 'Doctor access required' });
  next();
}

// @route   GET /api/v1/doctor/queue
router.get('/queue', auth, doctorGuard, async (req, res) => {
  try {
    const consultations = await prisma.consultation.findMany({
      where: {
        deletedAt: null,
        OR: [
          { status: 'PENDING', doctorId: null },
          { status: 'ACTIVE', doctorId: req.user.id },
        ],
      },
      include: {
        patient: { select: { publicId: true, avatar: true, age: true, sex: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(consultations);
  } catch (err) {
    logger.error('Doctor queue error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/doctor/claim/:id
const claimSchema = z.object({ id: z.string().uuid() });

router.post('/claim/:id', auth, doctorGuard, validate(claimSchema, 'params'), async (req, res) => {
  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id: req.params.id },
    });

    if (!consultation || consultation.deletedAt) {
      return res.status(404).json({ msg: 'Consultation not found' });
    }
    if (consultation.doctorId && consultation.doctorId !== req.user.id) {
      return res.status(400).json({ msg: 'Already claimed by another doctor' });
    }

    const updated = await prisma.consultation.update({
      where: { id: req.params.id },
      data: { doctorId: req.user.id, status: 'ACTIVE' },
    });

    // Notify patient
    await createNotification(
      consultation.patientId,
      'CONSULTATION',
      'Doctor assigned',
      'A doctor has joined your consultation.'
    );

    logger.info('Doctor claimed consultation', { doctorId: req.user.id, consultationId: req.params.id });
    res.json(updated);
  } catch (err) {
    logger.error('Claim error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/v1/doctor/stats
router.get('/stats', auth, doctorGuard, async (req, res) => {
  try {
    const [completed, active, earnings] = await Promise.all([
      prisma.consultation.count({
        where: { doctorId: req.user.id, status: 'COMPLETED', deletedAt: null },
      }),
      prisma.consultation.count({
        where: { doctorId: req.user.id, status: 'ACTIVE', deletedAt: null },
      }),
      prisma.transaction.aggregate({
        where: { payeeId: req.user.id },
        _sum: { netAmount: true },
      }),
    ]);

    res.json({
      completed,
      active,
      totalEarnings: earnings._sum.netAmount || 0,
    });
  } catch (err) {
    logger.error('Doctor stats error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/v1/doctor/availability
const availabilitySchema = z.object({
  isOnline: z.boolean(),
  specialization: z.string().max(100).optional(),
});

router.put('/availability', auth, doctorGuard, validate(availabilitySchema), async (req, res) => {
  try {
    const { isOnline, specialization } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        isOnline,
        ...(specialization !== undefined && { specialization }),
      },
      select: { id: true, publicId: true, isOnline: true, specialization: true },
    });

    logger.info('Doctor availability updated', { doctorId: req.user.id, isOnline });
    res.json(updated);
  } catch (err) {
    logger.error('Availability update error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
