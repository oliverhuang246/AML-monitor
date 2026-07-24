#!/bin/bash

echo "🚀 开始部署 KYT 竞品监控平台..."

# 1. 更新系统
echo "📦 更新系统..."
apt update && apt upgrade -y

# 2. 安装 Node.js 18
echo "📦 安装 Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 3. 安装 PM2
echo "📦 安装 PM2..."
npm install -g pm2

# 4. 安装 Git
echo "📦 安装 Git..."
apt install -y git

# 5. 克隆或上传代码
echo "📁 准备代码..."
cd /root
# 如果你有 Git 仓库，取消下面这行的注释并填入你的仓库地址
# git clone 你的仓库地址 kyt-monitor

# 如果没有 Git 仓库，需要手动上传代码到 /root/kyt-monitor

# 6. 安装依赖
echo "📦 安装项目依赖..."
cd /root/kyt-monitor
npm install

# 7. 配置环境变量
echo "⚙️  配置环境变量..."
cat > .env << EOF
USE_MOCK_DATA=false
EOF

# 8. 启动服务
echo "🚀 启动服务..."
pm2 start server.js --name kyt-monitor
pm2 startup
pm2 save

# 9. 配置防火墙
echo "🔒 配置防火墙..."
ufw allow 3000
ufw allow 22
ufw --force enable

echo "✅ 部署完成！"
echo ""
echo "🌐 访问地址: http://$(curl -s ifconfig.me):3000"
echo ""
echo "📝 常用命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs kyt-monitor"
echo "  重启服务: pm2 restart kyt-monitor"
echo "  停止服务: pm2 stop kyt-monitor"
