/**
 * backend/controllers/mfaController.js
 */

const crypto = require('crypto');
const speakeasy = require('speakeasy');
const pool = require('../db/pool');
const { generateBackupCodes, hashBackupCode, verifyBackupCode } = require('../utils/backupCodes');

const APP_NAME = 'INFRAlock';

// AES-256-GCM encrypt/decrypt for TOTP secrets
const ENC_KEY = crypto.scryptSync(process.env.JWT_SECRET || 'infralock', 'salt', 32);

function encryptSecret(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decryptSecret({ ciphertext, iv, authTag }) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  const text = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'hex')),
    decipher.final()
  ]);
  return text.toString('utf8');
}

async function isRateLimited(conn, userId) {
  await conn.query('CALL sp_check_mfa_rate_limit(?, ?, @b)', [userId, '0.0.0.0']);
  const [[{ blocked }]] = await conn.query('SELECT @b AS blocked');
  return blocked === 1;
}

async function logAttempt(conn, userId, ip, success) {
  await conn.query('CALL sp_log_mfa_attempt(?, ?, ?)', [userId, ip || '0.0.0.0', success ? 1 : 0]);
}

async function audit(conn, tableName, operation, pk, userId, newValues, ip) {
  await conn.query(
    `INSERT INTO audit_trail
       (table_name, operation, record_pk, performed_by, performed_at, new_values, ip_address)
     VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
    [tableName, operation, pk, userId, JSON.stringify(newValues), ip || '0.0.0.0']
  );
}

async function setup(req, res) {
  const userId = req.user.user_id;
  const email  = req.user.email;
  const conn   = await pool.getConnection();
  try {
    const [[row]] = await conn.query(
      'SELECT enabled FROM mfa_config WHERE user_id = ?', [userId]
    );
    if (row?.enabled) {
      return res.status(409).json({ error: 'MFA is already enabled.' });
    }

    const secret = speakeasy.generateSecret({ length: 20 }).base32;
    const otpUri = speakeasy.otpauthURL({ secret, label: encodeURIComponent(email), issuer: APP_NAME, encoding: 'base32' });
    const { ciphertext, iv, authTag } = encryptSecret(secret);

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
      { action: 'setup_initiated', email }, req.ip);

    return res.json({ otpUri, secret });
  } finally {
    conn.release();
  }
}

async function verifySetup(req, res) {
  const userId = req.user.user_id;
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

    const secret = decryptSecret({ ciphertext: cfg.totp_secret, iv: cfg.totp_iv, authTag: cfg.totp_auth_tag });
    if (!speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 })) {
      return res.status(401).json({ error: 'Invalid code. Please try again.' });
    }

    await conn.query(
      'UPDATE mfa_config SET enabled = TRUE, enabled_at = NOW() WHERE user_id = ?', [userId]
    );

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

async function verify(req, res) {
  const userId = req.user.user_id;
  const { token, backupCode } = req.body;
  const ip = req.ip;

  if (!token && !backupCode) {
    return res.status(400).json({ error: 'Provide token or backupCode.' });
  }

  const conn = await pool.getConnection();
  try {
    if (await isRateLimited(conn, userId)) {
      return res.status(429).json({ error: 'Too many failed attempts. Wait 15 minutes and try again.' });
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
      const secret = decryptSecret({ ciphertext: cfg.totp_secret, iv: cfg.totp_iv, authTag: cfg.totp_auth_tag });
      success = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
    } else {
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

      // Re-issue full JWT with mfa_verified: true
      const jwt = require('jsonwebtoken');
      const [[userRow]] = await conn.query(
        'SELECT user_id, email, role, full_name FROM users WHERE user_id = ?', [userId]
      );
      const fullToken = jwt.sign(
        { user_id: userRow.user_id, email: userRow.email, role: userRow.role, mfa_required: true, mfa_verified: true },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      return res.json({ verified: true, token: fullToken });
  } finally {
    conn.release();
  }
}

async function disable(req, res) {
  const userId = req.user.user_id;
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token is required to disable MFA.' });

  const conn = await pool.getConnection();
  try {
    const [[cfg]] = await conn.query(
      'SELECT totp_secret, totp_iv, totp_auth_tag, enabled FROM mfa_config WHERE user_id = ?',
      [userId]
    );
    if (!cfg?.enabled) return res.status(400).json({ error: 'MFA is not enabled.' });

    const secret = decryptSecret({ ciphertext: cfg.totp_secret, iv: cfg.totp_iv, authTag: cfg.totp_auth_tag });
    if (!speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 })) {
      return res.status(401).json({ error: 'Invalid TOTP code.' });
    }

    await conn.query(
      'UPDATE mfa_config SET enabled = FALSE, enabled_at = NULL WHERE user_id = ?', [userId]
    );
    await conn.query('DELETE FROM mfa_backup_codes WHERE user_id = ?', [userId]);
    await audit(conn, 'mfa_config', 'UPDATE', userId, userId, { action: 'mfa_disabled' }, req.ip);

    return res.json({ message: 'MFA disabled.' });
  } finally {
    conn.release();
  }
}

async function status(req, res) {
  const userId = req.user.user_id;
  if (!userId) return res.json({ enabled: false });

  const conn = await pool.getConnection();
  try {
    const [[row]] = await conn.query(
      'SELECT mfa_status, enabled_at, backup_codes_remaining FROM v_mfa_status WHERE user_id = ?',
      [userId]
    );
    return res.json({
      enabled: row?.mfa_status === 'enabled',
      enabled_at: row?.enabled_at ?? null,
      backup_codes_remaining: row?.backup_codes_remaining ?? 0
    });
  } finally {
    conn.release();
  }
}

async function regenerateBackupCodes(req, res) {
  const userId = req.user.user_id;
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token is required.' });

  const conn = await pool.getConnection();
  try {
    const [[cfg]] = await conn.query(
      'SELECT totp_secret, totp_iv, totp_auth_tag, enabled FROM mfa_config WHERE user_id = ?',
      [userId]
    );
    if (!cfg?.enabled) return res.status(400).json({ error: 'MFA is not enabled.' });

    const secret = decryptSecret({ ciphertext: cfg.totp_secret, iv: cfg.totp_iv, authTag: cfg.totp_auth_tag });
    if (!speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 })) {
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