# 推送代码到 GitHub - 手动步骤

## 第一步：在 GitHub 创建仓库

1. 访问 https://github.com/new
2. 填写信息：
   - Repository name: `KYT1`
   - Description: `KYT competitor monitoring platform`
   - 选择 `Public`（公开）
   - **不要勾选** "Add a README file"
   - **不要勾选** "Add .gitignore"
   - **不要勾选** "Choose a license"
3. 点击 "Create repository"
4. 复制仓库地址（如：`https://github.com/你的用户名/KYT1.git`）

---

## 第二步：推送代码

在你的项目目录（`C:\Users\admin\Desktop\KYT1`）打开 PowerShell，依次运行：

### 1. 初始化 Git（如果还没有）

```powershell
git init
```

### 2. 添加所有文件

```powershell
git add .
```

### 3. 提交

```powershell
git commit -m "Initial commit"
```

### 4. 添加远程仓库

```powershell
git remote add origin https://github.com/你的用户名/KYT1.git
```

**注意**：把 `你的用户名` 替换成你的 GitHub 用户名！

### 5. 推送到 GitHub

```powershell
git branch -M main
git push -u origin main
```

如果提示输入用户名和密码：
- Username: 你的 GitHub 用户名
- Password: 使用 Personal Access Token（不是密码）

---

## 如何获取 Personal Access Token

如果推送时需要密码，需要创建 Token：

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 填写：
   - Note: `KYT1 Deploy`
   - Expiration: `No expiration`
   - 勾选 `repo` (所有子选项)
4. 点击 "Generate token"
5. **复制 Token**（只显示一次，保存好）
6. 推送时用这个 Token 作为密码

---

## 第三步：验证

推送成功后，访问你的 GitHub 仓库页面：
```
https://github.com/你的用户名/KYT1
```

应该能看到所有代码文件。

---

## 完整命令（复制粘贴）

```powershell
# 1. 初始化
git init

# 2. 添加文件
git add .

# 3. 提交
git commit -m "Initial commit"

# 4. 添加远程仓库（替换你的用户名）
git remote add origin https://github.com/你的用户名/KYT1.git

# 5. 推送
git branch -M main
git push -u origin main
```

---

## 常见问题

### Q: 提示 "fatal: remote origin already exists"

**解决**：
```powershell
git remote remove origin
git remote add origin https://github.com/你的用户名/KYT1.git
```

### Q: 提示 "fatal: not a git repository"

**解决**：
```powershell
git init
```

### Q: 推送失败，提示认证错误

**解决**：使用 Personal Access Token 而不是密码

### Q: 提示 "Updates were rejected"

**解决**：
```powershell
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

## 下一步

代码推送成功后，继续部署到 Render：

查看：[FREE_DEPLOY_GUIDE.md](FREE_DEPLOY_GUIDE.md) 的 "方案一：Render" 部分
