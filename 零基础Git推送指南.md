# 零基础 Git 推送指南

## 🎯 目标
把你电脑上的代码上传到 GitHub，然后部署到 Render。

---

## 第一步：安装 Git（5分钟）

### 1. 下载 Git

1. 打开浏览器，访问：https://git-scm.com/download/win
2. 页面会自动开始下载，文件名类似：`Git-2.43.0-64-bit.exe`
3. 等待下载完成

### 2. 安装 Git

1. 双击下载的安装包
2. 看到安装界面后，**一路点击 "Next"**（下一步）
3. 不用改任何设置，全部使用默认选项
4. 最后点击 "Install"（安装）
5. 安装完成后，点击 "Finish"（完成）

### 3. 验证安装

1. 按 `Win + X` 键
2. 选择 "Windows PowerShell"
3. 输入以下命令并按回车：
   ```powershell
   git --version
   ```
4. 如果显示版本号（如 `git version 2.43.0`），说明安装成功！

---

## 第二步：配置 Git（2分钟）

在 PowerShell 中依次输入以下命令（每行输入后按回车）：

```powershell
git config --global user.name "你的名字"
```

```powershell
git config --global user.email "你的邮箱"
```

**注意**：
- 把 `你的名字` 替换成你的真实姓名或昵称（保留引号）
- 把 `你的邮箱` 替换成你的邮箱地址（保留引号）
- 例如：
  ```powershell
  git config --global user.name "Zhang San"
  git config --global user.email "zhangsan@example.com"
  ```

---

## 第三步：在 GitHub 创建仓库（3分钟）

### 1. 注册/登录 GitHub

1. 访问：https://github.com
2. 如果没有账号，点击 "Sign up"（注册）
3. 如果有账号，点击 "Sign in"（登录）

### 2. 创建新仓库

1. 登录后，点击右上角的 "+" 号
2. 选择 "New repository"（新建仓库）
3. 填写信息：
   - **Repository name**（仓库名）：输入 `KYT1`
   - **Description**（描述）：输入 `KYT competitor monitoring`（可选）
   - **Public/Private**：选择 **Public**（公开）
   - **重要**：不要勾选任何选项（不要添加 README、.gitignore 等）
4. 点击绿色按钮 "Create repository"（创建仓库）

### 3. 复制仓库地址

创建完成后，你会看到一个页面，上面有一个地址，类似：
```
https://github.com/你的用户名/KYT1.git
```

**复制这个地址**（点击旁边的复制按钮），稍后会用到。

---

## 第四步：推送代码到 GitHub（5分钟）

### 1. 打开 PowerShell

1. 按 `Win + X` 键
2. 选择 "Windows PowerShell"

### 2. 进入项目目录

输入以下命令并按回车：
```powershell
cd C:\Users\admin\Desktop\KYT1
```

### 3. 依次执行以下命令

**命令 1：初始化 Git**
```powershell
git init
```
按回车，应该显示：`Initialized empty Git repository...`

**命令 2：添加所有文件**
```powershell
git add .
```
按回车，等待几秒（没有输出是正常的）

**命令 3：提交文件**
```powershell
git commit -m "Initial commit"
```
按回车，会显示添加了多少文件

**命令 4：添加远程仓库**
```powershell
git remote add origin https://github.com/你的用户名/KYT1.git
```
**重要**：把 `你的用户名` 替换成你的 GitHub 用户名！
例如：`git remote add origin https://github.com/zhangsan/KYT1.git`

**命令 5：设置主分支**
```powershell
git branch -M main
```
按回车

**命令 6：推送到 GitHub**
```powershell
git push -u origin main
```
按回车

### 4. 输入 GitHub 账号信息

第一次推送时，会弹出一个窗口要求登录：
1. 选择 "Sign in with your browser"（用浏览器登录）
2. 在浏览器中登录你的 GitHub 账号
3. 点击 "Authorize"（授权）
4. 回到 PowerShell，等待推送完成

### 5. 验证推送成功

推送完成后，访问你的 GitHub 仓库页面：
```
https://github.com/你的用户名/KYT1
```

应该能看到所有代码文件！

---

## 第五步：部署到 Render（5分钟）

### 1. 访问 Render

1. 打开浏览器，访问：https://render.com
2. 点击 "Get Started for Free"（免费开始）
3. 选择 "GitHub" 登录
4. 授权 Render 访问你的 GitHub

### 2. 创建 Web Service

1. 点击右上角的 "New +"
2. 选择 "Web Service"
3. 在列表中找到 `KYT1` 仓库
4. 点击右侧的 "Connect"（连接）

### 3. 配置服务

填写以下信息：

- **Name**（名称）：`kyt-monitor`（或任何你喜欢的名字）
- **Region**（地区）：选择 `Singapore`（新加坡，离中国近）
- **Branch**（分支）：`main`
- **Build Command**（构建命令）：`npm install`
- **Start Command**（启动命令）：`npm start`

### 4. 添加环境变量

1. 向下滚动，找到 "Environment Variables"（环境变量）
2. 点击 "Add Environment Variable"
3. 填写：
   - **Key**（键）：`USE_MOCK_DATA`
   - **Value**（值）：`false`
4. 再添加一个：
   - **Key**：`NODE_VERSION`
   - **Value**：`18`

### 5. 选择免费计划

1. 继续向下滚动
2. 在 "Instance Type" 中选择 **Free**（免费）

### 6. 创建服务

1. 点击底部的绿色按钮 "Create Web Service"
2. 等待 3-5 分钟部署完成

### 7. 获取访问地址

部署完成后，页面顶部会显示你的网站地址，类似：
```
https://kyt-monitor.onrender.com
```

点击这个地址，就能访问你的网站了！

---

## 第六步：配置防休眠（可选，5分钟）

Render 免费版 15 分钟无访问会休眠，配置 UptimeRobot 可以避免：

### 1. 注册 UptimeRobot

1. 访问：https://uptimerobot.com
2. 点击 "Sign Up Free"（免费注册）
3. 填写邮箱和密码
4. 验证邮箱

### 2. 添加监控

1. 登录后，点击 "+ Add New Monitor"
2. 填写：
   - **Monitor Type**：选择 `HTTP(s)`
   - **Friendly Name**：输入 `KYT Monitor`
   - **URL**：输入你的 Render 网址（如 `https://kyt-monitor.onrender.com`）
   - **Monitoring Interval**：选择 `5 minutes`
3. 点击 "Create Monitor"

完成！现在你的网站不会休眠了。

---

## ✅ 完成！

现在你有了：
- ✅ 代码已上传到 GitHub
- ✅ 网站已部署到 Render
- ✅ 获得了公网访问地址
- ✅ 配置了防休眠（可选）

### 你的网站地址
```
https://kyt-monitor.onrender.com
```
（替换成你实际的地址）

### 分享给同事
- 从中国大陆可以直接访问
- 无需梯子
- 支持 HTTPS

---

## 🔧 常见问题

### Q1: git 命令提示找不到？
**A**: 重启 PowerShell，或者重启电脑后再试。

### Q2: 推送时要求输入密码？
**A**: 现在 GitHub 不支持密码登录，会自动弹出浏览器登录窗口。

### Q3: Render 部署失败？
**A**: 
1. 检查 Build Command 是否为 `npm install`
2. 检查 Start Command 是否为 `npm start`
3. 查看 Logs 标签页的错误信息

### Q4: 网站打不开？
**A**: 
1. 等待部署完全完成（3-5分钟）
2. 检查 Render 页面是否显示 "Live"（运行中）
3. 首次访问可能需要等待 30 秒启动

### Q5: 如何更新代码？
**A**: 
```powershell
cd C:\Users\admin\Desktop\KYT1
git add .
git commit -m "Update"
git push
```
Render 会自动重新部署。

---

## 📞 需要帮助？

如果遇到问题：
1. 截图错误信息
2. 检查每一步是否按照指南操作
3. 重新阅读对应步骤

---

## 🎉 恭喜！

你已经成功完成了从零到部署的全过程！

**下一步**：
- 分享网址给同事
- 定期查看竞品动态
- 享受你的监控平台

**祝使用愉快！** 🚀
