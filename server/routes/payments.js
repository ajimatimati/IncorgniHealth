const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../db');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');
const { sensitiveLimiter } = require('../middleware/rateLimit');
const paginate = require('../utils/pagination');

// @route   POST /api/v1/payments/pay
const paySchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['CONSULTATION', 'MEDICATION']),
  payeeId: z.string().uuid().optional(),
});

router.post('/pay', auth, sensitiveLimiter, validate(paySchema), async (req, res) => {
  try {
    const { amount, type, payeeId } = req.body;
    const platformFee = amount * 0.05; // 5% platform commission
    const netAmount = amount - platformFee;

    // Check wallet balance
    const payer = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!payer || payer.deletedAt) return res.status(404).json({ msg: 'User not found' });
    if (payer.walletBalance < amount) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Debit + record in transaction
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          amount,
          type,
          status: 'SUCCESS',
          payerId: req.user.id,
          payeeId: payeeId || null,
          platformFee,
          netAmount,
        },
      }),
      prisma.user.update({
        where: { id: req.user.id },
        data: { walletBalance: { decrement: amount } },
      }),
      ...(payeeId ? [prisma.user.update({
        where: { id: payeeId },
        data: { walletBalance: { increment: netAmount } },
      })] : []),
    ]);

    logger.info('Payment processed', { payerId: req.user.id, amount, type });
    res.json(transaction);
  } catch (err) {
    logger.error('Payment error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/v1/payments/history
router.get('/history', auth, async (req, res) => {
  try {
    const { paginationArgs, buildResponse } = paginate(req.query);

    const transactions = await prisma.transaction.findMany({
      ...paginationArgs,
      where: { payerId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(buildResponse(transactions));
  } catch (err) {
    logger.error('Payment history error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/payments/deposit
const depositSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
});

router.post('/deposit', auth, sensitiveLimiter, validate(depositSchema), async (req, res) => {
  try {
    const { amount } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { walletBalance: { increment: amount } },
    });

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type: 'DEPOSIT',
        status: 'SUCCESS',
        payerId: req.user.id,
        platformFee: 0,
        netAmount: amount,
      },
    });

    logger.info('Wallet deposit successful', { userId: req.user.id, amount });
    res.json({ msg: 'Deposit successful', walletBalance: updated.walletBalance, transaction });
  } catch (err) {
    logger.error('Deposit error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/payments/voucher
const voucherSchema = z.object({
  code: z.string().min(1, 'Voucher code is required'),
});

router.post('/voucher', auth, sensitiveLimiter, validate(voucherSchema), async (req, res) => {
  try {
    const { code } = req.body;
    const cleanCode = code.trim().toUpperCase();

    const VOUCHERS = {
      CARE2026: 15000,
      EMPOWER2026: 25000,
      SARC_SUPPORT: 10000,
    };

    if (!(cleanCode in VOUCHERS)) {
      return res.status(400).json({ msg: 'Invalid or expired voucher code' });
    }

    const amount = VOUCHERS[cleanCode];

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { walletBalance: { increment: amount } },
    });

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type: 'DEPOSIT',
        status: 'SUCCESS',
        payerId: req.user.id,
        platformFee: 0,
        netAmount: amount,
      },
    });

    logger.info('Voucher redeemed successful', { userId: req.user.id, code: cleanCode, amount });
    res.json({ msg: `Successfully redeemed ₦${amount.toLocaleString()} voucher!`, walletBalance: updated.walletBalance, amount });
  } catch (err) {
    logger.error('Voucher error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;

