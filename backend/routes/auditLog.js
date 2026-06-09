/**
 * routes/auditLog.js
 *
 * Mount in your Express app:
 *   const auditLogRoutes = require('./routes/auditLog');
 *   app.use('/api/audit-log', auditLogRoutes);
 */

const express = require("express");
const router = express.Router();
const db = require("../db"); // your MySQL2 pool — adjust path as needed
const { requireAuth } = require("../middleware/auth"); // your existing auth middleware

/**
 * GET /api/audit-log
 *
 * Query params:
 *   page        — page number (default 1)
 *   limit       — rows per page (default 20, max 100)
 *   user        — filter by user_email (partial match)
 *   table_name  — filter by table_name (exact)
 *   operation   — INSERT | UPDATE | DELETE
 *   date_from   — ISO date string (inclusive)
 *   date_to     — ISO date string (inclusive, end of day)
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { user, table_name, operation, date_from, date_to } = req.query;

    const conditions = [];
    const params = [];

    if (user) {
      conditions.push("at.user_email LIKE ?");
      params.push(`%${user}%`);
    }
    if (table_name) {
      conditions.push("at.table_name = ?");
      params.push(table_name);
    }
    if (operation && ["INSERT", "UPDATE", "DELETE"].includes(operation.toUpperCase())) {
      conditions.push("at.operation = ?");
      params.push(operation.toUpperCase());
    }
    if (date_from) {
      conditions.push("at.created_at >= ?");
      params.push(new Date(date_from).toISOString().replace("T", " ").slice(0, 19));
    }
    if (date_to) {
      // include full day
      const to = new Date(date_to);
      to.setHours(23, 59, 59, 999);
      conditions.push("at.created_at <= ?");
      params.push(to.toISOString().replace("T", " ").slice(0, 19));
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count query
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM audit_trail at ${where}`,
      params
    );
    const total = countRows[0]?.total || 0;

    // Data query
    const [rows] = await db.query(
      `SELECT
         at.id,
         at.table_name,
         at.operation,
         at.record_id,
         at.user_email,
         at.old_values,
         at.new_values,
         at.changed_fields,
         at.created_at
       FROM audit_trail at
       ${where}
       ORDER BY at.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Parse JSON fields if stored as strings
    const logs = rows.map((row) => ({
      ...row,
      old_values: tryParseJSON(row.old_values),
      new_values: tryParseJSON(row.new_values),
      changed_fields: tryParseJSON(row.changed_fields),
    }));

    // Fetch distinct users and tables for filter dropdowns (first page only)
    let meta = {};
    if (page === 1) {
      const [[usersRows], [tablesRows]] = await Promise.all([
        db.query("SELECT DISTINCT user_email FROM audit_trail ORDER BY user_email LIMIT 50"),
        db.query("SELECT DISTINCT table_name FROM audit_trail ORDER BY table_name"),
      ]);
      meta = {
        users: usersRows.map((r) => r.user_email).filter(Boolean),
        tables: tablesRows.map((r) => r.table_name).filter(Boolean),
      };
    }

    return res.json({
      logs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      meta,
    });
  } catch (err) {
    console.error("[audit-log] GET error:", err);
    return res.status(500).json({ error: "Failed to fetch audit log", detail: err.message });
  }
});

/**
 * GET /api/audit-log/:id
 * Single audit entry detail
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM audit_trail WHERE id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Entry not found" });
    const row = rows[0];
    return res.json({
      ...row,
      old_values: tryParseJSON(row.old_values),
      new_values: tryParseJSON(row.new_values),
      changed_fields: tryParseJSON(row.changed_fields),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

function tryParseJSON(val) {
  if (!val || typeof val === "object") return val;
  try { return JSON.parse(val); } catch { return val; }
}

module.exports = router;
