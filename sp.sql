DROP PROCEDURE IF EXISTS sp_detect_anomalies;
DELIMITER //
CREATE PROCEDURE sp_detect_anomalies(IN p_node_id INT)
BEGIN
  DECLARE v_cpu DECIMAL(5,2);
  DECLARE v_mem DECIMAL(5,2);
  DECLARE v_disk DECIMAL(5,2);
  SELECT cpu_pct, memory_pct, disk_pct INTO v_cpu, v_mem, v_disk
  FROM capacity_metrics WHERE node_id = p_node_id ORDER BY recorded_at DESC LIMIT 1;
  IF v_cpu IS NOT NULL THEN
    IF v_cpu > 90 THEN
      INSERT INTO ai_anomalies (node_id, anomaly_type, severity, description, detected_at)
      VALUES (p_node_id, 'cpu_spike', 'critical', CONCAT('CPU at ', v_cpu, '%'), NOW());
    END IF;
    IF v_mem > 90 THEN
      INSERT INTO ai_anomalies (node_id, anomaly_type, severity, description, detected_at)
      VALUES (p_node_id, 'memory_pressure', 'critical', CONCAT('Memory at ', v_mem, '%'), NOW());
    END IF;
    IF v_disk > 85 THEN
      INSERT INTO ai_anomalies (node_id, anomaly_type, severity, description, detected_at)
      VALUES (p_node_id, 'disk_full', 'warning', CONCAT('Disk at ', v_disk, '%'), NOW());
    END IF;
  END IF;
END//
DELIMITER ;
