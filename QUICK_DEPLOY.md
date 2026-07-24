# 快速部署指南 - 获得公网访问地址

## 方案：阿里云香港服务器（推荐）

**成本**：¥24/月起
**优势**：国内外都能访问，不需要梯子

---

## 详细步骤

### 1. 购买服务器（5分钟）

1. 访问阿里云轻量应用服务器：https://www.aliyun.com/product/swas

2. 选择配置：
   ```
   地域：中国香港
   镜像：Ubuntu 20.04
   套餐：1核2G（24元/月）
   ```

3. 购买并等待创建完成

4. 在控制台找到：
   - 服务器公网 IP（如：`123.456.78.90`）
   - root 密码（或重置密码）

### 2. 上传代码（2分钟）

**方法 A：使用 FTP 工具（推荐新手）**

1. 下载 WinSCP：https://winscp.net/eng/download.php

2. 连接服务器：
   ```
   主机名：你的服务器IP
   用户名：root
   密码：你的密码
   ```

3. 上传整个 `KYT1` 文件夹到 `/root/kyt-monitor`

**方法 B：使用 Git**

如果你的代码在 GitHub：
```bash
ssh root@你的服务器IP
cd /root
git clone 你的GitHub仓库地址 kyt-monitor
```

### 3. 运行部署脚本（3分钟）

连接到服务器：

```bash
ssh root@你的服务器IP
```

运行以下命令：

```bash
# 进入项目目录
cd /root/kyt-monitor

# 给脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

脚本会自动：
- 安装 Node.js
- 安装依赖
- 配置环境
- 启动服务
- 设置开机自启

### 4. 访问网站

部署完成后，访问：

```
http://你的服务器IP:3000
```

例如：`http://123.456.78.90:3000`

---

## 手动部署（如果脚本失败）

```bash
# 1. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 2. 安装 PM2
npm install -g pm2

# 3. 进入项目目录
cd /root/kyt-monitor

# 4. 安装依赖
npm install

# 5. 创建 .env 文件
cat > .env << EOF
USE_MOCK_DATA=false
EOF

# 6. 启动服务
pm2 start server.js --name kyt-monitor
pm2 startup
pm2 save

# 7. 开放端口
ufw allow 3000
ufw allow 22
ufw --force enable
```

---

## 配置域名（可选）

如果你有域名（如 `kyt.yourdomain.com`）：

### 1. 域名解析

在域名服务商（阿里云/腾讯云）添加 A 记录：
```
主机记录：kyt
记录类型：A
记录值：你的服务器IP
```

### 2. 安装 Nginx

```bash
apt install -y nginx
```

### 3. 配置 Nginx

```bash
cat > /etc/nginx/sites-available/kyt << 'EOF'
server {
    listen 80;
    server_name kyt.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/kyt /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 4. 配置 HTTPS（可选）

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d kyt.yourdomain.com
```

现在可以通过 `https://kyt.yourdomain.com` 访问！

---

## 常用管理命令

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
cd /root/kyt-monitor
git pull  # 如果使用 Git
npm install
pm2 restart kyt-monitor
```

---

## 故障排查

### 无法访问网站？

1. **检查服务是否运行**
   ```bash
   pm2 status
   ```

2. **检查防火墙**
   ```bash
   ufw status
   # 如果端口未开放
   ufw allow 3000
   ```

3. **检查阿里云安全组**
   - 进入阿里云控制台
   - 找到你的服务器
   - 点击"安全组"
   - 添加规则：允许 TCP 3000 端口

4. **查看日志**
   ```bash
   pm2 logs kyt-monitor
   ```

### 数据抓取失败？

香港服务器可以直接访问国外网站，不需要配置代理。

如果还是失败，检查：
```bash
# 测试网络
curl https://www.google.com
```

---

## 成本说明

- **服务器**：¥24-50/月（阿里云香港轻量服务器）
- **域名**：¥50-100/年（可选）
- **总计**：约 ¥30/月

---

## 下一步

部署完成后，你会得到一个公网地址，任何人都可以访问，无需梯子！

需要帮助？随时问我！
