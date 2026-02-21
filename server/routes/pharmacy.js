const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../db');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');
const { createNotification } = require('../utils/notify');

function pharmacyGuard(req, res, next) {
  if (req.user.role !== 'PHARMACIST') return res.status(403).json({ msg: 'Pharmacy access required' });
  next();
}

// @route   GET /api/v1/pharmacy/orders
router.get('/orders', auth, pharmacyGuard, async (req, res) => {
  try {
    const { status } = req.query;
    const where = { deletedAt: null };
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: {
        prescription: { select: { medications: true } },
        patient: { select: { publicId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (err) {
    logger.error('Pharmacy orders error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/v1/pharmacy/my-orders
router.get('/my-orders', auth, pharmacyGuard, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { pharmacyId: req.user.id, deletedAt: null },
      include: {
        prescription: { select: { medications: true } },
        patient: { select: { publicId: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    logger.error('My pharmacy orders error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/v1/pharmacy/accept/:id
const idSchema = z.object({ id: z.string().uuid() });

router.put('/accept/:id', auth, pharmacyGuard, validate(idSchema, 'params'), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.deletedAt) return res.status(404).json({ msg: 'Order not found' });
    if (order.status !== 'PENDING') return res.status(400).json({ msg: 'Order already accepted' });

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'PROCESSING', pharmacyId: req.user.id },
    });

    await createNotification(order.patientId, 'ORDER', 'Order accepted', `Your order ${order.publicOrderId} is being prepared.`);

    logger.info('Pharmacy accepted order', { orderId: req.params.id, pharmacyId: req.user.id });
    res.json(updated);
  } catch (err) {
    logger.error('Accept order error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/v1/pharmacy/ready/:id
router.put('/ready/:id', auth, pharmacyGuard, validate(idSchema, 'params'), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.deletedAt) return res.status(404).json({ msg: 'Order not found' });
    if (order.pharmacyId !== req.user.id) return res.status(403).json({ msg: 'Not your order' });
    if (order.status !== 'PROCESSING') return res.status(400).json({ msg: 'Order not in processing' });

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'READY_FOR_PICKUP' },
    });

    // Notify patient and riders
    await createNotification(order.patientId, 'ORDER', 'Order ready', `Order ${order.publicOrderId} is ready for pickup!`);

    const riders = await prisma.user.findMany({
      where: { role: 'RIDER', deletedAt: null },
      select: { id: true },
    });
    for (const r of riders) {
      await createNotification(r.id, 'ORDER', 'New delivery available', `Order ${order.publicOrderId} needs delivery.`);
    }

    logger.info('Order marked ready', { orderId: req.params.id });
    res.json(updated);
  } catch (err) {
    logger.error('Ready order error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
