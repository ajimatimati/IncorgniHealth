const express = require('express');
const router = express.Router();
const prisma = require('../db');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const paginate = require('../utils/pagination');

// @route   GET /api/v1/notifications
router.get('/', auth, async (req, res) => {
  try {
    const { paginationArgs, buildResponse } = paginate(req.query);

    const notifications = await prisma.notification.findMany({
      ...paginationArgs,
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Also return unread count
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, read: false },
    });

    const page = buildResponse(notifications);
    res.json({ ...page, unreadCount });
  } catch (err) {
    logger.error('Fetch notifications error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/v1/notifications/:id/read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });

    res.json({ msg: 'Marked as read' });
  } catch (err) {
    logger.error('Mark read error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/v1/notifications/read-all
router.put('/read-all', auth, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });

    res.json({ msg: 'All notifications marked as read' });
  } catch (err) {
    logger.error('Read all error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
