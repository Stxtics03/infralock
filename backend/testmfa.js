require('dotenv').config({path:'../.env'});
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const ENC_KEY = crypto.scryptSync(process.env.JWT_SECRET || 'infralock', 'salt', 32);
function decrypt({ciphertext, iv, authTag}) {
  const d = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, Buffer.from(iv,'hex'));
  d.setAuthTag(Buffer.from(authTag,'hex'));
  return Buffer.concat([d.update(Buffer.from(ciphertext,'hex')), d.final()]).toString('utf8');
}
const secret = decrypt({
  ciphertext: '5b7d1fe1b2769d54d2fed62abcb461f75725824f3361f18e79044c0fde302a9a',
  iv: '0c0068b9120529ae1149849f',
  authTag: 'da5776bcbfff2ca264a72076784ea390'
});
console.log('SECRET:', secret);
const token = speakeasy.totp({secret, encoding:'base32'});
console.log('CURRENT CODE:', token);