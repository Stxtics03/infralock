/**
 * backend/utils/backupCodes.js
 *
 * Generates, hashes, and verifies MFA backup codes.
 *
 * Format: XXXX-XXXX (8 chars, dash in middle for readability)
 * Charset avoids ambiguous characters: 0/O and 1/I omitted.
 * Storage: SHA-256 hash only — plaintext is never written to DB.
 * Comparison: timing-safe to prevent timing-based enumeration.
 */

const crypto = require('crypto');

const CHARSET     = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const CODE_COUNT  = 10;

/**
 * Generate CODE_COUNT plaintext backup codes.
 * @returns {string[]} e.g. ['AB3K-7PQX', ...]
 */
function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < CODE_COUNT; i++) {
    const raw = Array.from({ length: CODE_LENGTH }, () =>
      CHARSET[crypto.randomInt(0, CHARSET.length)]
    ).join('');
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }
  return codes;
}

/**
 * Hash a backup code for DB storage.
 * Strips the dash before hashing so XXXX-XXXX and XXXXXXXX both match.
 * @param {string} code
 * @returns {string} hex SHA-256
 */
function hashBackupCode(code) {
  const normalised = code.replace(/-/g, '').toUpperCase();
  return crypto.createHash('sha256').update(normalised).digest('hex');
}

/**
 * Verify a user-supplied code against a stored hash.
 * Timing-safe comparison prevents timing attacks.
 * @param {string} supplied  Raw code from user
 * @param {string} stored    Hex SHA-256 from DB
 * @returns {boolean}
 */
function verifyBackupCode(supplied, stored) {
  const suppliedHash = hashBackupCode(supplied);
  const a = Buffer.from(suppliedHash, 'hex');
  const b = Buffer.from(stored, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { generateBackupCodes, hashBackupCode, verifyBackupCode };
