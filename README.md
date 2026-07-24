# KYT 竞品监控平台

实时监控 KYT/区块链分析领域竞品动态的轻量级平台。

## 🎯 功能特点

- 📡 自动抓取竞品更新（RSS、Twitter、官网）
- 🇨🇳 智能中文摘要（200+ 关键词翻译）
- ⏰ 定时更新（每天早上8点）
- 🔄 手动刷新功能
- 📅 数据保留（最近7天）
- 🎨 简洁的卡片式界面

## 📊 监控竞品

- Chainalysis - 区块链分析
- Elliptic - 区块链分析
- TRM Labs - 区块链分析
- Flashpoint - 威胁情报
- DarkBlue Intelligence - OSINT
- StealthMole - 暗网监测

## 🚀 快速开始

### 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（如需代理）
cp .env.example .env
# 编辑 .env 文件

# 3. 启动服务
npm start

# 4. 访问网站
# 打开浏览器访问 http://localhost:3000
```

### 公网部署

#### 方案一：免费托管（推荐）⭐

完全免费，无需购买服务器！

```bash
# 1. 推送到 GitHub
.\push-to-github.ps1

# 2. 访问 https://render.com 部署
# 3. 配置 https://uptimerobot.com 防休眠
```

详细步骤：[QUICK_START.md](QUICK_START.md) | [FREE_DEPLOY_GUIDE.md](FREE_DEPLOY_GUIDE.md)

#### 方案二：云服务器（稳定）

阿里云/腾讯云香港服务器（¥24/月）

```bash
# 在服务器上运行
bash server-setup.sh
```

详细步骤：[PUBLIC_ACCESS_GUIDE.md](PUBLIC_ACCESS_GUIDE.md)

## 📁 项目结构

```
KYT1/
├── server.js              # 服务器主文件
├── config.js              # 竞品配置
├── package.json           # 项目依赖
├── .env                   # 环境变量
├── public/                # 前端文件
│   ├── index.html
│   ├── app.js
│   └── style.css
├── scripts/               # 数据抓取脚本
│   ├── fetchData.js       # 主抓取逻辑
│   ├── fetchWithProxy.js  # 代理配置
│   └── mockData.js        # 模拟数据
└── data/                  # 数据存储
    └── competitors.json
```

## ⚙️ 配置说明

### 环境变量 (.env)

```bash
# 数据模式
USE_MOCK_DATA=false        # false=真实抓取，true=模拟数据

# 代理配置（国内需要）
HTTP_PROXY=http://127.0.0.1:10090
HTTPS_PROXY=http://127.0.0.1:10090
```

### 更新设置 (config.js)

```javascript
// 更新时间：每天早上8点（UTC+8）
updateInterval: '0 0 * * *'

// 数据保留：最近7天
dataRetentionDays: 7
```

## 📖 文档

- [快速开始](QUICK_START.md) - 3步免费部署（推荐新手）
- [免费部署指南](FREE_DEPLOY_GUIDE.md) - Render/Railway/Vercel 等免费平台
- [公网部署指南](PUBLIC_ACCESS_GUIDE.md) - 阿里云/腾讯云服务器部署
- [快速部署指南](QUICK_DEPLOY.md) - 各种部署方案对比
- [完整部署指南](DEPLOYMENT_GUIDE.md) - 包含域名、HTTPS等高级配置
- [代理设置指南](PROXY_SETUP.md) - 国内网络代理配置
- [更新计划说明](SCHEDULE_INFO.md) - 定时任务和数据保留策略

## 🔧 常用命令

```bash
# 开发模式
npm start

# 使用 PM2 运行（生产环境）
pm2 start server.js --name kyt-monitor
pm2 status
pm2 logs kyt-monitor
pm2 restart kyt-monitor

# 手动抓取数据
node scripts/fetchData.js
```

## 🌐 API 接口

```bash
# 获取所有竞品数据
GET /api/competitors

# 手动触发更新
POST /api/refresh
```

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 JavaScript + CSS
- **数据抓取**: axios + cheerio + rss-parser
- **定时任务**: node-cron
- **进程管理**: PM2

## 📝 更新日志

### v1.0.0 (2026-02-25)

- ✅ 基础功能实现
- ✅ 6家竞品监控
- ✅ 智能中文摘要（200+ 词汇翻译）
- ✅ 定时自动更新
- ✅ 代理支持
- ✅ 过滤转发/回复/Thread
- ✅ 7天数据保留
- ✅ 公网部署支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 💡 提示

- 香港服务器可直接访问国外网站，无需配置代理
- 国内服务器需要配置代理才能抓取 Twitter 等数据
- 建议使用 PM2 管理进程，确保服务稳定运行
- 定期查看日志，监控数据抓取状态

## 📞 支持

如有问题，请查看文档或提交 Issue。
