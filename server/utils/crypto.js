const crypto = require('crypto');

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  throw new Error('FATAL: JWT_SECRET environment variable is required. Server cannot start without it.');
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || SECRET_KEY;

// Deterministic Hash using HMAC for uniqueness checks (e.g. email lookup)
const hashData = (data) => {
  const pepper = process.env.HASH_SALT || SECRET_KEY;
  return crypto.createHmac('sha256', pepper).update(data).digest('hex');
};

// Reversible Encryption with proper IV (AES-256-GCM)
const encryptData = (data) => {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'incognicare-salt', 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

const decryptData = (ciphertext) => {
  // Support legacy CryptoJS format (base64 with "U2Fsd" prefix or without separators)
  if (!ciphertext.includes(':')) {
    const CryptoJS = require('crypto-js');
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'incognicare-salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};

// Generate ID like #GH-A3X9K2-LAG (cryptographically random)
const generateGhostId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `#GH-${code}-LAG`;
};

module.exports = {
  hashData,
  encryptData,
  decryptData,
  generateGhostId,
  SECRET_KEY
};
