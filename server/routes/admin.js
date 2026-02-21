const express = require('express');
const router = express.Router();
const prisma = require('../db');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const paginate = require('../utils/pagination');

// Admin role guard
function adminGuard(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ msg: 'Admin access required' });
  }
  next();
}

// @route   GET /api/v1/admin/metrics
router.get('/metrics', auth, adminGuard, async (req, res) => {
  try {
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalConsultations,
      activeConsultations,
      completedConsultations,
      totalOrders,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { role: 'DOCTOR', deletedAt: null } }),
      prisma.user.count({ where: { role: 'PATIENT', deletedAt: null } }),
      prisma.consultation.count({ where: { deletedAt: null } }),
      prisma.consultation.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.consultation.count({ where: { status: 'COMPLETED', deletedAt: null } }),
      prisma.order.count({ where: { deletedAt: null } }),
      prisma.transaction.aggregate({ _sum: { platformFee: true } }),
    ]);

    res.json({
      users: { total: totalUsers, doctors: totalDoctors, patients: totalPatients },
      consultations: { total: totalConsultations, active: activeConsultations, completed: completedConsultations },
      orders: { total: totalOrders },
      revenue: { platformFees: totalRevenue._sum.platformFee || 0 },
    });
  } catch (err) {
    logger.error('Admin metrics error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/v1/admin/users
router.get('/users', auth, adminGuard, async (req, res) => {
  try {
    const { paginationArgs, buildResponse } = paginate(req.query);
    const { role, search } = req.query;

    const where = { deletedAt: null };
    if (role) where.role = role;
    if (search) where.publicId = { contains: search, mode: 'insensitive' };

    const users = await prisma.user.findMany({
      ...paginationArgs,
      where,
      select: {
        id: true, publicId: true, role: true, nickname: true, avatar: true,
        isOnline: true, specialization: true, createdAt: true,
        _count: { select: { consultationsAsPatient: true, consultationsAsDoctor: true, orders: true } },
      },
    });

    res.json(buildResponse(users));
  } catch (err) {
    logger.error('Admin users error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/v1/admin/consultations
router.get('/consultations', auth, adminGuard, async (req, res) => {
  try {
    const { paginationArgs, buildResponse } = paginate(req.query);
    const { status } = req.query;

    const where = { deletedAt: null };
    if (status) where.status = status;

    const consultations = await prisma.consultation.findMany({
      ...paginationArgs,
      where,
      include: {
        patient: { select: { publicId: true, avatar: true } },
        doctor: { select: { publicId: true, avatar: true } },
        _count: { select: { messages: true, prescriptions: true } },
      },
    });

    res.json(buildResponse(consultations));
  } catch (err) {
    logger.error('Admin consultations error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/v1/admin/orders
router.get('/orders', auth, adminGuard, async (req, res) => {
  try {
    const { paginationArgs, buildResponse } = paginate(req.query);
    const { status } = req.query;

    const where = { deletedAt: null };
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      ...paginationArgs,
      where,
      include: {
        patient: { select: { publicId: true } },
        prescription: { select: { medications: true } },
      },
    });

    res.json(buildResponse(orders));
  } catch (err) {
    logger.error('Admin orders error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
