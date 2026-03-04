-- 邮箱认证字段迁移（已有数据库执行此脚本）
USE form_team_talent;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA='form_team_talent' AND TABLE_NAME='t_user' AND COLUMN_NAME='u_email');
SET @sql := IF(@col_exists=0, 
  'ALTER TABLE t_user ADD COLUMN u_email VARCHAR(255) NULL AFTER u_avatar, ADD COLUMN u_email_verified INT DEFAULT 0 AFTER u_email', 
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
