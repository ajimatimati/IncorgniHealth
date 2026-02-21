const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../db');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');
const { createNotification } = require('../utils/notify');

function riderGuard(req, res, next) {
  if (req.user.role !== 'RIDER') return res.status(403).json({ msg: 'Rider access required' });
  next();
}

// @route   GET /api/v1/rider/available
router.get('/available', auth, riderGuard, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'READY_FOR_PICKUP', riderId: null, deletedAt: null },
      include: {
        patient: { select: { publicId: true } },
        prescription: { select: { medications: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(orders);
  } catch (err) {
    logger.error('Available orders error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/v1/rider/my-deliveries
router.get('/my-deliveries', auth, riderGuard, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { riderId: req.user.id, deletedAt: null },
      include: {
        patient: { select: { publicId: true } },
        prescription: { select: { medications: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(orders);
  } catch (err) {
    logger.error('My deliveries error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/v1/rider/pickup/:id
const idSchema = z.object({ id: z.string().uuid() });

router.put('/pickup/:id', auth, riderGuard, validate(idSchema, 'params'), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.deletedAt) return res.status(404).json({ msg: 'Order not found' });
    if (order.status !== 'READY_FOR_PICKUP') return res.status(400).json({ msg: 'Order not ready for pickup' });

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'PICKED_UP', riderId: req.user.id },
    });

    await createNotification(order.patientId, 'ORDER', 'Order picked up', `Your order ${order.publicOrderId} is on its way!`);

    logger.info('Rider picked up order', { orderId: req.params.id, riderId: req.user.id });
    res.json(updated);
  } catch (err) {
    logger.error('Pickup error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/v1/rider/deliver/:id
const deliverSchema = z.object({
  secureCode: z.string().length(4, 'Secure code must be 4 digits'),
});

router.put('/deliver/:id', auth, riderGuard, validate(idSchema, 'params'), validate(deliverSchema), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.deletedAt) return res.status(404).json({ msg: 'Order not found' });
    if (order.riderId !== req.user.id) return res.status(403).json({ msg: 'Not your delivery' });
    if (order.status !== 'PICKED_UP') return res.status(400).json({ msg: 'Order not in transit' });

    if (req.body.secureCode !== order.secureCode) {
      return res.status(400).json({ msg: 'Invalid secure code' });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'DELIVERED' },
    });

    await createNotification(order.patientId, 'ORDER', 'Order delivered', `Your order ${order.publicOrderId} has been delivered. ✅`);

    logger.info('Order delivered', { orderId: req.params.id, riderId: req.user.id });
    res.json(updated);
  } catch (err) {
    logger.error('Deliver error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
