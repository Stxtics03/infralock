const pool = require('../db/pool');

// ----------------------------------------------------------------
// GET /api/projects
// Returns all projects with live resource usage from the view
// ----------------------------------------------------------------
const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        project_id,
        project_name,
        description,
        project_status        AS status,
        created_by,
        rack_id,
        rack_label,
        created_at,
        allocated_ram_gb,
        allocated_cpu_cores,
        allocated_storage_tb,
        used_ram_gb,
        used_cpu_cores,
        used_storage_tb,
        free_ram_gb,
        free_cpu_cores,
        free_storage_tb,
        ram_utilisation_pct,
        cpu_utilisation_pct,
        storage_utilisation_pct,
        node_count
       FROM v_project_resources
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[projectController.getAll]', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// ----------------------------------------------------------------
// GET /api/projects/:id
// Returns a single project with its assigned nodes
// ----------------------------------------------------------------
const getById = async (req, res) => {
  const { id } = req.params;
  try {
    const [[project]] = await pool.query(
      `SELECT * FROM v_project_resources WHERE project_id = ?`,
      [id]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const [nodes] = await pool.query(
      `SELECT
         node_id, hostname, ip_address, node_type,
         cpu_cores, ram_gb, storage_tb, status
       FROM nodes
       WHERE project_id = ?
       ORDER BY hostname ASC`,
      [id]
    );

    res.json({ ...project, nodes });
  } catch (err) {
    console.error('[projectController.getById]', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

// ----------------------------------------------------------------
// POST /api/projects
// Creates a new project
// ----------------------------------------------------------------
const create = async (req, res) => {
  const {
    project_name,
    description,
    allocated_ram_gb,
    allocated_cpu_cores,
    allocated_storage_tb,
    rack_id,
    status = 'active',
  } = req.body;

  const created_by = req.user.user_id;

  if (!project_name) {
    return res.status(400).json({ error: 'project_name is required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO projects
         (project_name, description, allocated_ram_gb, allocated_cpu_cores,
          allocated_storage_tb, rack_id, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        project_name,
        description || null,
        allocated_ram_gb    || 0,
        allocated_cpu_cores || 0,
        allocated_storage_tb || 0.00,
        rack_id || null,
        status,
        created_by,
      ]
    );

    const [[created]] = await pool.query(
      `SELECT * FROM v_project_resources WHERE project_id = ?`,
      [result.insertId]
    );

    res.status(201).json(created);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A project with that name already exists' });
    }
    console.error('[projectController.create]', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// ----------------------------------------------------------------
// PUT /api/projects/:id
// Updates project details or reallocates quotas
// ----------------------------------------------------------------
const update = async (req, res) => {
  const { id } = req.params;
  const {
    project_name,
    description,
    allocated_ram_gb,
    allocated_cpu_cores,
    allocated_storage_tb,
    rack_id,
    status,
  } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE projects SET
         project_name         = COALESCE(?, project_name),
         description          = COALESCE(?, description),
         allocated_ram_gb     = COALESCE(?, allocated_ram_gb),
         allocated_cpu_cores  = COALESCE(?, allocated_cpu_cores),
         allocated_storage_tb = COALESCE(?, allocated_storage_tb),
         rack_id              = COALESCE(?, rack_id),
         status               = COALESCE(?, status)
       WHERE project_id = ?`,
      [
        project_name         || null,
        description          || null,
        allocated_ram_gb     ?? null,
        allocated_cpu_cores  ?? null,
        allocated_storage_tb ?? null,
        rack_id              ?? null,
        status               || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const [[updated]] = await pool.query(
      `SELECT * FROM v_project_resources WHERE project_id = ?`,
      [id]
    );

    res.json(updated);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A project with that name already exists' });
    }
    console.error('[projectController.update]', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

// ----------------------------------------------------------------
// DELETE /api/projects/:id
// Removes a project — assigned nodes revert to project_id = NULL
// ----------------------------------------------------------------
const remove = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      `DELETE FROM projects WHERE project_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('[projectController.remove]', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

// ----------------------------------------------------------------
// POST /api/projects/:id/assign-node
// Assigns a node to a project — DB trigger enforces RAM cap
// ----------------------------------------------------------------
const assignNode = async (req, res) => {
  const { id } = req.params;
  const { node_id } = req.body;

  if (!node_id) {
    return res.status(400).json({ error: 'node_id is required' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE nodes SET project_id = ? WHERE node_id = ?`,
      [id, node_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }

    res.json({ message: 'Node assigned to project successfully' });
  } catch (err) {
    // Surface the trigger's SIGNAL message cleanly to the frontend
    if (err.sqlState === '45000') {
      return res.status(422).json({ error: err.message });
    }
    console.error('[projectController.assignNode]', err);
    res.status(500).json({ error: 'Failed to assign node' });
  }
};

// ----------------------------------------------------------------
// POST /api/projects/:id/unassign-node
// Removes a node from a project (sets project_id = NULL)
// ----------------------------------------------------------------
const unassignNode = async (req, res) => {
  const { id } = req.params;
  const { node_id } = req.body;

  if (!node_id) {
    return res.status(400).json({ error: 'node_id is required' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE nodes SET project_id = NULL
       WHERE node_id = ? AND project_id = ?`,
      [node_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Node not found in this project' });
    }

    res.json({ message: 'Node removed from project successfully' });
  } catch (err) {
    console.error('[projectController.unassignNode]', err);
    res.status(500).json({ error: 'Failed to unassign node' });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  assignNode,
  unassignNode,
};