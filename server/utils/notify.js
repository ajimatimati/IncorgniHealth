const prisma = require('../db');
const logger = require('./logger');

/**
 * Create an in-app notification for a user.
 * @param {string} userId
 * @param {'CONSULTATION'|'PRESCRIPTION'|'ORDER'|'SYSTEM'} type
 * @param {string} title
 * @param {string} body
 */
async function createNotification(userId, type, title, body) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body },
    });
  } catch (err) {
    logger.error('Failed to create notification', { userId, type, error: err.message });
  }
}

module.exports = { createNotification };
