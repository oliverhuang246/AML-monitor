# 部署指南 - 让别人访问你的网站

## 方案 1：局域网访问（内网共享）

适合：公司内部、家庭网络

### 步骤：

1. **查看你的 IP 地址**

```powershell
ipconfig
```

找到 "IPv4 地址"，例如：`192.168.1.100`

2. **启动服务**

```bash
npm start
```

3. **配置防火墙**

允许端口 3000：

```powershell
# 以管理员身份运行 PowerShell
netsh advfirewall firewall add rule name="KYT Monitor" dir=in action=allow protocol=TCP localport=3000
```

4. **分享访问地址**

告诉同事访问：`http://192.168.1.100:3000`

**优点**：简单、免费、快速
**缺点**：只能内网访问，电脑关机就无法访问

---

## 方案 2：云服务器部署（推荐）

适合：需要外网访问、24小时运行

### 2.1 使用阿里云/腾讯云轻量服务器

**成本**：约 ¥24-50/月

#### 步骤：

1. **购买服务器**
   - 阿里云轻量应用服务器：https://www.aliyun.com/product/swas
   - 选择：香港/新加坡节点（可访问国外网站）
   - 配置：1核2G 即可

2. **连接服务器**

```bash
ssh root@你的服务器IP
```

3. **安装 Node.js**

```bash
# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

4. **上传代码**

方法 A：使用 Git
```bash
# 在服务器上
git clone 你的代码仓库地址
cd KYT1
npm install
```

方法 B：使用 FTP 工具（如 FileZilla）上传整个项目文件夹

5. **配置环境变量**

```bash
nano .env
```

填入：
```
USE_MOCK_DATA=false
HTTP_PROXY=http://127.0.0.1:10090
HTTPS_PROXY=http://127.0.0.1:10090
```

6. **使用 PM2 保持运行**

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name kyt-monitor

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs kyt-monitor
```

7. **配置域名（可选）**

如果有域名，配置 Nginx 反向代理：

```bash
sudo apt install nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/kyt
```

内容：
```nginx
server {
    listen 80;
    server_name 你的域名.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/kyt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

8. **访问网站**

- 通过 IP：`http://你的服务器IP:3000`
- 通过域名：`http://你的域名.com`

---

## 方案 3：免费托管平台

### 3.1 Vercel（免费，但有限制）

**限制**：无法运行定时任务，只能手动刷新

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel
```

### 3.2 Railway（免费额度）

**免费额度**：每月 $5 额度

1. 访问 https://railway.app
2. 用 GitHub 登录
3. 导入你的项目
4. 自动部署

---

## 方案 4：内网穿透（临时方案）

适合：临时演示、测试

### 使用 ngrok

1. **下载 ngrok**：https://ngrok.com/download

2. **启动服务**

```bash
npm start
```

3. **启动 ngrok**

```bash
ngrok http 3000
```

4. **获取公网地址**

ngrok 会显示一个临时地址，如：`https://abc123.ngrok.io`

**优点**：快速、无需服务器
**缺点**：临时地址、免费版有限制

---

## 推荐方案对比

| 方案 | 成本 | 难度 | 适用场景 |
|------|------|------|----------|
| 局域网访问 | 免费 | ⭐ | 公司内部使用 |
| 云服务器 | ¥24-50/月 | ⭐⭐⭐ | 正式运营 |
| Vercel/Railway | 免费 | ⭐⭐ | 个人使用 |
| ngrok | 免费 | ⭐ | 临时演示 |

---

## 安全建议

1. **添加访问密码**

可以添加简单的 HTTP Basic Auth：

```bash
npm install express-basic-auth
```

修改 `server.js`：
```javascript
const basicAuth = require('express-basic-auth');

app.use(basicAuth({
  users: { 'admin': 'your-password' },
  challenge: true
}));
```

2. **使用 HTTPS**

如果有域名，使用 Let's Encrypt 免费证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名.com
```

3. **限制访问 IP**

在 Nginx 中配置：
```nginx
allow 192.168.1.0/24;  # 允许内网
deny all;  # 拒绝其他
```

---

## 常见问题

### Q: 服务器重启后服务停止了？
A: 使用 PM2 的 `pm2 startup` 命令设置开机自启

### Q: 无法访问外网数据源？
A: 确保服务器在香港/新加坡等节点，或配置代理

### Q: 如何更新代码？
A: 
```bash
git pull
npm install
pm2 restart kyt-monitor
```

### Q: 如何查看日志？
A: `pm2 logs kyt-monitor`

---

需要帮助？根据你的需求选择合适的方案，我可以提供详细指导！
