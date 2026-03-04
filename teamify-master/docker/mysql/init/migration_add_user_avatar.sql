-- 为 t_user 添加 u_avatar 字段（幂等，可重复执行）
-- 已有数据库需手动执行：docker exec -i mysql-server mysql -uroot -proot123 form_team_talent < docker/mysql/init/migration_add_user_avatar.sql

USE form_team_talent;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='form_team_talent' AND TABLE_NAME='t_user' AND COLUMN_NAME='u_avatar');
SET @sql = IF(@col_exists=0, 'ALTER TABLE t_user ADD COLUMN u_avatar VARCHAR(512)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
