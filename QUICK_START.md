# 🚀 快速开始 - 3步免费部署

## 目标
3个步骤，10分钟内完成免费部署，获得公网访问地址。

---

## 📋 准备工作

1. **GitHub 账号** - 如果没有，访问 https://github.com 注册
2. **Git 安装** - 检查是否安装：
   ```bash
   git --version
   ```
   如果没有，访问 https://git-scm.com/downloads 下载安装

---

## 🎯 三步部署

### 第一步：上传代码到 GitHub（5分钟）

#### 方法A：使用自动脚本（推荐）

Windows PowerShell:
```powershell
.\push-to-github.ps1
```

按提示操作：
1. 输入提交信息（直接回车使用默认）
2. 输入 GitHub 仓库地址

#### 方法B：手动操作

1. **在 GitHub 创建仓库**
   - 访问 https://github.com/new
   - 仓库名：`KYT1`
   - 设置为 Public
   - 不要勾选任何初始化选项
   - 点击 "Create repository"

2. **推送代码**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/KYT1.git
   git branch -M main
   git push -u origin main
   ```

---

### 第二步：部署到 Render（3分钟）

1. **访问 Render**
   - 打开 https://render.com
   - 点击 "Get Started for Free"
   - 使用 GitHub 账号登录

2. **创建服务**
   - 点击 "New +" → "Web Service"
   - 选择你的 `KYT1` 仓库
   - 点击 "Connect"

3. **配置服务**
   ```
   Name: kyt-monitor
   Environment: Node
   Region: Singapore
   Branch: main
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

4. **添加环境变量**
   - 点击 "Advanced"
   - 添加环境变量：
     ```
     USE_MOCK_DATA = false
     ```

5. **部署**
   - 点击 "Create Web Service"
   - 等待 3-5 分钟部署完成

---

### 第三步：配置防休眠（2分钟）

Render 免费版 15 分钟无访问会休眠，需要定时 ping：

1. **访问 UptimeRobot**
   - 打开 https://uptimerobot.com
   - 注册免费账号

2. **添加监控**
   - 点击 "+ Add New Monitor"
   - Monitor Type: HTTP(s)
   - Friendly Name: KYT Monitor
   - URL: 你的 Render 域名（如 `https://kyt-monitor.onrender.com`）
   - Monitoring Interval: 5 minutes
   - 点击 "Create Monitor"

---

## ✅ 完成！

现在你的网站已经部署完成！

### 访问地址
```
https://kyt-monitor.onrender.com
```
（替换为你实际的域名）

### 分享给同事
- 从中国大陆可以直接访问
- 无需梯子
- 支持 HTTPS

### 功能确认
- ✅ 每天早上 8 点自动更新数据
- ✅ 可以手动点击"刷新动态"按钮
- ✅ 显示最近 7 天的更新
- ✅ 智能中文摘要

---

## 🔧 后续操作

### 更新代码

当你修改代码后：

```bash
git add .
git commit -m "更新说明"
git push
```

Render 会自动重新部署（约 2-3 分钟）。

### 查看日志

在 Render 控制台：
- 进入你的服务
- 点击 "Logs" 标签
- 查看实时日志

### 重启服务

如果服务出现问题：
- 在 Render 控制台
- 点击 "Manual Deploy" → "Clear build cache & deploy"

---

## 📊 其他免费平台

如果 Render 不满意，还可以尝试：

### Railway（推荐度：⭐⭐⭐⭐）
- 每月 $5 免费额度
- 不会休眠
- 部署更简单

**快速部署**：
1. 访问 https://railway.app
2. 用 GitHub 登录
3. New Project → Deploy from GitHub
4. 选择仓库 → Deploy

### Fly.io（推荐度：⭐⭐⭐⭐）
- 免费额度充足
- 全球节点
- 性能好

**快速部署**：
```bash
# 安装 CLI
iwr https://fly.io/install.ps1 -useb | iex

# 登录
fly auth login

# 部署
fly launch
```

---

## ❓ 常见问题

### Q: 首次访问很慢？
A: Render 免费版休眠后首次访问需要 30 秒启动，之后就快了。配置 UptimeRobot 可以避免休眠。

### Q: 数据抓取失败？
A: 
1. 查看 Render 日志
2. 某些网站有反爬虫，偶尔失败正常
3. 等待下次自动更新（每天早上 8 点）

### Q: 如何绑定自己的域名？
A: 
1. 在 Render 服务设置中点击 "Custom Domain"
2. 添加你的域名
3. 在域名服务商添加 CNAME 记录

### Q: 免费额度够用吗？
A: 
- Render: 完全免费，够用
- Railway: $5/月额度，一般够用
- 如果不够，考虑升级或使用多个平台

### Q: 从中国访问慢？
A: 
- Render Singapore 节点延迟约 100-200ms
- 可以考虑使用 CDN 加速
- 或者购买腾讯云香港服务器（¥24/月）

---

## 💡 提示

1. **GitHub 仓库设置为 Public**
   - 免费托管平台通常只支持公开仓库
   - 如果需要私有，考虑付费计划

2. **定期查看日志**
   - 确保数据抓取正常
   - 及时发现问题

3. **备份数据**
   - 定期下载 `data/competitors.json`
   - 或使用 GitHub Actions 自动备份

4. **监控运行状态**
   - 使用 UptimeRobot 监控
   - 设置邮件通知

---

## 📞 需要帮助？

- 详细部署指南：[FREE_DEPLOY_GUIDE.md](FREE_DEPLOY_GUIDE.md)
- 腾讯云部署：[PUBLIC_ACCESS_GUIDE.md](PUBLIC_ACCESS_GUIDE.md)（将阿里云改为腾讯云即可）
- 项目说明：[README.md](README.md)

---

## 🎉 恭喜！

你已经成功部署了一个免费的竞品监控平台！

**下一步**：
- 分享访问地址给同事
- 定期查看竞品动态
- 根据需要调整配置

**享受你的监控平台吧！** 🚀
