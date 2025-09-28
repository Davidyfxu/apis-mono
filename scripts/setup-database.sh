#!/bin/bash

# 设置数据库迁移脚本
echo "Setting up reports database..."

# 运行本地迁移
echo "Running local migrations..."
wrangler d1 migrations apply reports-db --local

# 运行生产环境迁移
echo "Running production migrations..."
wrangler d1 migrations apply reports-db

echo "Database setup complete!"
