# 免费部署指南 - 无需购买服务器

## 🎯 目标
使用免费托管平台部署，获得公网访问地址，无需购买云服务器。

---

## 方案一：Render（最推荐）⭐⭐⭐⭐⭐

### 优点
- ✅ 完全免费
- ✅ 支持定时任务（每天自动更新）
- ✅ 自动提供 HTTPS 域名
- ✅ 从中国可访问
- ✅ 自动部署（推送代码即更新）

### 缺点
- ⚠️ 15分钟无访问会休眠（首次访问需等待30秒启动）

### 部署步骤

#### 1. 准备代码仓库

首先将代码上传到 GitHub：

```bash
# 在你的项目目录
git init
git add .
git commit -m "Initial commit"

# 在 GitHub 创建仓库后
git remote add origin https://github.com/你的用户名/KYT1.git
git push -u origin main
```

#### 2. 注册 Render

访问：https://render.com
- 点击 "Get Started for Free"
- 使用 GitHub 账号登录

#### 3. 创建 Web Service

1. 点击 "New +" → "Web Service"
2. 连接你的 GitHub 仓库
3. 配置如下：

```
Name: kyt-monitor
Environment: Node
Region: Singapore (新加坡，离中国近)
Branch: main
Build Command: npm install
Start Command: npm start
```

#### 4. 配置环境变量

在 "Environment" 标签页添加：

```
USE_MOCK_DATA = false
HTTP_PROXY = (留空)
HTTPS_PROXY = (留空)
```

#### 5. 部署

点击 "Create Web Service"，等待 3-5 分钟部署完成。

#### 6. 获取访问地址

部署成功后会显示：
```
https://kyt-monitor.onrender.com
```

这就是你的公网地址！

### 配置定时任务（重要）

Render 免费版会休眠，需要配置定时 ping：

1. 在 Render 控制台，进入你的服务
2. 点击 "Cron Jobs" → "Add Cron Job"
3. 配置：
```
Name: keep-alive
Schedule: */14 * * * * (每14分钟)
Command: curl https://kyt-monitor.onrender.com
```

---

## 方案二：Railway ⭐⭐⭐⭐

### 优点
- ✅ 每月 $5 免费额度（约500小时运行时间）
- ✅ 支持定时任务
- ✅ 不会休眠
- ✅ 部署简单

### 缺点
- ⚠️ 超出免费额度需付费（但一般够用）

### 部署步骤

#### 1. 注册 Railway

访问：https://railway.app
- 使用 GitHub 登录

#### 2. 创建项目

1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择你的 KYT1 仓库

#### 3. 配置环境变量

在 "Variables" 标签页添加：

```
USE_MOCK_DATA = false
PORT = 3000
```

#### 4. 生成域名

1. 点击 "Settings"
2. 找到 "Domains"
3. 点击 "Generate Domain"

会得到类似：
```
https://kyt-monitor-production.up.railway.app
```

#### 5. 完成

Railway 会自动部署，几分钟后即可访问！

---

## 方案三：Vercel（仅手动刷新）⭐⭐⭐

### 优点
- ✅ 完全免费
- ✅ 速度极快
- ✅ 自动 HTTPS

### 缺点
- ❌ 不支持定时任务（无法每天自动更新）
- ❌ 只能手动点击刷新按钮

### 适合场景
如果你不需要自动更新，只想手动刷新查看，Vercel 是最快的选择。

### 部署步骤

#### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登录

```bash
vercel login
```

#### 3. 部署

```bash
# 在项目目录
vercel
```

按提示操作，会得到一个域名：
```
https://kyt-monitor.vercel.app
```

#### 4. 配置环境变量

```bash
vercel env add USE_MOCK_DATA
# 输入: false

vercel env add HTTP_PROXY
# 留空，直接回车

vercel env add HTTPS_PROXY
# 留空，直接回车
```

#### 5. 重新部署

```bash
vercel --prod
```

---

## 方案四：Fly.io ⭐⭐⭐⭐

### 优点
- ✅ 免费额度充足
- ✅ 支持定时任务
- ✅ 不会休眠
- ✅ 全球节点

### 部署步骤

#### 1. 安装 Fly CLI

Windows PowerShell:
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

#### 2. 注册登录

```bash
fly auth signup
# 或
fly auth login
```

#### 3. 创建配置文件

在项目根目录创建 `fly.toml`：

```toml
app = "kyt-monitor"

[build]
  builder = "heroku/buildpacks:20"

[env]
  PORT = "8080"
  USE_MOCK_DATA = "false"

[[services]]
  http_checks = []
  internal_port = 8080
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    grace_period = "1s"
    interval = "15s"
    restart_limit = 0
    timeout = "2s"
```

#### 4. 部署

```bash
fly launch
fly deploy
```

#### 5. 获取域名

```bash
fly info
```

会显示：
```
https://kyt-monitor.fly.dev
```

---

## 🎯 推荐选择

### 如果你需要自动更新：
**Render** 或 **Railway**

### 如果只需要手动刷新：
**Vercel**（最快）

### 如果需要稳定运行：
**Fly.io** 或 **Railway**

---

## 📋 对比表格

| 平台 | 免费额度 | 定时任务 | 休眠 | 速度 | 推荐度 |
|------|---------|---------|------|------|--------|
| Render | 完全免费 | ✅ | 15分钟 | 中 | ⭐⭐⭐⭐⭐ |
| Railway | $5/月 | ✅ | ❌ | 快 | ⭐⭐⭐⭐ |
| Vercel | 完全免费 | ❌ | ❌ | 极快 | ⭐⭐⭐ |
| Fly.io | 充足 | ✅ | ❌ | 快 | ⭐⭐⭐⭐ |

---

## 🔧 配置自定义域名（可选）

如果你有自己的域名（如 `kyt.example.com`）：

### Render
1. 进入服务设置
2. 点击 "Custom Domain"
3. 添加你的域名
4. 在域名服务商添加 CNAME 记录：
   ```
   kyt.example.com → kyt-monitor.onrender.com
   ```

### Railway
1. 进入 Settings → Domains
2. 点击 "Custom Domain"
3. 输入域名
4. 添加 CNAME 记录：
   ```
   kyt.example.com → kyt-monitor-production.up.railway.app
   ```

### Vercel
```bash
vercel domains add kyt.example.com
```
然后按提示配置 DNS。

---

## 🚀 快速开始（Render 示例）

### 1. 上传代码到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/KYT1.git
git push -u origin main
```

### 2. 访问 Render

https://render.com → 注册 → 连接 GitHub

### 3. 创建服务

New + → Web Service → 选择仓库 → 配置：
- Build: `npm install`
- Start: `npm start`
- Environment: 添加 `USE_MOCK_DATA=false`

### 4. 部署

点击 "Create Web Service"，等待完成。

### 5. 访问

复制提供的域名，如：
```
https://kyt-monitor.onrender.com
```

分享给任何人，无需梯子即可访问！

---

## ⚠️ 重要提示

### Render 休眠问题
免费版 15 分钟无访问会休眠，解决方案：

1. **使用 UptimeRobot 定时 ping**
   - 访问：https://uptimerobot.com
   - 添加监控：每 5 分钟 ping 一次你的网址
   - 完全免费

2. **使用 Cron-job.org**
   - 访问：https://cron-job.org
   - 创建定时任务：每 10 分钟访问一次

### 数据持久化
免费平台可能会重启，建议：
- 定期备份 `data/competitors.json`
- 或使用 GitHub Actions 自动备份

---

## 📞 需要帮助？

### Render 部署失败？
1. 检查 Build Command: `npm install`
2. 检查 Start Command: `npm start`
3. 查看 Logs 标签页的错误信息

### Railway 超出额度？
1. 查看 Usage 页面
2. 考虑升级到 Hobby 计划（$5/月）
3. 或切换到 Render

### 域名无法访问？
1. 等待 DNS 生效（最多 24 小时）
2. 检查 CNAME 记录是否正确
3. 使用 `nslookup` 验证 DNS

---

## ✅ 完成！

现在你有了一个完全免费的公网访问地址，无需购买服务器！

**推荐流程**：
1. 代码上传到 GitHub
2. 使用 Render 部署（最简单）
3. 配置 UptimeRobot 防止休眠
4. 分享域名给同事

**访问地址示例**：
```
https://kyt-monitor.onrender.com
```

从中国大陆可以直接访问，无需梯子！🎉
