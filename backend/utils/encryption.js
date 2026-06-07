const crypto = require('crypto');

function encryptFile(buffer, password) {
  const key = crypto.randomBytes(32);
  const iv  = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const salt = crypto.randomBytes(32);
  const wrappingKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const wrapIv = crypto.randomBytes(12);
  const wrapCipher = crypto.createCipheriv('aes-256-gcm', wrappingKey, wrapIv);
  const wrappedKey = Buffer.concat([wrapCipher.update(key), wrapCipher.final()]);
  const wrapTag = wrapCipher.getAuthTag();
  return {
    encrypted, authTag, iv, hash,
    wrappedKey, wrapIv, wrapTag, salt,
  };
}

function decryptFile(encryptedBuffer, wrappedKeyBuf, iv, authTag, wrapIv, wrapTag, salt, password) {
  const wrappingKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const unwrapDecipher = crypto.createDecipheriv('aes-256-gcm', wrappingKey, wrapIv);
  unwrapDecipher.setAuthTag(wrapTag);
  const key = Buffer.concat([unwrapDecipher.update(wrappedKeyBuf), unwrapDecipher.final()]);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

module.exports = { encryptFile, decryptFile };
