const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../db');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');
const { createNotification } = require('../utils/notify');

// @route   GET /api/v1/consultation/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id: req.params.id },
      include: {
        patient: { select: { id: true, publicId: true, avatar: true, nickname: true, age: true, sex: true } },
        doctor: { select: { id: true, publicId: true, avatar: true, nickname: true, specialization: true } },
        messages: { orderBy: { createdAt: 'asc' } },
        prescriptions: true,
      },
    });

    if (!consultation || consultation.deletedAt) {
      return res.status(404).json({ msg: 'Consultation not found' });
    }

    // Only participants can view
    if (consultation.patientId !== req.user.id && consultation.doctorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(consultation);
  } catch (err) {
    logger.error('Consultation fetch error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/consultation/start
router.post('/start', auth, async (req, res) => {
  try {
    // Patient starts consultation — no doctor assigned yet
    const consultation = await prisma.consultation.create({
      data: {
        patientId: req.user.id,
        doctorId: null,
        status: 'PENDING',
      },
    });

    logger.info('Consultation started', { consultationId: consultation.id, patientId: req.user.id });

    // Notify all online doctors
    const onlineDoctors = await prisma.user.findMany({
      where: { role: 'DOCTOR', isOnline: true, deletedAt: null },
      select: { id: true },
    });

    for (const doc of onlineDoctors) {
      await createNotification(
        doc.id,
        'CONSULTATION',
        'New patient waiting',
        'A patient is waiting for a consultation.'
      );
    }

    res.status(201).json(consultation);
  } catch (err) {
    logger.error('Consultation start error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/v1/consultation/:id/close
router.put('/:id/close', auth, async (req, res) => {
  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id: req.params.id },
    });

    if (!consultation || consultation.deletedAt) {
      return res.status(404).json({ msg: 'Consultation not found' });
    }

    if (consultation.patientId !== req.user.id && consultation.doctorId !== req.user.id) {
      return res.status(403).json({ msg: 'Only participants can close' });
    }

    const updated = await prisma.consultation.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED' },
    });

    // Notify the other participant
    const otherUserId = req.user.id === consultation.patientId
      ? consultation.doctorId
      : consultation.patientId;

    if (otherUserId) {
      await createNotification(
        otherUserId,
        'CONSULTATION',
        'Consultation ended',
        'The consultation has been marked as completed.'
      );
    }

    logger.info('Consultation closed', { consultationId: req.params.id, closedBy: req.user.id });
    res.json(updated);
  } catch (err) {
    logger.error('Consultation close error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
