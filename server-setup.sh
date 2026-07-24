#!/bin/bash

# KYT 竞品监控平台 - 服务器一键部署脚本
# 适用于 Ubuntu 20.04/22.04

set -e

echo "=================================="
echo "KYT 竞品监控平台 - 服务器部署"
echo "=================================="
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
  echo "❌ 请使用 root 用户运行此脚本"
  echo "   使用命令: sudo bash server-setup.sh"
  exit 1
fi

echo "📦 步骤 1/6: 更新系统..."
apt update && apt upgrade -y

echo ""
echo "📦 步骤 2/6: 安装 Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    echo "✅ Node.js 安装完成: $(node -v)"
else
    echo "✅ Node.js 已安装: $(node -v)"
fi

echo ""
echo "📦 步骤 3/6: 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "✅ PM2 安装完成"
else
    echo "✅ PM2 已安装"
fi

echo ""
echo "📦 步骤 4/6: 安装项目依赖..."
if [ -f "package.json" ]; then
    npm install
    echo "✅ 依赖安装完成"
else
    echo "❌ 未找到 package.json，请确保在项目目录运行此脚本"
    exit 1
fi

echo ""
echo "📦 步骤 5/6: 配置环境变量..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
# 数据模式：false=真实抓取，true=模拟数据
USE_MOCK_DATA=false

# 代理配置（香港服务器不需要代理，留空即可）
HTTP_PROXY=
HTTPS_PROXY=
EOF
    echo "✅ .env 文件创建完成"
else
    echo "✅ .env 文件已存在"
fi

echo ""
echo "📦 步骤 6/6: 启动服务..."

# 停止旧服务（如果存在）
pm2 delete kyt-monitor 2>/dev/null || true

# 启动新服务
pm2 start server.js --name kyt-monitor

# 设置开机自启
pm2 startup systemd -u root --hp /root
pm2 save

echo ""
echo "=================================="
echo "✅ 部署完成！"
echo "=================================="
echo ""
echo "📊 服务信息："
echo "   名称: kyt-monitor"
echo "   端口: 3000"
echo ""
echo "🌐 访问地址："
SERVER_IP=$(curl -s ifconfig.me)
echo "   http://$SERVER_IP:3000"
echo ""
echo "📝 常用命令："
echo "   查看状态: pm2 status"
echo "   查看日志: pm2 logs kyt-monitor"
echo "   重启服务: pm2 restart kyt-monitor"
echo "   停止服务: pm2 stop kyt-monitor"
echo ""
echo "⚠️  重要提示："
echo "   1. 请在阿里云控制台开放 3000 端口"
echo "   2. 防火墙 → 添加规则 → TCP → 3000"
echo ""
echo "🎉 现在可以访问你的网站了！"
echo ""
