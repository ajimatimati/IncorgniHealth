const crypto = require('crypto');

/**
 * Decodes a base32 string into a Buffer.
 */
function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  const length = clean.length;
  let bits = 0;
  let value = 0;
  let index = 0;
  const buffer = Buffer.alloc(Math.floor((length * 5) / 8));

  for (let i = 0; i < length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      buffer[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return buffer;
}

/**
 * Generates a random Base32 secret for TOTP setup.
 */
function generateSecret(length = 16) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    secret += alphabet[bytes[i] % alphabet.length];
  }
  return secret;
}

/**
 * Calculates the TOTP code for a given secret at the current time + offset.
 */
function getTOTPCode(secret, timeOffset = 0) {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const time = Math.floor(epoch / 30) + timeOffset;

  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(time));

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buffer);
  const hmacResult = hmac.digest();

  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const code = (
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

/**
 * Verifies a given TOTP token against a secret with time-drift allowance.
 */
function verifyTOTP(token, secret) {
  const cleanToken = token.trim();
  // Allow a drift of 1 time-step (30 seconds) backward and forward
  for (let offset = -1; offset <= 1; offset++) {
    if (getTOTPCode(secret, offset) === cleanToken) {
      return true;
    }
  }
  return false;
}

module.exports = {
  generateSecret,
  verifyTOTP,
  getTOTPCode
};
