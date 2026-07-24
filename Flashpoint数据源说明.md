# Flashpoint 数据源说明

## 当前状况

Flashpoint 显示 0 条数据的原因：

### 1. RSS Feed 被保护
- Flashpoint 的 RSS feed (`https://flashpoint.io/blog/feed/`) 可能有反爬虫保护
- 返回 403 Forbidden 或需要特殊认证

### 2. Twitter 抓取失败
- 使用 Nitter 镜像抓取 Twitter
- 可能因为网络问题或镜像不稳定导致失败

### 3. 网站动态加载
- Flashpoint 博客使用 JavaScript 动态加载内容
- 简单的 HTTP 请求无法获取实际文章列表

---

## 解决方案

### 方案一：依赖 Twitter（推荐）

Flashpoint 的 Twitter 账号 (@FlashpointIntel) 很活跃，建议：

1. **确保代理配置正确**
   - 检查 `.env` 文件中的代理设置
   - 如果在香港服务器，不需要代理

2. **等待下次自动更新**
   - 每天早上 8 点自动抓取
   - Twitter 数据通常比较稳定

### 方案二：手动添加 RSS 源

如果 Flashpoint 有其他 RSS 源，可以添加：

```javascript
{
  name: 'Flashpoint',
  // 尝试其他可能的 RSS 地址
  rss: 'https://flashpoint.io/feed',  // 或其他格式
  twitter: 'FlashpointIntel',
  category: '威胁情报'
}
```

### 方案三：使用第三方聚合

添加安全新闻聚合网站作为补充：

```javascript
{
  name: 'Flashpoint (via SecurityWeek)',
  rss: 'https://www.securityweek.com/feed/',
  category: '威胁情报'
}
```

### 方案四：LinkedIn 或其他平台

Flashpoint 在 LinkedIn 也很活跃，但需要：
- LinkedIn API（需要申请）
- 或使用第三方服务

---

## 当前配置

已更新 `config.js`：

```javascript
{
  name: 'Flashpoint',
  website: 'https://flashpoint.io/blog',
  rss: null,  // 暂时禁用，因为被保护
  twitter: 'FlashpointIntel',  // 主要数据源
  category: '威胁情报'
}
```

---

## 测试建议

### 1. 本地测试 Twitter 抓取

```powershell
cd C:\Users\admin\Desktop\KYT1
node scripts/fetchData.js
```

查看输出，看 Flashpoint 的 Twitter 是否能抓取到数据。

### 2. 检查代理设置

如果 Twitter 抓取失败，检查 `.env`：

```
# 国内需要代理
HTTP_PROXY=http://127.0.0.1:10090
HTTPS_PROXY=http://127.0.0.1:10090

# 香港服务器不需要代理
HTTP_PROXY=
HTTPS_PROXY=
```

### 3. 查看日志

部署到 Render 后，查看 Logs 标签页：
- 看是否有 "✓ Twitter: X 条" 的输出
- 如果有错误，会显示具体原因

---

## 其他竞品对比

| 竞品 | RSS | Twitter | 网站 | 状态 |
|------|-----|---------|------|------|
| Chainalysis | ✅ | ✅ | ✅ | 正常 |
| Elliptic | ✅ | ✅ | ✅ | 正常 |
| TRM Labs | ✅ | ✅ | ✅ | 正常 |
| Flashpoint | ❌ | ⚠️ | ❌ | 依赖Twitter |
| DarkBlue | ❌ | ⚠️ | ⚠️ | 依赖Twitter |
| StealthMole | ⚠️ | ⚠️ | ⚠️ | 部分可用 |

---

## 建议

### 短期（立即）
1. 确保代理配置正确
2. 等待下次自动更新（每天早上8点）
3. 或手动点击"刷新动态"按钮

### 中期（1-2周）
1. 监控 Twitter 抓取成功率
2. 如果持续失败，考虑添加备用数据源
3. 可以添加安全新闻聚合网站

### 长期（1个月+）
1. 考虑使用付费 API（如果预算允许）
2. 或使用专业的威胁情报聚合服务
3. 定期更新抓取策略

---

## 预期效果

正常情况下，Flashpoint 应该能通过 Twitter 获取 3-5 条最新动态。

如果 Twitter 抓取成功，会显示：
```
📡 抓取 Flashpoint...
  ✓ Twitter: 5 条
  📊 总计: 5 条更新（最近7天）
```

---

## 需要帮助？

如果持续没有数据：
1. 查看 Render 日志
2. 检查代理设置
3. 尝试手动访问 https://twitter.com/FlashpointIntel 确认账号存在
4. 考虑添加其他数据源作为补充

---

**总结**：Flashpoint 的数据抓取主要依赖 Twitter，确保网络和代理配置正确即可。如果 Twitter 也失败，可以考虑添加其他威胁情报新闻源作为补充。
