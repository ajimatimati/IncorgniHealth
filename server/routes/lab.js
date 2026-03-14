const express = require('express');
const router = express.Router();
const prisma = require('../db');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware to ensure user is a Lab Scientist or Admin
const isLabRole = (req, res, next) => {
  if (req.user.role !== 'LAB_SCIENTIST' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ msg: 'Access denied: Lab personnel only' });
  }
  next();
};

// @route   GET /api/v1/lab/feed
// @desc    Get all active investigations (PENDING + claimed by this lab)
router.get('/feed', auth, isLabRole, async (req, res) => {
  try {
    const investigations = await prisma.investigation.findMany({
      where: {
        deletedAt: null,
        OR: [
          { status: 'PENDING' },
          { labId: req.user.id }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { publicId: true, nickname: true } },
        doctor: { select: { publicId: true, nickname: true } }
      }
    });
    res.json({ data: investigations });
  } catch (err) {
    logger.error('Lab feed error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/lab/accept/:id
// @desc    Claim an investigation
router.post('/accept/:id', auth, isLabRole, async (req, res) => {
  try {
    // Check if available
    const inv = await prisma.investigation.findUnique({ where: { id: req.params.id } });
    if (!inv || inv.status !== 'PENDING') {
      return res.status(400).json({ msg: 'Investigation is not available' });
    }

    const updated = await prisma.investigation.update({
      where: { id: req.params.id },
      data: {
        status: 'PROCESSING',
        labId: req.user.id
      }
    });

    res.json({ msg: 'Investigation accepted', data: updated });
  } catch (err) {
    logger.error('Lab accept error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/lab/upload/:id
// @desc    Upload report / complete investigation
router.post('/upload/:id', auth, isLabRole, async (req, res) => {
  try {
    const { pdfReportUrl } = req.body;
    const inv = await prisma.investigation.findUnique({ where: { id: req.params.id } });
    if (!inv || inv.labId !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized for this investigation' });
    }

    const updated = await prisma.investigation.update({
      where: { id: req.params.id },
      data: {
        status: 'UPLOADED',
        pdfReportUrl
      }
    });

    res.json({ msg: 'Report uploaded', data: updated });
  } catch (err) {
    logger.error('Lab upload error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
