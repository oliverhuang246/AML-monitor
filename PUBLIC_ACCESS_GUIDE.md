# 公网访问部署指南

## 目标：让别人不用梯子也能访问你的网站

---

## 🎯 推荐方案：阿里云香港服务器

**为什么选择香港服务器？**
- ✅ 从中国大陆访问无需梯子
- ✅ 可以访问国外网站（Twitter、RSS等）
- ✅ 延迟低（20-50ms）
- ✅ 价格便宜（¥24/月起）

---

## 📋 详细部署步骤

### 第一步：购买服务器

1. **访问阿里云轻量应用服务器**
   - 网址：https://www.aliyun.com/product/swas
   - 或搜索"阿里云轻量服务器"

2. **选择配置**
   - 地域：**香港** （重要！）
   - 镜像：Ubuntu 20.04 或 22.04
   - 套餐：1核2G（¥24/月）或 2核2G（¥34/月）
   - 流量：30GB/月 足够使用

3. **完成购买**
   - 设置服务器密码（记住这个密码）
   - 等待服务器创建完成（约1-2分钟）

---

### 第二步：连接服务器

#### 方法A：使用阿里云网页终端（推荐新手）

1. 登录阿里云控制台
2. 找到你的服务器
3. 点击"远程连接" → "Workbench远程连接"
4. 输入用户名 `root` 和你设置的密码

#### 方法B：使用本地终端

Windows PowerShell：
```powershell
ssh root@你的服务器IP
# 输入密码
```

---

### 第三步：安装环境

复制粘贴以下命令（一次一行）：

```bash
# 1. 更新系统
apt update && apt upgrade -y

# 2. 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 3. 验证安装
node -v
npm -v

# 4. 安装 PM2（进程管理器）
npm install -g pm2

# 5. 安装 Git
apt install -y git
```

---

### 第四步：上传代码

#### 方法A：使用 Git（推荐）

如果你的代码在 GitHub/Gitee：
```bash
cd /root
git clone 你的仓库地址
cd KYT1
```

#### 方法B：手动上传

1. 在本地打包项目：
   ```powershell
   # 在你的项目目录
   tar -czf kyt.tar.gz --exclude=node_modules .
   ```

2. 使用 WinSCP 或 FileZilla 上传到服务器 `/root/KYT1`

3. 在服务器解压：
   ```bash
   cd /root
   mkdir KYT1
   cd KYT1
   tar -xzf ../kyt.tar.gz
   ```

---

### 第五步：配置项目

```bash
# 1. 安装依赖
npm install

# 2. 创建环境变量文件
nano .env
```

输入以下内容：
```
USE_MOCK_DATA=false
HTTP_PROXY=
HTTPS_PROXY=
```

按 `Ctrl+X`，然后 `Y`，然后 `Enter` 保存

**注意**：香港服务器可以直接访问国外网站，不需要代理！

---

### 第六步：启动服务

```bash
# 使用 PM2 启动
pm2 start server.js --name kyt-monitor

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs kyt-monitor
```

---

### 第七步：配置防火墙

在阿里云控制台：

1. 进入服务器管理页面
2. 点击"防火墙"
3. 添加规则：
   - 应用类型：自定义
   - 协议：TCP
   - 端口：3000
   - 策略：允许

---

### 第八步：访问网站

你的网站地址：`http://你的服务器IP:3000`

例如：`http://47.52.123.45:3000`

**测试访问**：
- 在浏览器打开这个地址
- 分享给同事/朋友测试

---

## 🌐 可选：绑定域名

如果你有域名（如 `kyt.example.com`）：

### 1. 域名解析

在域名服务商（阿里云、腾讯云等）：
- 添加 A 记录
- 主机记录：`kyt` 或 `@`
- 记录值：你的服务器IP

### 2. 安装 Nginx

```bash
apt install -y nginx
```

### 3. 配置 Nginx

```bash
nano /etc/nginx/sites-available/kyt
```

输入：
```nginx
server {
    listen 80;
    server_name kyt.example.com;  # 改成你的域名

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置：
```bash
ln -s /etc/nginx/sites-available/kyt /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 4. 配置 HTTPS（可选）

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d kyt.example.com
```

现在可以通过 `https://kyt.example.com` 访问！

---

## 🔧 常用管理命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs kyt-monitor

# 重启服务
pm2 restart kyt-monitor

# 停止服务
pm2 stop kyt-monitor

# 更新代码后重启
cd /root/KYT1
git pull  # 如果使用 Git
npm install
pm2 restart kyt-monitor

# 查看服务器资源使用
pm2 monit
```

---

## 💰 成本估算

| 项目 | 费用 |
|------|------|
| 阿里云香港服务器 1核2G | ¥24/月 |
| 域名（可选） | ¥50-100/年 |
| **总计** | **¥24/月** |

---

## 🔒 安全建议

### 1. 修改 SSH 端口

```bash
nano /etc/ssh/sshd_config
# 找到 #Port 22，改为 Port 2222
systemctl restart sshd
```

### 2. 添加访问密码

安装认证：
```bash
npm install express-basic-auth
```

修改 `server.js`，在 `app.use(express.static('public'));` 之前添加：
```javascript
const basicAuth = require('express-basic-auth');

app.use(basicAuth({
  users: { 'admin': 'your-password-here' },
  challenge: true,
  realm: 'KYT Monitor'
}));
```

重启服务：
```bash
pm2 restart kyt-monitor
```

### 3. 定期备份

```bash
# 创建备份脚本
nano /root/backup.sh
```

内容：
```bash
#!/bin/bash
tar -czf /root/backup-$(date +%Y%m%d).tar.gz /root/KYT1/data
find /root/backup-*.tar.gz -mtime +7 -delete
```

设置定时任务：
```bash
chmod +x /root/backup.sh
crontab -e
# 添加：每天凌晨2点备份
0 2 * * * /root/backup.sh
```

---

## ❓ 常见问题

### Q1: 无法访问服务器？
**A:** 检查：
1. 防火墙是否开放 3000 端口
2. 服务是否正在运行：`pm2 status`
3. 服务器 IP 是否正确

### Q2: 数据抓取失败？
**A:** 香港服务器可以直接访问国外网站，确保：
1. `.env` 文件中代理设置为空
2. 查看日志：`pm2 logs kyt-monitor`

### Q3: 服务器重启后服务停止？
**A:** 确保执行了：
```bash
pm2 startup
pm2 save
```

### Q4: 如何更新代码？
**A:** 
```bash
cd /root/KYT1
git pull
npm install
pm2 restart kyt-monitor
```

### Q5: 内存不足？
**A:** 1核2G 足够使用。如果不够，可以升级到 2核4G（¥50/月）

---

## 📞 需要帮助？

如果遇到问题：
1. 查看日志：`pm2 logs kyt-monitor`
2. 检查服务状态：`pm2 status`
3. 重启服务：`pm2 restart kyt-monitor`

---

## 🎉 完成！

现在你的网站已经可以公开访问了！

- 访问地址：`http://你的服务器IP:3000`
- 无需梯子，从中国大陆直接访问
- 24小时运行，自动更新数据

分享给你的同事和朋友吧！
