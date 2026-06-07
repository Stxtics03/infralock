CREATE TABLE users (
  user_id       INT           AUTO_INCREMENT PRIMARY KEY,
  supabase_uid  VARCHAR(36)   NOT NULL UNIQUE,
  full_name     VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  role          VARCHAR(20)   NOT NULL DEFAULT 'ENGINEER',
  status        VARCHAR(15)   DEFAULT 'active',
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  last_login    TIMESTAMP     NULL,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

CREATE TABLE datacenters (
  dc_id           INT           AUTO_INCREMENT PRIMARY KEY,
  dc_name         VARCHAR(100)  NOT NULL,
  location        VARCHAR(255)  NOT NULL,
  total_power_kw  DECIMAL(8,2)  NOT NULL,
  cooling_type    VARCHAR(50)   NOT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE racks (
  rack_id       INT           AUTO_INCREMENT PRIMARY KEY,
  dc_id         INT           NOT NULL,
  rack_label    VARCHAR(20)   NOT NULL,
  zone          VARCHAR(50)   NOT NULL,
  max_units     TINYINT       NOT NULL DEFAULT 42,
  max_power_kw  DECIMAL(8,2)  NOT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dc_id) REFERENCES datacenters(dc_id),
  INDEX idx_dc (dc_id)
);

CREATE TABLE nodes (
  node_id           INT           AUTO_INCREMENT PRIMARY KEY,
  rack_id           INT           NOT NULL,
  hostname          VARCHAR(100)  NOT NULL UNIQUE,
  ip_address        VARCHAR(45)   NOT NULL UNIQUE,
  node_type         VARCHAR(30)   NOT NULL,
  cpu_cores         SMALLINT      NOT NULL,
  ram_gb            SMALLINT      NOT NULL,
  storage_tb        DECIMAL(6,2)  NOT NULL,
  os                VARCHAR(100)  NULL,
  status            VARCHAR(20)   DEFAULT 'active',
  rack_unit_start   TINYINT       NOT NULL,
  rack_unit_end     TINYINT       NOT NULL,
  commissioned_at   TIMESTAMP     NULL,
  decommissioned_at TIMESTAMP     NULL,
  created_by        INT           NOT NULL,
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rack_id)   REFERENCES racks(rack_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id),
  INDEX idx_rack (rack_id),
  INDEX idx_status (status)
);
