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

    if (payeeId && payeeId === req.user.id) {
      return res.status(400).json({ msg: 'Cannot pay yourself' });
    }

    const platformFee = amount * 0.05; // 5% platform commission
    const netAmount = amount - platformFee;

    const transaction = await prisma.$transaction(async (tx) => {
      // Fetch payer and lock row if supported, or check balance inside the transaction
      const payer = await tx.user.findUnique({ where: { id: req.user.id } });
      if (!payer || payer.deletedAt) {
        throw new Error('USER_NOT_FOUND');
      }

      // Convert walletBalance to a float/number for validation
      const balance = Number(payer.walletBalance);
      if (balance < amount) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      // Decrement payer balance
      await tx.user.update({
        where: { id: req.user.id },
        data: { walletBalance: { decrement: amount } },
      });

      // Increment payee balance if applicable
      if (payeeId) {
        const payee = await tx.user.findUnique({ where: { id: payeeId } });
        if (!payee || payee.deletedAt) {
          throw new Error('PAYEE_NOT_FOUND');
        }
        await tx.user.update({
          where: { id: payeeId },
          data: { walletBalance: { increment: netAmount } },
        });
      }

      // Create transaction log record
      return await tx.transaction.create({
        data: {
          amount,
          type,
          status: 'SUCCESS',
          payerId: req.user.id,
          payeeId: payeeId || null,
          platformFee,
          netAmount,
        },
      });
    });

    logger.info('Payment processed', { payerId: req.user.id, amount, type });
    res.json(transaction);
  } catch (err) {
    logger.error('Payment error', { error: err.message });
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ msg: 'User not found' });
    }
    if (err.message === 'PAYEE_NOT_FOUND') {
      return res.status(404).json({ msg: 'Payee not found' });
    }
    if (err.message === 'INSUFFICIENT_FUNDS') {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }
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
// NOTE: This endpoint is a placeholder for payment gateway integration.
// In production, deposits should be credited ONLY via a verified webhook from
// Paystack/Flutterwave after confirming payment. Direct client-initiated credits
// are disabled until gateway integration is complete.
const depositSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  reference: z.string().min(1, 'Payment reference is required'),
});

router.post('/deposit', auth, sensitiveLimiter, validate(depositSchema), async (req, res) => {
  // Payment gateway verification placeholder — reject all direct deposits
  // until Paystack/Flutterwave webhook handler is implemented
  return res.status(501).json({
    msg: 'Direct deposits are not yet available. Please use the payment gateway.',
    hint: 'Payment gateway integration pending.',
  });
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

    // Check if user already redeemed this voucher (one per user per code)
    const alreadyRedeemed = await prisma.transaction.findFirst({
      where: {
        payerId: req.user.id,
        type: 'DEPOSIT',
        status: 'SUCCESS',
        netAmount: amount,
        // Match by looking for a transaction with this exact voucher signature
        platformFee: 0,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Simple dedup: check if there's already a voucher redemption of this exact amount
    // In production, add a VoucherRedemption model for proper tracking
    const existingRedemptions = await prisma.transaction.count({
      where: {
        payerId: req.user.id,
        type: 'VOUCHER',
        status: 'SUCCESS',
      },
    });

    // Allow max 1 voucher redemption per user total (until proper tracking is added)
    if (existingRedemptions > 0) {
      return res.status(400).json({ msg: 'You have already redeemed a voucher. Each user may redeem one voucher.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: req.user.id },
        data: { walletBalance: { increment: amount } },
      });

      const transaction = await tx.transaction.create({
        data: {
          amount,
          type: 'VOUCHER',
          status: 'SUCCESS',
          payerId: req.user.id,
          platformFee: 0,
          netAmount: amount,
        },
      });

      return { walletBalance: updated.walletBalance, transaction };
    });

    logger.info('Voucher redeemed', { userId: req.user.id, code: cleanCode, amount });
    res.json({ msg: `Successfully redeemed ₦${amount.toLocaleString()} voucher!`, walletBalance: result.walletBalance, amount });
  } catch (err) {
    logger.error('Voucher error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;

