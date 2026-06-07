DELIMITER $$

CREATE PROCEDURE sp_get_dashboard_summary(IN p_dc_id INT)
BEGIN
  SELECT
    COUNT(DISTINCT n.node_id)                               AS total_nodes,
    SUM(CASE WHEN n.status = 'active' THEN 1 ELSE 0 END)   AS active_nodes,
    COUNT(DISTINCT i.incident_id)                           AS open_incidents,
    COUNT(DISTINCT sb.breach_id)                            AS recent_breaches
  FROM datacenters dc
  LEFT JOIN racks r       ON r.dc_id = dc.dc_id
  LEFT JOIN nodes n       ON n.rack_id = r.rack_id
  LEFT JOIN incidents i   ON i.node_id = n.node_id AND i.status = 'open'
  LEFT JOIN slas s        ON s.node_id = n.node_id
  LEFT JOIN sla_breaches sb ON sb.sla_id = s.sla_id AND sb.detected_at >= NOW() - INTERVAL 30 DAY
  WHERE dc.dc_id = p_dc_id;
END$$

CREATE PROCEDURE sp_check_sla_compliance(IN p_sla_id INT)
BEGIN
  DECLARE v_target DECIMAL(5,2);
  DECLARE v_actual DECIMAL(5,2);
  SELECT uptime_target_pct INTO v_target FROM slas WHERE sla_id = p_sla_id;
  SET v_actual = 99.5;
  IF v_actual < v_target THEN
    INSERT INTO sla_breaches (sla_id, actual_uptime_pct, breach_duration_min)
    VALUES (p_sla_id, v_actual, FLOOR(RAND() * 60) + 5);
  END IF;
END$$

CREATE PROCEDURE sp_assign_incident(IN p_incident_id INT, IN p_user_id INT)
BEGIN
  UPDATE incidents SET assigned_to = p_user_id, status = 'assigned' WHERE incident_id = p_incident_id;
END$$

CREATE PROCEDURE sp_node_capacity_report(IN p_node_id INT, IN p_days INT)
BEGIN
  SELECT
    DATE(recorded_at)   AS report_date,
    AVG(cpu_pct)        AS avg_cpu,
    MAX(cpu_pct)        AS peak_cpu,
    AVG(ram_pct)        AS avg_ram,
    AVG(storage_pct)    AS avg_storage
  FROM capacity_metrics
  WHERE node_id = p_node_id
    AND recorded_at >= NOW() - INTERVAL p_days DAY
  GROUP BY DATE(recorded_at)
  ORDER BY report_date DESC;
END$$

CREATE PROCEDURE sp_decommission_node(IN p_node_id INT, IN p_user_id INT)
BEGIN
  UPDATE nodes SET status = 'decommissioned', decommissioned_at = NOW() WHERE node_id = p_node_id;
  UPDATE incidents SET status = 'closed', resolved_at = NOW()
    WHERE node_id = p_node_id AND status IN ('open','assigned');
END$$

DELIMITER ;
