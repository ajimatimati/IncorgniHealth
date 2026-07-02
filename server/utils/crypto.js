const CryptoJS = require("crypto-js");

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  throw new Error('FATAL: JWT_SECRET environment variable is required. Server cannot start without it.');
}

// Deterministic Hash for uniqueness checks (e.g. Phone Number)
const hashData = (data) => {
  const pepper = process.env.HASH_SALT || SECRET_KEY;
  return CryptoJS.SHA256(data + pepper).toString();
};

// Reversible Encryption for storage
const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

const decryptData = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// Generate ID like #GH-A3X9K2-LAG
const generateGhostId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous 0/O, 1/I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
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
