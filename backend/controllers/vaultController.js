const Minio = require('minio');
const multer = require('multer');
const pool = require('../db/pool');
const { encryptFile, decryptFile } = require('../utils/encryption');
require('dotenv').config();

const minioClient = new Minio.Client({
  endPoint:  process.env.MINIO_ENDPOINT,
  port:      parseInt(process.env.MINIO_PORT, 10),
  useSSL:    false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const upload = multer({ storage: multer.memoryStorage() });

exports.uploadMiddleware = upload.single('file');

exports.listByNode = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT snapshot_id, node_id, version, storage_path, plaintext_hash, file_size_bytes, uploaded_by, uploaded_at, notes FROM config_snapshots WHERE node_id = ? ORDER BY version DESC',
      [req.params.nodeId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.upload = async (req, res) => {
  const { node_id, password, notes } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  if (!password) return res.status(400).json({ error: 'Password required for encryption' });

  try {
    const {
      encrypted, authTag, iv, hash,
      wrappedKey, wrapIv, wrapTag, salt,
    } = encryptFile(req.file.buffer, password);

    const bucket = process.env.MINIO_BUCKET;
    const objectName = `node-${node_id}/${Date.now()}-${req.file.originalname}`;

    const bucketExists = await minioClient.bucketExists(bucket);
    if (!bucketExists) {
      await minioClient.makeBucket(bucket);
    }

    await minioClient.putObject(bucket, objectName, encrypted);

    const [versionRows] = await pool.query(
      'SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM config_snapshots WHERE node_id = ?',
      [node_id]
    );
    const version = versionRows[0].next_version;

    const [snapResult] = await pool.query(
      'INSERT INTO config_snapshots (node_id, version, storage_path, plaintext_hash, file_size_bytes, uploaded_by, notes) VALUES (?,?,?,?,?,?,?)',
      [node_id, version, `${bucket}/${objectName}`, hash, req.file.size, req.user.user_id, notes ?? null]
    );

    await pool.query(
      `INSERT INTO key_management (snapshot_id, owner_user_id, encrypted_key, iv, auth_tag, kdf_salt)
       VALUES (?,?,?,?,?,?)`,
      [
        snapResult.insertId,
        req.user.user_id,
        wrappedKey.toString('base64'),
        wrapIv.toString('base64'),
        wrapTag.toString('base64'),
        JSON.stringify({
          salt: salt.toString('base64'),
          fileIv: iv.toString('base64'),
          fileAuthTag: authTag.toString('base64'),
        }),
      ]
    );

    res.status(201).json({ snapshot_id: snapResult.insertId, version, storage_path: objectName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.decrypt = async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required for decryption' });

  try {
    const [snapRows] = await pool.query('SELECT * FROM config_snapshots WHERE snapshot_id = ?', [req.params.snapshotId]);
    if (!snapRows.length) return res.status(404).json({ error: 'Snapshot not found' });
    const snapshot = snapRows[0];

    const [keyRows] = await pool.query('SELECT * FROM key_management WHERE snapshot_id = ? AND status = ?', [req.params.snapshotId, 'active']);
    if (!keyRows.length) return res.status(404).json({ error: 'Encryption key not found' });
    const keyRecord = keyRows[0];

    const bucket = process.env.MINIO_BUCKET;
    const objectName = snapshot.storage_path.replace(`${bucket}/`, '');

    const encryptedStream = await minioClient.getObject(bucket, objectName);
    const chunks = [];
    for await (const chunk of encryptedStream) {
      chunks.push(chunk);
    }
    const encryptedBuffer = Buffer.concat(chunks);

    const cryptoMeta = JSON.parse(keyRecord.kdf_salt);
    const plaintext = decryptFile(
      encryptedBuffer,
      Buffer.from(keyRecord.encrypted_key, 'base64'),
      Buffer.from(cryptoMeta.fileIv, 'base64'),
      Buffer.from(cryptoMeta.fileAuthTag, 'base64'),
      Buffer.from(keyRecord.iv, 'base64'),
      Buffer.from(keyRecord.auth_tag, 'base64'),
      Buffer.from(cryptoMeta.salt, 'base64'),
      password
    );

    const computedHash = require('crypto').createHash('sha256').update(plaintext).digest('hex');
    if (computedHash !== snapshot.plaintext_hash) {
      return res.status(500).json({ error: 'INTEGRITY FAILED' });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(plaintext);
  } catch (err) {
    if (err.message?.includes('Unsupported state') || err.message?.includes('auth')) {
      return res.status(400).json({ error: 'TAMPER DETECTED' });
    }
    res.status(500).json({ error: err.message });
  }
};
