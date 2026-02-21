const CryptoJS = require("crypto-js");

const SECRET_KEY = process.env.JWT_SECRET || "mcnuels-super-secret-key-2026";

// Deterministic Hash for uniqueness checks (e.g. Phone Number)
const hashData = (data) => {
  return CryptoJS.SHA256(data).toString();
};

// Reversible Encryption for storage
const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

const decryptData = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// Generate ID like #GH-9921-LAG
const generateGhostId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  return `#GH-${randomNum}-LAG`;
};

module.exports = {
  hashData,
  encryptData,
  decryptData,
  generateGhostId,
  SECRET_KEY
};
