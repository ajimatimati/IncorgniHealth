const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const prisma = require('../db');
const { hashData, generateGhostId, SECRET_KEY } = require('../utils/crypto');
const logger = require('../utils/logger');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const auth = require('../middleware/auth');

// --- Validation schemas ---
const signupSchema = z.object({
  phone: z.string().min(7, 'Phone number too short').max(20),
  role: z.enum(['PATIENT', 'DOCTOR', 'PHARMACIST', 'RIDER']).default('PATIENT'),
});

const verifySchema = z.object({
  phone: z.string().min(7).max(20),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

// MOCK OTP STORE (In production, use Redis + Twilio)
const otpStore = new Map();

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';

function generateTokenPair(userPayload) {
  const accessToken = jwt.sign({ user: userPayload }, SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = crypto.randomBytes(40).toString('hex');
  return { accessToken, refreshToken };
}

// @route   POST /api/v1/auth/signup
router.post('/signup', authLimiter, validate(signupSchema), async (req, res) => {
  try {
    const { phone, role } = req.body;
    const phoneHash = hashData(phone);

    const existingUser = await prisma.user.findFirst({
      where: { dataHash: phoneHash, deletedAt: null },
    });

    if (existingUser) {
      return res.status(400).json({ msg: 'User already registered.' });
    }

    let ghostId = generateGhostId();
    while (await prisma.user.findUnique({ where: { publicId: ghostId } })) {
      ghostId = generateGhostId();
    }

    const user = await prisma.user.create({
      data: { publicId: ghostId, role, dataHash: phoneHash },
    });

    // Mock OTP
    const otp = '123456';
    otpStore.set(phone, otp);

    logger.info('User registered', { publicId: ghostId, role });

    res.status(201).json({
      msg: 'Account created. Verify OTP.',
      tempId: user.id,
      debugOtp: otp,
    });
  } catch (err) {
    logger.error('Signup error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/auth/verify
router.post('/verify', authLimiter, validate(verifySchema), async (req, res) => {
  const { phone, otp } = req.body;

  if (otp !== '123456') {
    return res.status(400).json({ msg: 'Invalid OTP' });
  }

  try {
    const phoneHash = hashData(phone);
    const user = await prisma.user.findFirst({ where: { dataHash: phoneHash, deletedAt: null } });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const userPayload = { id: user.id, publicId: user.publicId, role: user.role };
    const { accessToken, refreshToken } = generateTokenPair(userPayload);

    // Store hashed refresh token
    const hashedRefresh = hashData(refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    logger.info('User verified', { publicId: user.publicId });

    res.json({
      token: accessToken,
      refreshToken,
      user: { id: user.id, publicId: user.publicId, role: user.role },
    });
  } catch (err) {
    logger.error('Verify error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/auth/google
const googleVerifySchema = z.object({
  tokenId: z.string().min(1, 'Token ID required'),
  role: z.enum(['PATIENT', 'DOCTOR', 'PHARMACIST', 'RIDER']).default('PATIENT')
});

const { OAuth2Client } = require('google-auth-library');
// Production Client ID
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '417772465462-2jgn7jc1bsf6bve3p9t97tgn6ob7n0ub.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post('/google', authLimiter, validate(googleVerifySchema), async (req, res) => {
  try {
    const { tokenId, role } = req.body;
    
    // Verify Google Token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenId,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email']; // Optional for fallback
    
    // Find or create user
    let user = await prisma.user.findFirst({
      where: { googleId, deletedAt: null }
    });

    if (!user) {
      let ghostId = generateGhostId();
      while (await prisma.user.findUnique({ where: { publicId: ghostId } })) {
        ghostId = generateGhostId();
      }

      user = await prisma.user.create({
        data: {
          publicId: ghostId,
          role,
          googleId,
          // You could optionally hash the email to dataHash if you want linking
          dataHash: hashData(email || googleId)
        }
      });
      logger.info('User created via Google', { publicId: ghostId, role });
    }

    const userPayload = { id: user.id, publicId: user.publicId, role: user.role };
    const { accessToken, refreshToken } = generateTokenPair(userPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashData(refreshToken) },
    });

    logger.info('Google OAuth login', { publicId: user.publicId });

    res.json({
      token: accessToken,
      refreshToken,
      user: { id: user.id, publicId: user.publicId, role: user.role },
    });

  } catch (err) {
    logger.error('Google Auth error', { error: err.message });
    res.status(401).json({ msg: 'Invalid Google Token' });
  }
});

// @route   POST /api/v1/auth/apple
const appleVerifySchema = z.object({
  idToken: z.string().min(1, 'Token ID required'),
  role: z.enum(['PATIENT', 'DOCTOR', 'PHARMACIST', 'RIDER']).default('PATIENT')
});

const appleSignin = require('apple-signin-auth');

router.post('/apple', authLimiter, validate(appleVerifySchema), async (req, res) => {
  try {
    const { idToken, role } = req.body;

    // Verify Apple Token
    const payload = await appleSignin.verifyIdToken(idToken, {
      // In production, audience should match the Apple Services ID
      ignoreExpiration: false,
    });
    
    const appleId = payload.sub;
    const email = payload.email; // Apple only sends this on the very first login
    
    // Find or create user
    let user = await prisma.user.findFirst({
      where: { appleId, deletedAt: null }
    });

    if (!user) {
      let ghostId = generateGhostId();
      while (await prisma.user.findUnique({ where: { publicId: ghostId } })) {
        ghostId = generateGhostId();
      }

      user = await prisma.user.create({
        data: {
          publicId: ghostId,
          role,
          appleId,
          dataHash: hashData(email || appleId)
        }
      });
      logger.info('User created via Apple', { publicId: ghostId, role });
    }

    const userPayload = { id: user.id, publicId: user.publicId, role: user.role };
    const { accessToken, refreshToken } = generateTokenPair(userPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashData(refreshToken) },
    });

    logger.info('Apple OAuth login', { publicId: user.publicId });

    res.json({
      token: accessToken,
      refreshToken,
      user: { id: user.id, publicId: user.publicId, role: user.role },
    });

  } catch (err) {
    logger.error('Apple Auth error', { error: err.message });
    res.status(401).json({ msg: 'Invalid Apple Token' });
  }
});

// @route   POST /api/v1/auth/refresh
router.post('/refresh', validate(refreshSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const hashedRefresh = hashData(refreshToken);

    const user = await prisma.user.findFirst({
      where: { refreshToken: hashedRefresh, deletedAt: null },
    });

    if (!user) {
      return res.status(401).json({ msg: 'Invalid refresh token' });
    }

    const userPayload = { id: user.id, publicId: user.publicId, role: user.role };
    const newTokens = generateTokenPair(userPayload);

    // Rotate: invalidate old, store new
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashData(newTokens.refreshToken) },
    });

    logger.info('Token refreshed', { publicId: user.publicId });

    res.json({
      token: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      user: { id: user.id, publicId: user.publicId, role: user.role },
    });
  } catch (err) {
    logger.error('Refresh error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/auth/logout
router.post('/logout', auth, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null },
    });
    res.json({ msg: 'Logged out' });
  } catch (err) {
    logger.error('Logout error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
