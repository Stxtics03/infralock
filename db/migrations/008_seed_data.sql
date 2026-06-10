-- ============================================================
-- 008_seed_data.sql  –  INFRAlock realistic demo data
-- Run AFTER all migrations 001–007 have been applied.
-- Assumes at least one user exists. Update SET @uid = X below.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE ai_anomalies;
TRUNCATE TABLE audit_trail;
TRUNCATE TABLE sla_breaches;
TRUNCATE TABLE slas;
TRUNCATE TABLE incidents;
TRUNCATE TABLE nodes;
TRUNCATE TABLE projects;
TRUNCATE TABLE racks;
TRUNCATE TABLE datacenters;

SET FOREIGN_KEY_CHECKS = 1;

-- ── grab the first real user so FKs don't break ─────────────
SET @uid  = (SELECT user_id FROM users ORDER BY user_id LIMIT 1);
SET @mail = (SELECT email    FROM users ORDER BY user_id LIMIT 1);

-- ============================================================
-- 1. DATACENTERS
-- ============================================================
INSERT INTO datacenters (dc_name, location, total_power_kw, cooling_type) VALUES
  ('MUM-DC-01', 'Mumbai, Maharashtra',   3200.00, 'Chilled Water'),
  ('BLR-DC-01', 'Bangalore, Karnataka',  2400.00, 'Air Economizer'),
  ('CHN-DC-01', 'Chennai, Tamil Nadu',   1800.00, 'Hybrid Cooling');

-- ============================================================
-- 2. RACKS
-- ============================================================
INSERT INTO racks (dc_id, rack_label, zone, max_units, max_power_kw) VALUES
  (1, 'ROW-A-R01', 'Zone-A', 42, 15.00),   -- rack_id 1
  (1, 'ROW-A-R02', 'Zone-A', 42, 15.00),   -- rack_id 2
  (1, 'ROW-B-R01', 'Zone-B', 42, 12.00),   -- rack_id 3
  (2, 'ROW-C-R01', 'Zone-C', 42, 10.00),   -- rack_id 4
  (2, 'ROW-C-R02', 'Zone-C', 42, 10.00),   -- rack_id 5
  (3, 'ROW-D-R01', 'Zone-D', 48, 20.00),   -- rack_id 6
  (3, 'ROW-D-R02', 'Zone-D', 48, 20.00);   -- rack_id 7

-- ============================================================
-- 3. PROJECTS
-- ============================================================
INSERT INTO projects
  (project_name, description, allocated_ram_gb, allocated_cpu_cores, allocated_storage_tb, status, created_by, rack_id)
VALUES
  ('gpay getaway',      'Payment gateway storage cluster',          320,  48,  30.00, 'active',   @uid, 1),
  ('Paytm Contractual', 'Money transfer processing nodes',          192,  32,  20.00, 'active',   @uid, 2),
  ('Alpha DC Migration','Primary datacenter migration project',      512,  64,  60.00, 'active',   @uid, 1),
  ('ML Training Fleet', 'GPU nodes for model training workloads',   1024, 128, 200.00,'active',   @uid, 6),
  ('DR Standby',        'Disaster recovery cold standby cluster',   128,  16,  40.00, 'inactive', @uid, 5);

-- ============================================================
-- 4. NODES  (assigned to projects — within RAM quotas)
-- ============================================================
INSERT INTO nodes
  (rack_id, hostname, ip_address, node_type, cpu_cores, ram_gb, storage_tb,
   os, status, rack_unit_start, rack_unit_end, commissioned_at, created_by, project_id)
VALUES
  -- gpay getaway (project_id=1, allocated 320 GB RAM)
  (1,'net-core-001',  '10.0.1.10', 'compute', 16, 64, 4.00,  'Ubuntu 22.04 LTS', 'active',      1,  2, '2025-09-01 08:00:00', @uid, 1),
  (1,'net-core-002',  '10.0.1.11', 'compute', 16, 64, 4.00,  'Ubuntu 22.04 LTS', 'active',      3,  4, '2025-09-01 08:00:00', @uid, 1),
  (1,'net-db-001',    '10.0.1.12', 'storage', 8,  128, 12.00,'Ubuntu 22.04 LTS', 'active',      5,  8, '2025-09-05 08:00:00', @uid, 1),
  -- total: 256 GB ✓ (under 320)

  -- Paytm Contractual (project_id=2, allocated 192 GB RAM)
  (2,'srv-prod-001',  '10.0.2.10', 'compute', 16, 64, 8.00,  'RHEL 9.2',         'active',      1,  2, '2025-10-01 09:00:00', @uid, 2),
  (2,'srv-prod-002',  '10.0.2.11', 'compute', 16, 64, 8.00,  'RHEL 9.2',         'active',      3,  4, '2025-10-01 09:00:00', @uid, 2),
  -- total: 128 GB ✓ (under 192)

  -- Alpha DC Migration (project_id=3, allocated 512 GB RAM)
  (1,'srv-hyp-001',   '10.0.1.20', 'compute', 32, 128, 10.00,'VMware ESXi 8.0',  'active',      9, 12, '2025-08-15 07:00:00', @uid, 3),
  (3,'srv-hyp-002',   '10.0.3.10', 'compute', 32, 128, 10.00,'VMware ESXi 8.0',  'active',      1,  4, '2025-08-15 07:00:00', @uid, 3),
  (3,'srv-stor-001',  '10.0.3.11', 'storage', 8,  32,  48.00,'Ubuntu 22.04 LTS', 'active',      5,  8, '2025-08-20 07:00:00', @uid, 3),
  -- total: 288 GB ✓ (under 512)

  -- ML Training Fleet (project_id=4, allocated 1024 GB RAM)
  (6,'gpu-train-001', '10.0.6.10', 'gpu',     64, 256, 20.00,'Ubuntu 22.04 LTS', 'active',      1,  4, '2025-11-01 06:00:00', @uid, 4),
  (6,'gpu-train-002', '10.0.6.11', 'gpu',     64, 256, 20.00,'Ubuntu 22.04 LTS', 'active',      5,  8, '2025-11-01 06:00:00', @uid, 4),
  (6,'gpu-stor-001',  '10.0.6.12', 'storage', 16, 128,100.00,'Ubuntu 22.04 LTS', 'active',      9, 12, '2025-11-05 06:00:00', @uid, 4),
  -- total: 640 GB ✓ (under 1024)

  -- DR Standby (project_id=5, allocated 128 GB RAM)
  (5,'dr-node-001',   '10.0.5.10', 'compute', 8,  64,  10.00,'Debian 12',        'maintenance', 1,  2, '2025-12-01 06:00:00', @uid, 5),
  -- total: 64 GB ✓ (under 128)

  -- Unassigned spares
  (4,'spare-node-001','10.0.4.10', 'compute', 4,  16,  1.00, 'Debian 12',        'active',      1,  2, '2026-01-10 06:00:00', @uid, NULL),
  (7,'spare-node-002','10.0.7.10', 'compute', 4,  16,  1.00, 'Debian 12',        'inactive',    1,  2, '2026-01-10 06:00:00', @uid, NULL);

-- ============================================================
-- 5. SLAs
-- ============================================================
INSERT INTO slas
  (node_id, rack_id, client_name, uptime_target_pct, response_time_ms, penalty_amount, start_date, end_date, status)
VALUES
  (1,  NULL, 'GPay India Ltd',        99.99,  50,  15000.00, '2025-09-01', '2026-08-31', 'active'),
  (4,  NULL, 'Paytm Payments Bank',   99.95, 100,  10000.00, '2025-10-01', '2026-09-30', 'active'),
  (NULL, 1,  'Alpha Corp',            99.90, 200,   5000.00, '2025-08-01', '2026-07-31', 'active'),
  (10, NULL, 'DataVault AI Pvt Ltd',  99.99,  30,  25000.00, '2025-11-01', '2026-10-31', 'active');

-- ============================================================
-- 6. SLA BREACHES
-- ============================================================
INSERT INTO sla_breaches
  (sla_id, detected_at, actual_uptime_pct, breach_duration_min, acknowledged_by, acknowledged_at, notes)
VALUES
  (1, NOW() - INTERVAL 45  DAY, 99.81, 28, @uid, NOW() - INTERVAL 45 DAY + INTERVAL 2 HOUR,
   'NIC flap on net-core-001 during scheduled maintenance window. Traffic failed over to net-core-002.'),
  (2, NOW() - INTERVAL 22  DAY, 99.87, 18, @uid, NOW() - INTERVAL 22 DAY + INTERVAL 1 HOUR,
   'Storage latency spike on srv-prod-001 during month-end ETL batch. Queries degraded, no data loss.'),
  (4, NOW() - INTERVAL 8   DAY, 99.94, 8,  @uid, NOW() - INTERVAL 8  DAY + INTERVAL 3 HOUR,
   'Power cycling during UPS load test on Zone-D exceeded RTO by 3 minutes.');

-- ============================================================
-- 7. INCIDENTS  (P1–P4, mix of open / resolved)
-- ============================================================
INSERT INTO incidents
  (title, description, severity, status, node_id, rack_id, raised_by, assigned_to, raised_at, resolved_at)
VALUES
  -- ── P1 open ─────────────────────────────────────────────
  ('Uncorrectable ECC memory errors on gpu-train-001',
   'nvidia-smi reporting uncorrectable ECC errors on GPU 2. CUDA training jobs aborting with OOM. Node may need DIMM replacement.',
   'P1', 'open', 10, NULL, @uid, @uid, NOW() - INTERVAL 3  HOUR, NULL),

  ('Primary NFS mount lost on gpu-stor-001',
   '/data/models NFS share unmounted unexpectedly. All GPU training jobs stalled. Attempting remount via runbook-NFS-04.',
   'P1', 'open', 12, NULL, @uid, @uid, NOW() - INTERVAL 1  HOUR, NULL),

  -- ── P2 open ─────────────────────────────────────────────
  ('SSL certificate expiring in 12 days on net-core-001',
   'TLS certificate for api.gpay-gw.internal expires 2026-06-22. Auto-renewal failed due to DNS-01 challenge timeout. Manual renewal required.',
   'P2', 'open', 1,  NULL, @uid, @uid, NOW() - INTERVAL 18 HOUR, NULL),

  ('Fan tray amber alert in ROW-D-R01',
   'Fan tray 3 in rack ROW-D-R01 reporting RPM drop to 60% of rated speed. Inlet temperature currently 28°C — within threshold. Monitoring closely.',
   'P2', 'open', NULL, 6, @uid, @uid, NOW() - INTERVAL 6  HOUR, NULL),

  ('srv-hyp-002 VMware datastore at 88% capacity',
   'ESXi datastore DS-HYP-02 at 88% utilisation. Snapshot consolidation running but delta disks growing faster than expected. Risk of datastore full within 48h.',
   'P2', 'open', 7,  NULL, @uid, @uid, NOW() - INTERVAL 2  DAY,  NULL),

  -- ── P3 open ─────────────────────────────────────────────
  ('srv-prod-002 swap usage consistently above 75%',
   'Concurrent Paytm batch jobs pushing swap usage to 75–82%. No OOM yet but latency p99 has increased 40ms. Consider cgroup limits or RAM upgrade.',
   'P3', 'open', 5,  NULL, @uid, @uid, NOW() - INTERVAL 12 HOUR, NULL),

  ('Kernel security patch pending reboot on 3 nodes',
   'Kernel 6.8.9 (CVE-2026-1234, CVE-2026-5678) applied to net-core-002, srv-prod-001, spare-node-001. Reboot required to activate. Schedule maintenance window.',
   'P3', 'open', 2,  NULL, @uid, @uid, NOW() - INTERVAL 3  DAY,  NULL),

  ('Backup job failure on net-db-001 for 2 consecutive nights',
   'nightly_backup.sh exited with code 255 on 2026-06-08 and 2026-06-09. Last successful backup 2026-06-07 02:14. Investigating disk I/O contention during backup window.',
   'P3', 'open', 3,  NULL, @uid, @uid, NOW() - INTERVAL 1  DAY,  NULL),

  -- ── P4 open ─────────────────────────────────────────────
  ('IPMI firmware out of date on srv-hyp-001',
   'IPMI firmware v2.71 installed, latest is v2.84. No functional impact. Schedule update during next maintenance window.',
   'P4', 'open', 6,  NULL, @uid, @uid, NOW() - INTERVAL 5  DAY,  NULL),

  -- ── Resolved ────────────────────────────────────────────
  ('Network switch reboot caused 4-min outage in Zone-A',
   'Planned firmware upgrade on core switch SW-A-01 resulted in unexpected 4-minute connectivity loss across ROW-A-R01 and ROW-A-R02. Rolled back to previous firmware.',
   'P2', 'resolved', NULL, 1, @uid, @uid,
   NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY + INTERVAL 5 HOUR),

  ('Disk I/O saturation on srv-stor-001 during ETL run',
   'End-of-month ETL job saturated disk I/O queue on srv-stor-001 for ~40 minutes. Queries degraded, no data lost. ETL job now scheduled outside business hours.',
   'P3', 'resolved', 8,  NULL, @uid, @uid,
   NOW() - INTERVAL 22 DAY, NOW() - INTERVAL 22 DAY + INTERVAL 3 HOUR),

  ('dr-node-001 failed POST on power cycle',
   'DR node failed BIOS POST after scheduled power cycle test. Root cause: loose PCIe riser card. Reseated and node returned to maintenance pool.',
   'P2', 'resolved', 13, NULL, @uid, @uid,
   NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 29 DAY);

-- ============================================================
-- 8. AUDIT TRAIL  (performed_by = email so display works)
-- ============================================================
INSERT INTO audit_trail
  (table_name, operation, record_pk, performed_by, performed_at, old_values, new_values, ip_address)
VALUES
  -- node commissioned
  ('nodes', 'INSERT', '1', @mail, NOW() - INTERVAL 274 DAY,
   NULL,
   JSON_OBJECT('hostname','net-core-001','ip_address','10.0.1.10','status','active','ram_gb',64),
   '10.0.0.1'),

  -- project created
  ('projects', 'INSERT', '1', @mail, NOW() - INTERVAL 274 DAY,
   NULL,
   JSON_OBJECT('project_name','gpay getaway','allocated_ram_gb',320,'status','active'),
   '10.0.0.1'),

  -- node assigned to project
  ('nodes', 'UPDATE', '1', @mail, NOW() - INTERVAL 270 DAY,
   JSON_OBJECT('project_id', NULL),
   JSON_OBJECT('project_id', 1),
   '10.0.0.1'),

  -- incident raised P1
  ('incidents', 'INSERT', '1', @mail, NOW() - INTERVAL 3 HOUR,
   NULL,
   JSON_OBJECT('title','Uncorrectable ECC memory errors on gpu-train-001','severity','P1','status','open'),
   '10.0.0.2'),

  -- incident resolved
  ('incidents', 'UPDATE', '10', @mail, NOW() - INTERVAL 10 DAY + INTERVAL 5 HOUR,
   JSON_OBJECT('status','open','resolved_at',NULL),
   JSON_OBJECT('status','resolved','resolved_at', DATE_FORMAT(NOW() - INTERVAL 10 DAY + INTERVAL 5 HOUR, '%Y-%m-%d %H:%i:%s')),
   '10.0.0.1'),

  -- SLA breach acknowledged
  ('sla_breaches', 'UPDATE', '1', @mail, NOW() - INTERVAL 45 DAY + INTERVAL 2 HOUR,
   JSON_OBJECT('acknowledged_by',NULL,'acknowledged_at',NULL),
   JSON_OBJECT('acknowledged_by',@uid,'notes','NIC flap resolved, traffic restored via failover'),
   '10.0.0.1'),

  -- rack power limit increased
  ('racks', 'UPDATE', '6', @mail, NOW() - INTERVAL 15 DAY,
   JSON_OBJECT('max_power_kw', 18.00),
   JSON_OBJECT('max_power_kw', 20.00),
   '10.0.0.3'),

  -- user role promoted
  ('users', 'UPDATE', CAST(@uid AS CHAR), @mail, NOW() - INTERVAL 60 DAY,
   JSON_OBJECT('role','ENGINEER'),
   JSON_OBJECT('role','ADMIN'),
   '10.0.0.1'),

  -- node decommission prep
  ('nodes', 'UPDATE', '14', @mail, NOW() - INTERVAL 5 DAY,
   JSON_OBJECT('status','active'),
   JSON_OBJECT('status','inactive'),
   '10.0.0.2'),

  -- config snapshot (vault)
  ('config_snapshots', 'INSERT', '1', @mail, NOW() - INTERVAL 1 DAY,
   NULL,
   JSON_OBJECT('node','net-core-001','version','v3','size_bytes',716),
   '10.0.0.1'),

  -- system anomaly auto-logged
  ('ai_anomalies', 'INSERT', '1', 'system_cron', NOW() - INTERVAL 2 HOUR,
   NULL,
   JSON_OBJECT('node_id',10,'metric','ram','z_score',3.8,'severity','critical'),
   '127.0.0.1');

-- ============================================================
-- Done
-- ============================================================
SELECT
  (SELECT COUNT(*) FROM datacenters)  AS datacenters,
  (SELECT COUNT(*) FROM racks)        AS racks,
  (SELECT COUNT(*) FROM projects)     AS projects,
  (SELECT COUNT(*) FROM nodes)        AS nodes,
  (SELECT COUNT(*) FROM incidents)    AS incidents,
  (SELECT COUNT(*) FROM slas)         AS slas,
  (SELECT COUNT(*) FROM sla_breaches) AS sla_breaches,
  (SELECT COUNT(*) FROM audit_trail)  AS audit_records;