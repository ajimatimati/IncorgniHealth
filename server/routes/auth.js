const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const prisma = require('../db');
const { hashData, encryptData, decryptData, generateGhostId, SECRET_KEY } = require('../utils/crypto');
const logger = require('../utils/logger');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const auth = require('../middleware/auth');

const { sendVerificationEmail } = require('../utils/email');

// Memory-based verification cache for new registrations
const otpCache = new Map();

// --- Validation schemas ---
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['PATIENT', 'DOCTOR', 'PHARMACY', 'RIDER', 'LAB_SCIENTIST']).default('PATIENT'),
  licenseNumber: z.string().optional(),
});

const verifySchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'Passcode must be 6 digits'), // This is the user's PIN
  role: z.enum(['PATIENT', 'DOCTOR', 'PHARMACY', 'RIDER', 'LAB_SCIENTIST']).default('PATIENT').optional(),
  licenseNumber: z.string().optional(),
  emailOtp: z.string().length(6, 'Verification code must be 6 digits').optional(), // Registration OTP
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

const verify2faSchema = z.object({
  tempToken: z.string().min(1, 'Temporary token required'),
  code: z.string().length(6, 'MFA Code must be 6 digits'),
});

const resendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';

function generateTokenPair(userPayload) {
  const accessToken = jwt.sign({ user: userPayload }, SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = crypto.randomBytes(40).toString('hex');
  return { accessToken, refreshToken };
}

// Helper to complete authentication or issue temporary 2FA token
async function handleAuthSuccess(user, res) {
  let hasMfa = false;
  let mfaSecret = null;
  let decrypted = {};

  if (user.encryptedData) {
    try {
      decrypted = decryptData(user.encryptedData);
      if (decrypted && decrypted.mfaSecret) {
        hasMfa = true;
        mfaSecret = decrypted.mfaSecret;
      }
    } catch (e) {
      logger.warn('Failed to decrypt user PII for MFA check', { userId: user.id });
    }
  }

  const requiresMfa = ['DOCTOR', 'ADMIN', 'SARC_OFFICER'].includes(user.role);
  if (requiresMfa) {
    const { generateSecret } = require('../utils/totp');
    let isFirstSetup = false;
    if (!hasMfa) {
      mfaSecret = generateSecret();
      decrypted.mfaSecret = mfaSecret;
      await prisma.user.update({
        where: { id: user.id },
        data: { encryptedData: encryptData(decrypted) },
      });
      isFirstSetup = true;
    }

    const tempToken = jwt.sign({ tempUserId: user.id, isFirstSetup }, SECRET_KEY, { expiresIn: '5m' });
    return res.json({
      requires2FA: true,
      mfaSetup: isFirstSetup,
      mfaSecret: isFirstSetup ? mfaSecret : undefined,
      tempToken,
    });
  }

  // Normal login (e.g. Patient)
  const userPayload = { id: user.id, publicId: user.publicId, role: user.role };
  const { accessToken, refreshToken } = generateTokenPair(userPayload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashData(refreshToken) },
  });

  return res.json({
    token: accessToken,
    refreshToken,
    user: { id: user.id, publicId: user.publicId, role: user.role },
  });
}

// @route   POST /api/v1/auth/signup
// Checks if the email is already registered to determine signup vs login, sends OTP
router.post('/signup', authLimiter, validate(signupSchema), async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const emailHash = hashData(cleanEmail);

    const existingUser = await prisma.user.findFirst({
      where: { dataHash: emailHash, deletedAt: null },
    });

    if (existingUser) {
      return res.status(200).json({
        msg: 'Email registered.',
        isExisting: true,
      });
    }

    // New user: Generate 6-digit OTP code (cryptographically secure)
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    otpCache.set(cleanEmail, { otp: otpCode, expires });
    logger.info('[Registration OTP] Generated', { email: cleanEmail.slice(0, 3) + '***' });

    const emailResult = await sendVerificationEmail(cleanEmail, otpCode);

    const response = {
      msg: emailResult.sent ? 'Verification code sent to email.' : 'Verification code generated.',
      isExisting: false,
      emailSent: emailResult.sent,
    };

    if (!emailResult.sent) {
      response.demoOtp = otpCode;
    }

    res.status(200).json(response);
  } catch (err) {
    logger.error('Signup check error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/auth/resend-otp
// Resends or issues a new 6-digit email verification code
router.post('/resend-otp', authLimiter, validate(resendOtpSchema), async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expires = Date.now() + 5 * 60 * 1000;
    otpCache.set(cleanEmail, { otp: otpCode, expires });

    const emailResult = await sendVerificationEmail(cleanEmail, otpCode);

    const response = {
      msg: emailResult.sent ? 'Verification code sent to email.' : 'Verification code generated.',
      emailSent: emailResult.sent,
    };

    if (!emailResult.sent) {
      response.demoOtp = otpCode;
    }

    res.status(200).json(response);
  } catch (err) {
    logger.error('Resend OTP error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/auth/verify
// Authenticates user (creates new user if email is new and OTP matches, verifies PIN if user exists)
router.post('/verify', authLimiter, validate(verifySchema), async (req, res) => {
  try {
    const { email, otp, role, licenseNumber, emailOtp } = req.body; // otp holds the 6-digit PIN
    const emailHash = hashData(email.toLowerCase().trim());
    const pinHash = hashData(otp);

    let user = await prisma.user.findFirst({
      where: { dataHash: emailHash, deletedAt: null },
    });

    if (user) {
      // Legacy user who doesn't have a PIN set yet: require email OTP verification first
      if (!user.pinHash) {
        if (!emailOtp) {
          return res.status(400).json({ msg: 'Email verification required to set your PIN. Please request a code first.', requiresOtp: true });
        }
        const cached = otpCache.get(email.toLowerCase().trim());
        if (!cached || cached.expires < Date.now() || cached.otp !== emailOtp) {
          return res.status(400).json({ msg: 'Invalid or expired email verification code.' });
        }
        otpCache.delete(email.toLowerCase().trim());
        await prisma.user.update({
          where: { id: user.id },
          data: { pinHash: pinHash },
        });
        user.pinHash = pinHash;
      }

      // Verify passcode (timing-safe comparison)
      const pinMatches = user.pinHash.length === pinHash.length &&
        crypto.timingSafeEqual(Buffer.from(user.pinHash), Buffer.from(pinHash));
      if (!pinMatches) {
        return res.status(401).json({ msg: 'Invalid passcode. Please try again.' });
      }
    } else {
      // Signup new user: must verify email OTP
      if (!emailOtp) {
        return res.status(400).json({ msg: 'Email verification code is required.' });
      }
      
      const cached = otpCache.get(email.toLowerCase().trim());
      if (!cached || cached.expires < Date.now() || cached.otp !== emailOtp) {
        return res.status(400).json({ msg: 'Invalid or expired email verification code.' });
      }
      otpCache.delete(email.toLowerCase().trim());

      // Create new user
      let ghostId = generateGhostId();
      while (await prisma.user.findUnique({ where: { publicId: ghostId } })) {
        ghostId = generateGhostId();
      }

      user = await prisma.user.create({
        data: {
          publicId: ghostId,
          role: role || 'PATIENT',
          dataHash: emailHash,
          pinHash: pinHash,
          licenseNumber,
        },
      });
      logger.info('User registered via Email + PIN', { publicId: ghostId, role: user.role });
    }

    // Complete authentication (or proceed to 2FA)
    await handleAuthSuccess(user, res);
  } catch (err) {
    logger.error('Authentication error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/auth/verify-2fa
// Verifies TOTP and issues final JWT tokens
router.post('/verify-2fa', authLimiter, validate(verify2faSchema), async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    let decoded;
    try {
      decoded = jwt.verify(tempToken, SECRET_KEY);
    } catch {
      return res.status(401).json({ msg: 'Session expired. Please log in again.' });
    }

    const { tempUserId } = decoded;
    const user = await prisma.user.findUnique({ where: { id: tempUserId } });
    if (!user || user.deletedAt) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (!user.encryptedData) {
      return res.status(400).json({ msg: 'MFA not configured for this user.' });
    }

    const decrypted = decryptData(user.encryptedData);
    const mfaSecret = decrypted.mfaSecret;
    if (!mfaSecret) {
      return res.status(400).json({ msg: 'MFA not configured for this user.' });
    }

    const { verifyTOTP } = require('../utils/totp');
    if (!verifyTOTP(code, mfaSecret)) {
      return res.status(401).json({ msg: 'Invalid authenticator code.' });
    }

    // 2FA Verified! Issue full tokens.
    const userPayload = { id: user.id, publicId: user.publicId, role: user.role };
    const { accessToken, refreshToken } = generateTokenPair(userPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashData(refreshToken) },
    });

    res.json({
      token: accessToken,
      refreshToken,
      user: { id: user.id, publicId: user.publicId, role: user.role },
    });
  } catch (err) {
    logger.error('2FA verification error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/auth/google
const googleVerifySchema = z.object({
  tokenId: z.string().min(1, 'Token ID required'),
  role: z.enum(['PATIENT', 'DOCTOR', 'PHARMACY', 'RIDER', 'LAB_SCIENTIST']).default('PATIENT')
});

const { OAuth2Client } = require('google-auth-library');
// Production Client ID
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '45568084301-vl3oje51oclpr32do85e6m77bo2mor71.apps.googleusercontent.com';
if (!process.env.GOOGLE_CLIENT_ID) {
  logger.warn('[AUTH] GOOGLE_CLIENT_ID env var is not set. Falling back to default client ID.');
}
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
          dataHash: hashData(email || googleId)
        }
      });
      logger.info('User created via Google', { publicId: ghostId, role });
    }

    // Complete authentication (or proceed to 2FA)
    await handleAuthSuccess(user, res);
  } catch (err) {
    logger.error('Google Auth error', { error: err.message });
    res.status(401).json({ msg: 'Invalid Google Token' });
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

// Expose OTP cache for test harness only
if (process.env.NODE_ENV === 'test') {
  router._otpCache = otpCache;
}

module.exports = router;

