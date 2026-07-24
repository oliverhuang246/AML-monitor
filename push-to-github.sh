#!/bin/bash

# 快速推送到 GitHub 的脚本

echo "=================================="
echo "推送代码到 GitHub"
echo "=================================="
echo ""

# 检查是否已经初始化 git
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    echo "✅ Git 初始化完成"
    echo ""
fi

# 添加所有文件
echo "📝 添加文件..."
git add .

# 提交
echo ""
read -p "📝 输入提交信息 (默认: Update): " commit_message
commit_message=${commit_message:-"Update"}
git commit -m "$commit_message"
echo "✅ 提交完成"
echo ""

# 检查是否已经添加远程仓库
if ! git remote | grep -q "origin"; then
    echo "🔗 添加远程仓库..."
    read -p "📝 输入 GitHub 仓库地址 (如: https://github.com/username/KYT1.git): " repo_url
    git remote add origin "$repo_url"
    echo "✅ 远程仓库添加完成"
    echo ""
fi

# 推送
echo "🚀 推送到 GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "=================================="
echo "✅ 推送完成！"
echo "=================================="
echo ""
echo "下一步："
echo "1. 访问 https://render.com"
echo "2. 使用 GitHub 登录"
echo "3. 创建 Web Service"
echo "4. 选择你的仓库"
echo "5. 等待部署完成"
echo ""
echo "详细步骤请查看: FREE_DEPLOY_GUIDE.md"
echo ""
