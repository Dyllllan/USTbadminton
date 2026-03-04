#!/bin/bash
# 为已有 Docker 数据库执行迁移（添加活动新字段）
# 用法：在项目根目录执行 ./docker/mysql/run-migration.sh

cd "$(dirname "$0")/../.."
docker exec -i mysql-server mysql -uroot -proot123 < docker/mysql/init/migration_add_activity_fields.sql
echo "迁移执行完成"
