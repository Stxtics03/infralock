const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('./jobs/anomalyDetector');

const pool = require('./db/pool');

const app = express();
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use((req, res, next) => {
  const suspicious = /('|--|;|\/\*|\*\/|xp_|UNION|SELECT|DROP|INSERT|DELETE|UPDATE\s)/i;
  const body = JSON.stringify(req.body);
  const query = JSON.stringify(req.query);
  if (suspicious.test(body) || suspicious.test(query)) {
    pool.query(
      'INSERT INTO security_events (endpoint, suspicious_input, ip_address, pattern_matched) VALUES (?,?,?,?)',
      [req.path, body + query, req.ip, 'SQL_INJECTION_PATTERN']
    ).catch(err => console.error('security_events insert failed:', err.message));
    return res.status(400).json({ error: 'Invalid input detected' });
  }
  next();
});

app.use('/api/datacenters', require('./routes/datacenters'));
app.use('/api/racks',       require('./routes/racks'));
app.use('/api/nodes',       require('./routes/nodes'));
app.use('/api/slas',        require('./routes/slas'));
app.use('/api/incidents',   require('./routes/incidents'));
app.use('/api/vault',       require('./routes/vault'));
app.use('/api/reports',     require('./routes/reports'));
app.use('/api/anomalies', require('./routes/anomalies'));
app.use('/api/metrics',   require('./routes/metrics'));
app.use('/api/audit-log', require('./routes/auditLog'));
app.use('/api/mfa', require('./routes/mfa'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/datacenters', require('./routes/datacenters'));



app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`INFRAlock API running on port ${PORT}`));
