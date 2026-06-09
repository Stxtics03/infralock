/**
 * Diagnose MFA issue: decrypt stored secret and test speakeasy verification
 * Run: node testmfa_diag.js <user_id>
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const crypto    = require('crypto');
const speakeasy = require('speakeasy');
const pool      = require('./db/pool');

const ENC_KEY = crypto.scryptSync(process.env.JWT_SECRET || 'infralock', 'salt', 32);

function decryptSecret({ ciphertext, iv, authTag }) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'hex')),
    decipher.final()
  ]).toString('utf8');
}

async function main() {
  const [rows] = await pool.query(
    'SELECT user_id, totp_secret, totp_iv, totp_auth_tag, enabled FROM mfa_config WHERE enabled = 1 LIMIT 3'
  );

  if (!rows.length) {
    console.log('No enabled MFA configs found in DB.');
    process.exit(0);
  }

  for (const row of rows) {
    console.log('\n─── user_id:', row.user_id, '───────────────────────');
    console.log('secret_len:', row.totp_secret?.length, '  iv_len:', row.totp_iv?.length);

    let secret;
    try {
      secret = decryptSecret({
        ciphertext: row.totp_secret,
        iv:         row.totp_iv,
        authTag:    row.totp_auth_tag,
      });
      console.log('Decrypted secret:', secret);
      console.log('Secret length:', secret.length);
      console.log('Looks like base32?', /^[A-Z2-7]+=*$/i.test(secret));
    } catch (e) {
      console.error('DECRYPTION FAILED:', e.message);
      continue;
    }

    // Try current code from speakeasy (what the server would accept RIGHT NOW)
    const currentCode = speakeasy.totp({
      secret,
      encoding: 'base32',
    });
    console.log('Expected code right now (speakeasy base32):', currentCode);

    // Also try treating the secret as ASCII (what otplib may have used)
    const codeAscii = speakeasy.totp({ secret, encoding: 'ascii' });
    console.log('Expected code (speakeasy ascii):', codeAscii);

    // Verify with window=2 (lenient)
    const ok = speakeasy.totp.verify({ secret, encoding: 'base32', token: currentCode, window: 2 });
    console.log('Self-verify (base32):', ok ? '✅ PASS' : '❌ FAIL');
  }

  pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
