-- ============================================================
-- INFRAlock Migration 005: MFA (TOTP + Backup Codes)
-- Run after 004_ai_anomalies.sql
-- ============================================================

-- ----------------------------------------------------------------
-- Table 1: mfa_config
-- One row per user. Stores the AES-256-GCM-encrypted TOTP secret.
-- enabled=FALSE until the user confirms their first TOTP code.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mfa_config (
  mfa_id        INT           AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL UNIQUE,
  totp_secret   VARCHAR(500)  NOT NULL,
  totp_iv       VARCHAR(100)  NOT NULL,
  totp_auth_tag VARCHAR(100)  NOT NULL,
  enabled       BOOLEAN       NOT NULL DEFAULT FALSE,
  enabled_at    TIMESTAMP     NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_mfa_user (user_id)
);

-- ----------------------------------------------------------------
-- Table 2: mfa_backup_codes
-- 10 single-use recovery codes per user.
-- Only the SHA-256 hash is stored — plaintext never persisted.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mfa_backup_codes (
  code_id    INT        AUTO_INCREMENT PRIMARY KEY,
  user_id    INT        NOT NULL,
  code_hash  CHAR(64)   NOT NULL,
  used       BOOLEAN    NOT NULL DEFAULT FALSE,
  used_at    TIMESTAMP  NULL,
  created_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_backup_user_used (user_id, used)
);

-- ----------------------------------------------------------------
-- Table 3: mfa_attempts
-- Brute-force rate-limit log. Checked by sp_check_mfa_rate_limit.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mfa_attempts (
  attempt_id   BIGINT     AUTO_INCREMENT PRIMARY KEY,
  user_id      INT        NOT NULL,
  ip_address   VARCHAR(45) NOT NULL,
  success      BOOLEAN    NOT NULL,
  attempted_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_attempts_user_time (user_id, attempted_at),
  INDEX idx_attempts_ip_time   (ip_address, attempted_at)
);

-- ----------------------------------------------------------------
-- Procedure: sp_check_mfa_rate_limit
-- Returns p_blocked=1 if the user has 5+ failures in 15 minutes.
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_check_mfa_rate_limit;

DELIMITER $$
CREATE PROCEDURE sp_check_mfa_rate_limit(
  IN  p_user_id INT,
  IN  p_ip      VARCHAR(45),
  OUT p_blocked TINYINT
)
BEGIN
  DECLARE v_fail_count INT;

  SELECT COUNT(*) INTO v_fail_count
  FROM mfa_attempts
  WHERE user_id     = p_user_id
    AND success     = FALSE
    AND attempted_at >= NOW() - INTERVAL 15 MINUTE;

  SET p_blocked = IF(v_fail_count >= 5, 1, 0);
END$$
DELIMITER ;

-- ----------------------------------------------------------------
-- Procedure: sp_log_mfa_attempt
-- Inserts attempt + writes to audit_trail (zero audit gap).
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_log_mfa_attempt;

DELIMITER $$
CREATE PROCEDURE sp_log_mfa_attempt(
  IN p_user_id INT,
  IN p_ip      VARCHAR(45),
  IN p_success BOOLEAN
)
BEGIN
  DECLARE v_attempt_id BIGINT;

  INSERT INTO mfa_attempts (user_id, ip_address, success)
  VALUES (p_user_id, p_ip, p_success);

  SET v_attempt_id = LAST_INSERT_ID();

  INSERT INTO audit_trail
    (table_name, operation, record_pk, performed_by, performed_at, new_values, ip_address)
  VALUES
    ('mfa_attempts', 'INSERT', v_attempt_id,
     p_user_id, NOW(),
     JSON_OBJECT('user_id', p_user_id, 'success', p_success),
     p_ip);
END$$
DELIMITER ;

-- ----------------------------------------------------------------
-- Trigger: trg_mfa_enable_audit
-- Fires when mfa_config.enabled flips TRUE — writes to audit_trail.
-- ----------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_mfa_enable_audit;

DELIMITER $$
CREATE TRIGGER trg_mfa_enable_audit
AFTER UPDATE ON mfa_config
FOR EACH ROW
BEGIN
  IF NEW.enabled = TRUE AND OLD.enabled = FALSE THEN
    INSERT INTO audit_trail
      (table_name, operation, record_pk, performed_by, performed_at, old_values, new_values, ip_address)
    VALUES
      ('mfa_config', 'UPDATE', NEW.mfa_id,
       NEW.user_id, NOW(),
       JSON_OBJECT('enabled', FALSE),
       JSON_OBJECT('enabled', TRUE, 'enabled_at', NEW.enabled_at),
       '0.0.0.0');
  END IF;
END$$
DELIMITER ;

-- ----------------------------------------------------------------
-- View: v_mfa_status
-- Per-user MFA state. Used by admin overview + SecuritySettings.
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW v_mfa_status AS
SELECT
  u.user_id,
  u.full_name,
  u.email,
  u.role,
  CASE WHEN mc.enabled = TRUE THEN 'enabled' ELSE 'disabled' END AS mfa_status,
  mc.enabled_at,
  COUNT(CASE WHEN mbc.used = FALSE THEN 1 END) AS backup_codes_remaining
FROM users u
LEFT JOIN mfa_config       mc  ON u.user_id = mc.user_id
LEFT JOIN mfa_backup_codes mbc ON u.user_id = mbc.user_id
GROUP BY u.user_id, u.full_name, u.email, u.role, mc.enabled, mc.enabled_at;

-- ----------------------------------------------------------------
-- Verify (run these manually after migration):
-- SHOW TABLES LIKE 'mfa_%';
-- SHOW PROCEDURE STATUS WHERE Name IN ('sp_check_mfa_rate_limit','sp_log_mfa_attempt');
-- SHOW TRIGGERS LIKE 'trg_mfa%';
-- SELECT * FROM v_mfa_status;
-- ----------------------------------------------------------------
