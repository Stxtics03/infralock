CREATE OR REPLACE VIEW v_active_nodes AS
SELECT
  n.node_id, n.hostname, n.ip_address, n.node_type,
  n.cpu_cores, n.ram_gb, n.storage_tb, n.status,
  r.rack_label, r.zone,
  dc.dc_name, dc.location
FROM nodes n
JOIN racks r       ON r.rack_id = n.rack_id
JOIN datacenters dc ON dc.dc_id = r.dc_id
WHERE n.status = 'active';

CREATE OR REPLACE VIEW v_sla_health AS
SELECT
  s.sla_id, s.client_name, s.uptime_target_pct,
  n.hostname,
  COUNT(sb.breach_id)             AS breach_count,
  MAX(sb.detected_at)             AS last_breach_at,
  s.status
FROM slas s
LEFT JOIN nodes n         ON n.node_id = s.node_id
LEFT JOIN sla_breaches sb ON sb.sla_id = s.sla_id
GROUP BY s.sla_id, s.client_name, s.uptime_target_pct, n.hostname, s.status;

CREATE OR REPLACE VIEW v_open_incidents AS
SELECT
  i.incident_id, i.title, i.severity, i.status,
  i.raised_at, i.resolved_at,
  n.hostname   AS node_hostname,
  u1.full_name AS raised_by_name,
  u2.full_name AS assigned_to_name
FROM incidents i
LEFT JOIN nodes n          ON n.node_id = i.node_id
LEFT JOIN users u1         ON u1.user_id = i.raised_by
LEFT JOIN users u2         ON u2.user_id = i.assigned_to
WHERE i.status != 'closed';

CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
  dc.dc_id, dc.dc_name, dc.location,
  COUNT(DISTINCT n.node_id)                             AS total_nodes,
  SUM(CASE WHEN n.status='active' THEN 1 ELSE 0 END)   AS active_nodes,
  COUNT(DISTINCT CASE WHEN i.status='open' THEN i.incident_id END) AS open_incidents
FROM datacenters dc
LEFT JOIN racks r      ON r.dc_id = dc.dc_id
LEFT JOIN nodes n      ON n.rack_id = r.rack_id
LEFT JOIN incidents i  ON i.node_id = n.node_id
GROUP BY dc.dc_id, dc.dc_name, dc.location;

CREATE OR REPLACE VIEW v_audit_recent AS
SELECT
  a.audit_id, a.table_name, a.operation,
  a.record_pk, a.performed_by, a.performed_at,
  a.old_values, a.new_values, a.ip_address
FROM audit_trail a
ORDER BY a.performed_at DESC
LIMIT 100;
