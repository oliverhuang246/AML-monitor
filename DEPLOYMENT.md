# 部署指南

## 国内网络环境解决方案

由于目标网站（Twitter、国外公司网站）在国内无法直接访问，有以下几种解决方案：

### 方案 1：使用模拟数据（当前默认）

适合快速测试和演示：

```bash
# 默认已启用模拟数据
npm start
```

### 方案 2：配置代理

如果你有代理服务（VPN/梯子）：

1. 安装额外依赖：
```bash
npm install https-proxy-agent
```

2. 创建 `.env` 文件：
```bash
USE_MOCK_DATA=false
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

3. 修改 `server.js` 第 9 行：
```javascript
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';
```

4. 启动服务：
```bash
npm start
```

### 方案 3：部署到海外服务器（推荐生产环境）

#### 3.1 使用 Railway（免费）

1. 注册 [Railway.app](https://railway.app)
2. 连接 GitHub 仓库
3. 设置环境变量：`USE_MOCK_DATA=false`
4. 自动部署

#### 3.2 使用 Vercel（免费）

```bash
npm install -g vercel
vercel
```

#### 3.3 使用阿里云/腾讯云海外服务器

选择香港/新加坡节点，直接部署：

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name kyt-monitor

# 设置开机自启
pm2 startup
pm2 save
```

### 方案 4：使用 RSS 聚合服务

使用第三方 RSS 聚合服务（如 Feedly API、RSSHub）：

1. 注册 [RSSHub](https://docs.rsshub.app/)
2. 使用 RSSHub 路由获取 Twitter 等内容
3. 修改 `config.js` 中的 RSS 地址

示例：
```javascript
{
  name: 'Chainalysis',
  rss: 'https://rsshub.app/twitter/user/chainalysis',
  category: '区块链分析'
}
```

## 推荐方案对比

| 方案 | 成本 | 难度 | 数据真实性 | 稳定性 |
|------|------|------|-----------|--------|
| 模拟数据 | 免费 | ⭐ | ❌ | ⭐⭐⭐⭐⭐ |
| 本地代理 | 代理费用 | ⭐⭐ | ✅ | ⭐⭐⭐ |
| 海外服务器 | $5-20/月 | ⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| RSS聚合 | 免费 | ⭐⭐ | ✅ | ⭐⭐⭐⭐ |

## 生产环境建议

1. **初期测试**：使用模拟数据
2. **小规模使用**：Railway/Vercel 免费部署
3. **正式运营**：阿里云香港服务器 + RSSHub
