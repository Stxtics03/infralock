CREATE TABLE slas (
  sla_id            INT           AUTO_INCREMENT PRIMARY KEY,
  node_id           INT           NULL,
  rack_id           INT           NULL,
  client_name       VARCHAR(100)  NOT NULL,
  uptime_target_pct DECIMAL(5,2)  NOT NULL,
  response_time_ms  INT           NOT NULL,
  penalty_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
  start_date        DATE          NOT NULL,
  end_date          DATE          NOT NULL,
  status            VARCHAR(15)   DEFAULT 'active',
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (node_id) REFERENCES nodes(node_id),
  FOREIGN KEY (rack_id) REFERENCES racks(rack_id)
);

CREATE TABLE sla_breaches (
  breach_id           INT           AUTO_INCREMENT PRIMARY KEY,
  sla_id              INT           NOT NULL,
  detected_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actual_uptime_pct   DECIMAL(5,2)  NOT NULL,
  breach_duration_min INT           NOT NULL,
  acknowledged_by     INT           NULL,
  acknowledged_at     TIMESTAMP     NULL,
  notes               TEXT          NULL,
  FOREIGN KEY (sla_id)          REFERENCES slas(sla_id),
  FOREIGN KEY (acknowledged_by) REFERENCES users(user_id)
);

CREATE TABLE incidents (
  incident_id INT           AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200)  NOT NULL,
  description TEXT          NULL,
  severity    VARCHAR(2)    NOT NULL DEFAULT 'P3',
  status      VARCHAR(15)   DEFAULT 'open',
  node_id     INT           NULL,
  rack_id     INT           NULL,
  raised_by   INT           NOT NULL,
  assigned_to INT           NULL,
  raised_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP     NULL,
  FOREIGN KEY (node_id)     REFERENCES nodes(node_id),
  FOREIGN KEY (rack_id)     REFERENCES racks(rack_id),
  FOREIGN KEY (raised_by)   REFERENCES users(user_id),
  FOREIGN KEY (assigned_to) REFERENCES users(user_id),
  INDEX idx_status_severity (status, severity)
);

CREATE TABLE audit_trail (
  audit_id     BIGINT        AUTO_INCREMENT PRIMARY KEY,
  table_name   VARCHAR(50)   NOT NULL,
  operation    VARCHAR(10)   NOT NULL,
  record_pk    VARCHAR(50)   NOT NULL,
  performed_by VARCHAR(100)  NOT NULL,
  performed_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  old_values   JSON          NULL,
  new_values   JSON          NULL,
  ip_address   VARCHAR(45)   NULL,
  INDEX idx_table_op (table_name, operation),
  INDEX idx_performed_at (performed_at)
);

CREATE TABLE security_events (
  event_id        BIGINT        AUTO_INCREMENT PRIMARY KEY,
  endpoint        VARCHAR(100)  NOT NULL,
  suspicious_input TEXT         NOT NULL,
  ip_address      VARCHAR(45)   NOT NULL,
  user_id         INT           NULL,
  detected_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  pattern_matched VARCHAR(100)  NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
