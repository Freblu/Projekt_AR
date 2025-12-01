-- Funkcja
DROP FUNCTION IF EXISTS is_code_valid;
DELIMITER //
CREATE FUNCTION is_code_valid(created_at DATETIME)
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
  RETURN TIMESTAMPDIFF(SECOND, created_at, NOW()) <= 900;
END;
//
DELIMITER ;

-- Procedura
DROP PROCEDURE IF EXISTS log_password_change;
DELIMITER //
CREATE PROCEDURE log_password_change(IN user_email VARCHAR(255))
BEGIN
  INSERT INTO register_logs(email, ip_address)
  VALUES (user_email, 'changed-password-procedure');
END;
//
DELIMITER ;

-- Trigger
DROP TRIGGER IF EXISTS log_user_delete;
DELIMITER //
CREATE TRIGGER log_user_delete
AFTER DELETE ON users
FOR EACH ROW
BEGIN
  INSERT INTO register_logs(email, ip_address)
  VALUES (OLD.email, 'deleted-user-trigger');
END;
//
DELIMITER ;
