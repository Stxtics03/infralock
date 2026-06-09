-- ============================================================
-- Migration : 007_projects.sql
-- Description : Projects & Resource Allocation system
--               - Creates `projects` table
--               - Adds `project_id` FK to `nodes`
--               - Creates `v_project_resources` view
--               - Creates `tg_node_project_ram_limit` trigger
-- ============================================================

-- ------------------------------------------------------------
-- 1. CREATE TABLE projects
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    project_id          INT             NOT NULL AUTO_INCREMENT,
    project_name        VARCHAR(100)    NOT NULL,
    description         TEXT,
    allocated_ram_gb    INT             NOT NULL DEFAULT 0,
    allocated_cpu_cores INT             NOT NULL DEFAULT 0,
    allocated_storage_tb DECIMAL(6,2)  NOT NULL DEFAULT 0.00,
    status              VARCHAR(15)     NOT NULL DEFAULT 'active',
    created_by          INT             NOT NULL,
    rack_id             INT             NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_projects
        PRIMARY KEY (project_id),

    CONSTRAINT uq_project_name
        UNIQUE (project_name),

    CONSTRAINT fk_projects_created_by
        FOREIGN KEY (created_by)
        REFERENCES users (user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_projects_rack
        FOREIGN KEY (rack_id)
        REFERENCES racks (rack_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- ------------------------------------------------------------
-- 2. ALTER TABLE nodes — add project_id FK (nullable)
-- ------------------------------------------------------------
ALTER TABLE nodes
    ADD COLUMN project_id INT NULL AFTER rack_unit_end,
    ADD CONSTRAINT fk_nodes_project
        FOREIGN KEY (project_id)
        REFERENCES projects (project_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;


-- ------------------------------------------------------------
-- 3. CREATE VIEW v_project_resources
--    Compares allocated vs actual usage per project
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_project_resources AS
SELECT
    p.project_id,
    p.project_name,
    p.description,
    p.status                                        AS project_status,
    p.created_by,
    p.rack_id,
    r.rack_label,
    p.created_at,

    -- Allocations
    p.allocated_ram_gb,
    p.allocated_cpu_cores,
    p.allocated_storage_tb,

    -- Actual usage (aggregated from assigned nodes)
    COALESCE(SUM(n.ram_gb),      0)                AS used_ram_gb,
    COALESCE(SUM(n.cpu_cores),   0)                AS used_cpu_cores,
    COALESCE(SUM(n.storage_tb),  0.00)             AS used_storage_tb,

    -- Node count
    COUNT(n.node_id)                               AS node_count,

    -- Headroom
    p.allocated_ram_gb     - COALESCE(SUM(n.ram_gb),     0)    AS free_ram_gb,
    p.allocated_cpu_cores  - COALESCE(SUM(n.cpu_cores),  0)    AS free_cpu_cores,
    p.allocated_storage_tb - COALESCE(SUM(n.storage_tb), 0.00) AS free_storage_tb,

    -- Utilisation percentages (NULL-safe, avoids division by zero)
    CASE
        WHEN p.allocated_ram_gb     > 0
        THEN ROUND(COALESCE(SUM(n.ram_gb),     0) / p.allocated_ram_gb     * 100, 2)
        ELSE 0
    END AS ram_utilisation_pct,

    CASE
        WHEN p.allocated_cpu_cores  > 0
        THEN ROUND(COALESCE(SUM(n.cpu_cores),  0) / p.allocated_cpu_cores  * 100, 2)
        ELSE 0
    END AS cpu_utilisation_pct,

    CASE
        WHEN p.allocated_storage_tb > 0
        THEN ROUND(COALESCE(SUM(n.storage_tb), 0) / p.allocated_storage_tb * 100, 2)
        ELSE 0
    END AS storage_utilisation_pct

FROM       projects p
LEFT JOIN  racks    r ON r.rack_id   = p.rack_id
LEFT JOIN  nodes    n ON n.project_id = p.project_id
GROUP BY
    p.project_id,
    p.project_name,
    p.description,
    p.status,
    p.created_by,
    p.rack_id,
    r.rack_label,
    p.created_at,
    p.allocated_ram_gb,
    p.allocated_cpu_cores,
    p.allocated_storage_tb;


-- ------------------------------------------------------------
-- 4. TRIGGER tg_node_project_ram_limit
--    Blocks INSERT / UPDATE on nodes if assigning to a project
--    would exceed that project's allocated_ram_gb quota.
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS tg_node_project_ram_limit_insert;
DROP TRIGGER IF EXISTS tg_node_project_ram_limit_update;

DELIMITER $$

CREATE TRIGGER tg_node_project_ram_limit_insert
BEFORE INSERT ON nodes
FOR EACH ROW
BEGIN
    DECLARE v_allocated  INT DEFAULT 0;
    DECLARE v_used       INT DEFAULT 0;

    IF NEW.project_id IS NOT NULL THEN

        SELECT allocated_ram_gb
        INTO   v_allocated
        FROM   projects
        WHERE  project_id = NEW.project_id;

        SELECT COALESCE(SUM(ram_gb), 0)
        INTO   v_used
        FROM   nodes
        WHERE  project_id = NEW.project_id;

        IF (v_used + NEW.ram_gb) > v_allocated THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'RAM quota exceeded: node RAM would surpass project allocated_ram_gb limit.';
        END IF;

    END IF;
END$$

CREATE TRIGGER tg_node_project_ram_limit_update
BEFORE UPDATE ON nodes
FOR EACH ROW
BEGIN
    DECLARE v_allocated  INT DEFAULT 0;
    DECLARE v_used       INT DEFAULT 0;

    -- Only run the check if project_id or ram_gb is actually changing
    IF NEW.project_id IS NOT NULL AND (
        NEW.project_id != OLD.project_id OR
        NEW.ram_gb     != OLD.ram_gb
    ) THEN

        SELECT allocated_ram_gb
        INTO   v_allocated
        FROM   projects
        WHERE  project_id = NEW.project_id;

        -- Sum all nodes in target project EXCLUDING the current row
        -- (so we don't double-count during an in-place ram_gb update)
        SELECT COALESCE(SUM(ram_gb), 0)
        INTO   v_used
        FROM   nodes
        WHERE  project_id = NEW.project_id
          AND  node_id    != OLD.node_id;

        IF (v_used + NEW.ram_gb) > v_allocated THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'RAM quota exceeded: node RAM would surpass project allocated_ram_gb limit.';
        END IF;

    END IF;
END$$

DELIMITER ;