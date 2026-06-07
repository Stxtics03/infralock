const cron = require('node-cron');
const pool = require('../db/pool');

async function runDetection() {
  const conn = await pool.getConnection();
  try {
    const [nodes] = await conn.query(
      "SELECT node_id FROM nodes WHERE status = 'active'"
    );

    for (const node of nodes) {
      await conn.query('CALL sp_detect_anomalies(?)', [node.node_id]);
    }

    console.log(`[AnomalyDetector] Ran for ${nodes.length} nodes at ${new Date().toISOString()}`);
  } catch (err) {
    console.error('[AnomalyDetector] Error:', err.message);
  } finally {
    conn.release();
  }
}

// Run every 5 minutes
cron.schedule('*/5 * * * *', runDetection);

module.exports = { runDetection };