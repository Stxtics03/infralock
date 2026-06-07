-- ============================================================
-- 004_ai_anomalies.sql
-- AI Anomaly Detection layer for INFRAlock
-- ============================================================

-- Table
CREATE TABLE IF NOT EXISTS ai_anomalies (
  anomaly_id      INT            AUTO_INCREMENT PRIMARY KEY,
  node_id         INT            NOT NULL,
  metric_type     ENUM('cpu','ram','storage') NOT NULL,
  observed_value  DECIMAL(5,2)   NOT NULL,
  baseline_avg    DECIMAL(5,2)   NOT NULL,
  baseline_stddev DECIMAL(5,2)   NOT NULL,
  z_score         DECIMAL(6,3)   NOT NULL,
  severity        ENUM('low','medium','critical') NOT NULL,
  auto_incident   BOOLEAN        DEFAULT FALSE,
  incident_id     INT            NULL,
  detected_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  resolved_at     TIMESTAMP      NULL,
  FOREIGN KEY (node_id)     REFERENCES nodes(node_id),
  FOREIGN KEY (incident_id) REFERENCES incidents(incident_id),
  INDEX idx_node_detected (node_id, detected_at),
  INDEX idx_severity (severity, resolved_at)
);

-- View
CREATE OR REPLACE VIEW v_node_anomaly_summary AS
SELECT
  n.node_id,
  n.hostname,
  n.status,
  COUNT(CASE WHEN a.severity = 'critical' AND a.resolved_at IS NULL THEN 1 END) AS critical_count,
  COUNT(CASE WHEN a.severity = 'medium'   AND a.resolved_at IS NULL THEN 1 END) AS medium_count,
  COUNT(CASE WHEN a.severity = 'low'      AND a.resolved_at IS NULL THEN 1 END) AS low_count,
  MAX(a.detected_at) AS last_anomaly_at
FROM nodes n
LEFT JOIN ai_anomalies a ON n.node_id = a.node_id
GROUP BY n.node_id, n.hostname, n.status;

-- Stored Procedure
DROP PROCEDURE IF EXISTS sp_detect_anomalies;

DELIMITER $$
CREATE PROCEDURE sp_detect_anomalies(IN p_node_id INT)
sp_detect_anomalies: BEGIN
  DECLARE v_cpu_avg      DECIMAL(5,2);
  DECLARE v_cpu_std      DECIMAL(5,2);
  DECLARE v_cpu_cur      DECIMAL(5,2);
  DECLARE v_cpu_z        DECIMAL(6,3);
  DECLARE v_ram_avg      DECIMAL(5,2);
  DECLARE v_ram_std      DECIMAL(5,2);
  DECLARE v_ram_cur      DECIMAL(5,2);
  DECLARE v_ram_z        DECIMAL(6,3);
  DECLARE v_stg_avg      DECIMAL(5,2);
  DECLARE v_stg_std      DECIMAL(5,2);
  DECLARE v_stg_cur      DECIMAL(5,2);
  DECLARE v_stg_z        DECIMAL(6,3);
  DECLARE v_row_count    INT;
  DECLARE v_severity     VARCHAR(10);
  DECLARE v_incident_id  INT DEFAULT NULL;

  -- Minimum data check
  SELECT COUNT(*) INTO v_row_count
  FROM capacity_metrics
  WHERE node_id = p_node_id
    AND recorded_at >= NOW() - INTERVAL 24 HOUR;

  IF v_row_count < 60 THEN
    LEAVE sp_detect_anomalies;
  END IF;

  -- ── CPU ──────────────────────────────────────────────────
  SELECT AVG(cpu_pct), STDDEV_POP(cpu_pct)
  INTO v_cpu_avg, v_cpu_std
  FROM capacity_metrics
  WHERE node_id = p_node_id
    AND recorded_at >= NOW() - INTERVAL 24 HOUR;

  SELECT cpu_pct INTO v_cpu_cur
  FROM capacity_metrics
  WHERE node_id = p_node_id
  ORDER BY recorded_at DESC LIMIT 1;

  IF v_cpu_std > 0 THEN
    SET v_cpu_z = (v_cpu_cur - v_cpu_avg) / v_cpu_std;

    IF ABS(v_cpu_z) > 1.5 THEN
      SET v_severity = CASE
        WHEN ABS(v_cpu_z) > 3.5 THEN 'critical'
        WHEN ABS(v_cpu_z) > 2.5 THEN 'medium'
        ELSE 'low'
      END;

      -- Duplicate guard
      IF NOT EXISTS (
        SELECT 1 FROM ai_anomalies
        WHERE node_id = p_node_id
          AND metric_type = 'cpu'
          AND resolved_at IS NULL
          AND detected_at >= NOW() - INTERVAL 5 MINUTE
      ) THEN
        SET v_incident_id = NULL;

        IF v_severity = 'critical' THEN
          INSERT INTO incidents (title, description, severity, status, node_id, raised_by, raised_at)
          VALUES (
            CONCAT('Critical CPU anomaly on node ', p_node_id),
            CONCAT('Z-score: ', ROUND(v_cpu_z, 2), ' | Observed: ', v_cpu_cur, '% | Baseline avg: ', ROUND(v_cpu_avg, 2), '%'),
            'P1', 'open', p_node_id, 1, NOW()
          );
          SET v_incident_id = LAST_INSERT_ID();
        END IF;

        INSERT INTO ai_anomalies
          (node_id, metric_type, observed_value, baseline_avg, baseline_stddev, z_score, severity, auto_incident, incident_id)
        VALUES
          (p_node_id, 'cpu', v_cpu_cur, v_cpu_avg, v_cpu_std, v_cpu_z, v_severity, (v_severity = 'critical'), v_incident_id);

        INSERT INTO audit_trail (table_name, operation, record_pk, performed_by, performed_at, new_values, ip_address)
        VALUES ('ai_anomalies', 'INSERT', LAST_INSERT_ID(), 'system_cron', NOW(),
          JSON_OBJECT('node_id', p_node_id, 'metric', 'cpu', 'z_score', v_cpu_z, 'severity', v_severity),
          '127.0.0.1');
      END IF;
    END IF;
  END IF;

  -- ── RAM ──────────────────────────────────────────────────
  SELECT AVG(ram_pct), STDDEV_POP(ram_pct)
  INTO v_ram_avg, v_ram_std
  FROM capacity_metrics
  WHERE node_id = p_node_id
    AND recorded_at >= NOW() - INTERVAL 24 HOUR;

  SELECT ram_pct INTO v_ram_cur
  FROM capacity_metrics
  WHERE node_id = p_node_id
  ORDER BY recorded_at DESC LIMIT 1;

  IF v_ram_std > 0 THEN
    SET v_ram_z = (v_ram_cur - v_ram_avg) / v_ram_std;

    IF ABS(v_ram_z) > 1.5 THEN
      SET v_severity = CASE
        WHEN ABS(v_ram_z) > 3.5 THEN 'critical'
        WHEN ABS(v_ram_z) > 2.5 THEN 'medium'
        ELSE 'low'
      END;

      IF NOT EXISTS (
        SELECT 1 FROM ai_anomalies
        WHERE node_id = p_node_id
          AND metric_type = 'ram'
          AND resolved_at IS NULL
          AND detected_at >= NOW() - INTERVAL 5 MINUTE
      ) THEN
        SET v_incident_id = NULL;

        IF v_severity = 'critical' THEN
          INSERT INTO incidents (title, description, severity, status, node_id, raised_by, raised_at)
          VALUES (
            CONCAT('Critical RAM anomaly on node ', p_node_id),
            CONCAT('Z-score: ', ROUND(v_ram_z, 2), ' | Observed: ', v_ram_cur, '% | Baseline avg: ', ROUND(v_ram_avg, 2), '%'),
            'P1', 'open', p_node_id, 1, NOW()
          );
          SET v_incident_id = LAST_INSERT_ID();
        END IF;

        INSERT INTO ai_anomalies
          (node_id, metric_type, observed_value, baseline_avg, baseline_stddev, z_score, severity, auto_incident, incident_id)
        VALUES
          (p_node_id, 'ram', v_ram_cur, v_ram_avg, v_ram_std, v_ram_z, v_severity, (v_severity = 'critical'), v_incident_id);

        INSERT INTO audit_trail (table_name, operation, record_pk, performed_by, performed_at, new_values, ip_address)
        VALUES ('ai_anomalies', 'INSERT', LAST_INSERT_ID(), 'system_cron', NOW(),
          JSON_OBJECT('node_id', p_node_id, 'metric', 'ram', 'z_score', v_ram_z, 'severity', v_severity),
          '127.0.0.1');
      END IF;
    END IF;
  END IF;

  -- ── STORAGE ──────────────────────────────────────────────
  SELECT AVG(storage_pct), STDDEV_POP(storage_pct)
  INTO v_stg_avg, v_stg_std
  FROM capacity_metrics
  WHERE node_id = p_node_id
    AND recorded_at >= NOW() - INTERVAL 24 HOUR;

  SELECT storage_pct INTO v_stg_cur
  FROM capacity_metrics
  WHERE node_id = p_node_id
  ORDER BY recorded_at DESC LIMIT 1;

  IF v_stg_std > 0 THEN
    SET v_stg_z = (v_stg_cur - v_stg_avg) / v_stg_std;

    IF ABS(v_stg_z) > 1.5 THEN
      SET v_severity = CASE
        WHEN ABS(v_stg_z) > 3.5 THEN 'critical'
        WHEN ABS(v_stg_z) > 2.5 THEN 'medium'
        ELSE 'low'
      END;

      IF NOT EXISTS (
        SELECT 1 FROM ai_anomalies
        WHERE node_id = p_node_id
          AND metric_type = 'storage'
          AND resolved_at IS NULL
          AND detected_at >= NOW() - INTERVAL 5 MINUTE
      ) THEN
        SET v_incident_id = NULL;

        IF v_severity = 'critical' THEN
          INSERT INTO incidents (title, description, severity, status, node_id, raised_by, raised_at)
          VALUES (
            CONCAT('Critical storage anomaly on node ', p_node_id),
            CONCAT('Z-score: ', ROUND(v_stg_z, 2), ' | Observed: ', v_stg_cur, '% | Baseline avg: ', ROUND(v_stg_avg, 2), '%'),
            'P1', 'open', p_node_id, 1, NOW()
          );
          SET v_incident_id = LAST_INSERT_ID();
        END IF;

        INSERT INTO ai_anomalies
          (node_id, metric_type, observed_value, baseline_avg, baseline_stddev, z_score, severity, auto_incident, incident_id)
        VALUES
          (p_node_id, 'storage', v_stg_cur, v_stg_avg, v_stg_std, v_stg_z, v_severity, (v_severity = 'critical'), v_incident_id);

        INSERT INTO audit_trail (table_name, operation, record_pk, performed_by, performed_at, new_values, ip_address)
        VALUES ('ai_anomalies', 'INSERT', LAST_INSERT_ID(), 'system_cron', NOW(),
          JSON_OBJECT('node_id', p_node_id, 'metric', 'storage', 'z_score', v_stg_z, 'severity', v_severity),
          '127.0.0.1');
      END IF;
    END IF;
  END IF;

END$$
DELIMITER ;