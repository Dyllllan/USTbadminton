-- 为已有数据库添加活动新字段（幂等，可重复执行）
-- 新安装时 init.sql 已包含这些列，本脚本会检测并跳过
-- 已有数据库需手动执行：docker exec -i mysql-server mysql -uroot -proot123 < docker/mysql/init/migration_add_activity_fields.sql

USE form_team_talent;

-- a_venue
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='form_team_talent' AND TABLE_NAME='t_activity' AND COLUMN_NAME='a_venue');
SET @sql = IF(@col_exists=0, 'ALTER TABLE t_activity ADD COLUMN a_venue VARCHAR(255)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- a_level
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='form_team_talent' AND TABLE_NAME='t_activity' AND COLUMN_NAME='a_level');
SET @sql = IF(@col_exists=0, 'ALTER TABLE t_activity ADD COLUMN a_level VARCHAR(64)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- a_date
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='form_team_talent' AND TABLE_NAME='t_activity' AND COLUMN_NAME='a_date');
SET @sql = IF(@col_exists=0, 'ALTER TABLE t_activity ADD COLUMN a_date VARCHAR(128)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- a_time_slot
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='form_team_talent' AND TABLE_NAME='t_activity' AND COLUMN_NAME='a_time_slot');
SET @sql = IF(@col_exists=0, 'ALTER TABLE t_activity ADD COLUMN a_time_slot VARCHAR(128)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- a_count
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='form_team_talent' AND TABLE_NAME='t_activity' AND COLUMN_NAME='a_count');
SET @sql = IF(@col_exists=0, 'ALTER TABLE t_activity ADD COLUMN a_count INT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- a_need_approve
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='form_team_talent' AND TABLE_NAME='t_activity' AND COLUMN_NAME='a_need_approve');
SET @sql = IF(@col_exists=0, 'ALTER TABLE t_activity ADD COLUMN a_need_approve INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
