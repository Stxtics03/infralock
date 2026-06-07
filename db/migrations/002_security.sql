CREATE TABLE config_snapshots (
  snapshot_id   INT           AUTO_INCREMENT PRIMARY KEY,
  node_id       INT           NOT NULL,
  version       SMALLINT      NOT NULL DEFAULT 1,
  storage_path  VARCHAR(500)  NOT NULL,
  plaintext_hash CHAR(64)     NOT NULL,
  file_size_bytes BIGINT      NOT NULL,
  uploaded_by   INT           NOT NULL,
  uploaded_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  notes         VARCHAR(500)  NULL,
  FOREIGN KEY (node_id)     REFERENCES nodes(node_id),
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id),
  INDEX idx_node_version (node_id, version)
);

CREATE TABLE key_management (
  key_id        INT           AUTO_INCREMENT PRIMARY KEY,
  snapshot_id   INT           NOT NULL,
  owner_user_id INT           NOT NULL,
  encrypted_key VARCHAR(255)  NOT NULL,
  iv            VARCHAR(100)  NOT NULL,
  auth_tag      VARCHAR(100)  NOT NULL,
  kdf_salt      VARCHAR(100)  NOT NULL,
  kdf_iterations INT          NOT NULL DEFAULT 100000,
  algorithm     VARCHAR(20)   NOT NULL DEFAULT 'AES-256-GCM',
  status        VARCHAR(15)   DEFAULT 'active',
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  revoked_at    TIMESTAMP     NULL,
  FOREIGN KEY (snapshot_id)   REFERENCES config_snapshots(snapshot_id),
  FOREIGN KEY (owner_user_id) REFERENCES users(user_id)
);
