/**
 * backend/controllers/mfaController.js
 *
 * Six controller functions covering the full MFA lifecycle.
 * Uses the existing pool.js pattern (same as all other controllers).
 * All DB writes go through parameterised queries — no string interpolation.
 * Every state-changing action writes to audit_trail (zero audit gap).
 */

const { authenticator } = require('otplib');
const pool = require('../db/pool');
const { encrypt, decrypt } = require('../utils/encryption');
const { generateBackupCodes, hashBackupCode, verifyBackupCode } = require('../utils/backupCodes');

const APP_NAME = 'INFRAlock';

// ── internal helpers ─────────────────────────────────────────────────────────

/** Check rate limit. Returns true if user is blocked. */
async function isRateLimited(conn, userId) {
  await conn.query('CALL sp_check_mfa_rate_limit(?, ?, @b)', [userId, '0.0.0.0']);
  const [[{ blocked }]] = await conn.query('SELECT @b AS blocked');
  return blocked === 1;
}

/** Log attempt via stored procedure (also writes to audit_trail). */
async function logAttempt(conn, userId, ip, success) {
  await conn.query('CALL sp_log_mfa_attempt(?, ?, ?)', [userId, ip || '0.0.0.0', success ? 1 : 0]);
}

/** Audit helper for actions not covered by a trigger/procedure. */
async function audit(conn, tableName, operation, pk, userId, newValues, ip) {
  await conn.query(
    `INSERT INTO audit_trail
       (table_name, operation, record_pk, performed_by, performed_at, new_values, ip_address)
     VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
    [tableName, operation, pk, userId, JSON.stringify(newValues), ip || '0.0.0.0']
  );
}

// ── controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/mfa/setup
 * Generates a new TOTP secret, encrypts it with the existing AES-256-GCM util,
 * saves to mfa_config (enabled=FALSE), and returns the otpauth URI + base32 secret.
 * Idempotent — calling again overwrites the pending (not-yet-enabled) secret.
 */
async function setup(req, res) {
  const userId = req.user.id;
  const conn   = await pool.getConnection();
  try {
    // Block if MFA is already active
    const [[row]] = await conn.query(
      'SELECT enabled FROM mfa_config WHERE user_id = ?',
      [userId]
    );
    if (row?.enabled) {
      return res.status(409).json({ error: 'MFA is already enabled.' });
    }

    const secret = authenticator.generateSecret(32);
    const otpUri = authenticator.keyuri(req.user.email, APP_NAME, secret);

    // Encrypt secret at rest using existing encryption utility
    const { ciphertext, iv, authTag } = encrypt(secret);

    await conn.query(
      `INSERT INTO mfa_config (user_id, totp_secret, totp_iv, totp_auth_tag, enabled)
       VALUES (?, ?, ?, ?, FALSE)
       ON DUPLICATE KEY UPDATE
         totp_secret   = VALUES(totp_secret),
         totp_iv       = VALUES(totp_iv),
         totp_auth_tag = VALUES(totp_auth_tag),
         enabled       = FALSE`,
      [userId, ciphertext, iv, authTag]
    );

    await audit(conn, 'mfa_config', 'INSERT', userId, userId,
      { action: 'setup_initiated', email: req.user.email }, req.ip);

    return res.json({ otpUri, secret });
  } finally {
    conn.release();
  }
}

/**
 * POST /api/mfa/verify-setup
 * Body: { token }
 * Validates the first TOTP code, enables MFA, generates 10 backup codes.
 * Returns the plaintext backup codes — shown exactly once.
 */
async function verifySetup(req, res) {
  const userId = req.user.id;
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token is required.' });

  const conn = await pool.getConnection();
  try {
    const [[cfg]] = await conn.query(
      'SELECT totp_secret, totp_iv, totp_auth_tag, enabled FROM mfa_config WHERE user_id = ?',
      [userId]
    );
    if (!cfg) return res.status(404).json({ error: 'Run /api/mfa/setup first.' });
    if (cfg.enabled) return res.status(409).json({ error: 'MFA already enabled.' });

    const secret = decrypt({ ciphertext: cfg.totp_secret, iv: cfg.totp_iv, authTag: cfg.totp_auth_tag });
    if (!authenticator.verify({ token, secret })) {
      return res.status(401).json({ error: 'Invalid code. Please try again.' });
    }

    // Enable MFA
    await conn.query(
      'UPDATE mfa_config SET enabled = TRUE, enabled_at = NOW() WHERE user_id = ?',
      [userId]
    );

    // Issue backup codes
    const plainCodes = generateBackupCodes();
    await conn.query('DELETE FROM mfa_backup_codes WHERE user_id = ?', [userId]);
    const rows = plainCodes.map(c => [userId, hashBackupCode(c)]);
    await conn.query('INSERT INTO mfa_backup_codes (user_id, code_hash) VALUES ?', [rows]);

    await logAttempt(conn, userId, req.ip, true);

    return res.json({ message: 'MFA enabled.', backupCodes: plainCodes });
  } finally {
    conn.release();
  }
}

/**
 * POST /api/mfa/verify
 * Body: { token } OR { backupCode }
 * Called during the login second-factor step.
 * Returns { verified: true } on success.
 */
async function verify(req, res) {
  const userId = req.user.id;
  const { token, backupCode } = req.body;
  const ip = req.ip;

  if (!token && !backupCode) {
    return res.status(400).json({ error: 'Provide token or backupCode.' });
  }

  const conn = await pool.getConnection();
  try {
    // Rate limit check
    if (await isRateLimited(conn, userId)) {
      return res.status(429).json({
        error: 'Too many failed attempts. Wait 15 minutes and try again.'
      });
    }

    const [[cfg]] = await conn.query(
      'SELECT totp_secret, totp_iv, totp_auth_tag, enabled FROM mfa_config WHERE user_id = ?',
      [userId]
    );
    if (!cfg?.enabled) {
      return res.status(400).json({ error: 'MFA is not enabled for this account.' });
    }

    let success = false;

    if (token) {
      const secret = decrypt({ ciphertext: cfg.totp_secret, iv: cfg.totp_iv, authTag: cfg.totp_auth_tag });
      success = authenticator.verify({ token, secret });

    } else {
      // Backup code — iterate unused codes with timing-safe compare
      const [codeRows] = await conn.query(
        'SELECT code_id, code_hash FROM mfa_backup_codes WHERE user_id = ? AND used = FALSE',
        [userId]
      );
      for (const row of codeRows) {
        if (verifyBackupCode(backupCode, row.code_hash)) {
          await conn.query(
            'UPDATE mfa_backup_codes SET used = TRUE, used_at = NOW() WHERE code_id = ?',
            [row.code_id]
          );
          success = true;
          break;
        }
      }
    }

    await logAttempt(conn, userId, ip, success);

    if (!success) return res.status(401).json({ error: 'Invalid code.' });
    return res.json({ verified: true });

  } finally {
    conn.release();
  }
}

/**
 * DELETE /api/mfa/disable
 * Body: { token }
 * Requires a valid TOTP code before disabling (prevents account takeover).
 */
async function disable(req, res) {
  const userId = req.user.id;
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token is required to disable MFA.' });

  const conn = await pool.getConnection();
  try {
    const [[cfg]] = await conn.query(
      'SELECT totp_secret, totp_iv, totp_auth_tag, enabled FROM mfa_config WHERE user_id = ?',
      [userId]
    );
    if (!cfg?.enabled) return res.status(400).json({ error: 'MFA is not enabled.' });

    const secret = decrypt({ ciphertext: cfg.totp_secret, iv: cfg.totp_iv, authTag: cfg.totp_auth_tag });
    if (!authenticator.verify({ token, secret })) {
      return res.status(401).json({ error: 'Invalid TOTP code.' });
    }

    await conn.query(
      'UPDATE mfa_config SET enabled = FALSE, enabled_at = NULL WHERE user_id = ?',
      [userId]
    );
    await conn.query('DELETE FROM mfa_backup_codes WHERE user_id = ?', [userId]);
    await audit(conn, 'mfa_config', 'UPDATE', userId, userId, { action: 'mfa_disabled' }, req.ip);

    return res.json({ message: 'MFA disabled.' });
  } finally {
    conn.release();
  }
}

/**
 * GET /api/mfa/status
 * Returns { mfa_status, enabled_at, backup_codes_remaining }.
 */
async function status(req, res) {
  const conn = await pool.getConnection();
  try {
    const [[row]] = await conn.query(
      'SELECT mfa_status, enabled_at, backup_codes_remaining FROM v_mfa_status WHERE user_id = ?',
      [req.user.id]
    );
    return res.json(row ?? { mfa_status: 'disabled', enabled_at: null, backup_codes_remaining: 0 });
  } finally {
    conn.release();
  }
}

/**
 * POST /api/mfa/backup-codes/regenerate
 * Body: { token }
 * Burns all existing codes and issues 10 new ones.
 */
async function regenerateBackupCodes(req, res) {
  const userId = req.user.id;
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token is required.' });

  const conn = await pool.getConnection();
  try {
    const [[cfg]] = await conn.query(
      'SELECT totp_secret, totp_iv, totp_auth_tag, enabled FROM mfa_config WHERE user_id = ?',
      [userId]
    );
    if (!cfg?.enabled) return res.status(400).json({ error: 'MFA is not enabled.' });

    const secret = decrypt({ ciphertext: cfg.totp_secret, iv: cfg.totp_iv, authTag: cfg.totp_auth_tag });
    if (!authenticator.verify({ token, secret })) {
      return res.status(401).json({ error: 'Invalid TOTP code.' });
    }

    const plainCodes = generateBackupCodes();
    await conn.query('DELETE FROM mfa_backup_codes WHERE user_id = ?', [userId]);
    const rows = plainCodes.map(c => [userId, hashBackupCode(c)]);
    await conn.query('INSERT INTO mfa_backup_codes (user_id, code_hash) VALUES ?', [rows]);

    await audit(conn, 'mfa_backup_codes', 'INSERT', userId, userId,
      { action: 'backup_codes_regenerated' }, req.ip);

    return res.json({ backupCodes: plainCodes });
  } finally {
    conn.release();
  }
}

module.exports = { setup, verifySetup, verify, disable, status, regenerateBackupCodes };
