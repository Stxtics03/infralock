DELIMITER $$

CREATE TRIGGER trg_node_insert_audit
AFTER INSERT ON nodes FOR EACH ROW
BEGIN
  INSERT INTO audit_trail (table_name, operation, record_pk, performed_by, new_values, ip_address)
  VALUES ('nodes', 'INSERT', NEW.node_id, NEW.created_by, JSON_OBJECT(
    'hostname', NEW.hostname,
    'ip_address', NEW.ip_address,
    'status', NEW.status,
    'rack_id', NEW.rack_id
  ), '127.0.0.1');
END$$

CREATE TRIGGER trg_node_update_audit
AFTER UPDATE ON nodes FOR EACH ROW
BEGIN
  INSERT INTO audit_trail (table_name, operation, record_pk, performed_by, old_values, new_values, ip_address)
  VALUES ('nodes', 'UPDATE', NEW.node_id, NEW.created_by,
    JSON_OBJECT('status', OLD.status, 'rack_id', OLD.rack_id),
    JSON_OBJECT('status', NEW.status, 'rack_id', NEW.rack_id),
    '127.0.0.1');
END$$

CREATE TRIGGER trg_incident_insert_audit
AFTER INSERT ON incidents FOR EACH ROW
BEGIN
  INSERT INTO audit_trail (table_name, operation, record_pk, performed_by, new_values)
  VALUES ('incidents', 'INSERT', NEW.incident_id, NEW.raised_by,
    JSON_OBJECT('title', NEW.title, 'severity', NEW.severity, 'status', NEW.status));
END$$

CREATE TRIGGER trg_incident_update_audit
AFTER UPDATE ON incidents FOR EACH ROW
BEGIN
  INSERT INTO audit_trail (table_name, operation, record_pk, performed_by, old_values, new_values)
  VALUES ('incidents', 'UPDATE', NEW.incident_id, IFNULL(NEW.assigned_to, NEW.raised_by),
    JSON_OBJECT('status', OLD.status, 'assigned_to', OLD.assigned_to),
    JSON_OBJECT('status', NEW.status, 'assigned_to', NEW.assigned_to));
END$$

CREATE TRIGGER trg_sla_breach_audit
AFTER INSERT ON sla_breaches FOR EACH ROW
BEGIN
  INSERT INTO audit_trail (table_name, operation, record_pk, performed_by, new_values)
  VALUES ('sla_breaches', 'INSERT', NEW.breach_id, 'system',
    JSON_OBJECT('sla_id', NEW.sla_id, 'actual_uptime_pct', NEW.actual_uptime_pct));
END$$

CREATE TRIGGER trg_config_snapshot_audit
AFTER INSERT ON config_snapshots FOR EACH ROW
BEGIN
  INSERT INTO audit_trail (table_name, operation, record_pk, performed_by, new_values)
  VALUES ('config_snapshots', 'INSERT', NEW.snapshot_id, NEW.uploaded_by,
    JSON_OBJECT('node_id', NEW.node_id, 'version', NEW.version, 'storage_path', NEW.storage_path));
END$$

CREATE TRIGGER trg_node_decommission
AFTER UPDATE ON nodes FOR EACH ROW
BEGIN
  IF NEW.status = 'decommissioned' AND OLD.status != 'decommissioned' THEN
    UPDATE slas SET status = 'inactive' WHERE node_id = NEW.node_id AND status = 'active';
  END IF;
END$$

DELIMITER ;
