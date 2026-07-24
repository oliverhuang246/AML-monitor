# 代理配置指南

## 第一步：确认你的代理软件端口

### 常见代理软件端口

| 软件 | HTTP端口 | Socks5端口 |
|------|---------|-----------|
| Clash | 7890 | 7891 |
| V2Ray | 10809 | 10808 |
| Shadowsocks | - | 1080 |
| SSR | - | 1080 |

### 如何查看端口？

1. **Clash**：打开 Clash → 设置 → 查看 "Port" 和 "Socks Port"
2. **V2Ray**：打开 V2RayN → 参数设置 → 本地监听端口
3. **Shadowsocks**：打开 SS → 选项设置 → 本地代理

## 第二步：修改 .env 文件

根据你的代理软件，编辑项目根目录的 `.env` 文件：

### 使用 Clash（推荐）

```bash
USE_MOCK_DATA=false
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

### 使用 V2Ray

```bash
USE_MOCK_DATA=false
HTTP_PROXY=http://127.0.0.1:10809
HTTPS_PROXY=http://127.0.0.1:10809
```

### 使用 Shadowsocks/SSR (Socks5)

```bash
USE_MOCK_DATA=false
HTTP_PROXY=socks5://127.0.0.1:1080
HTTPS_PROXY=socks5://127.0.0.1:1080
```

## 第三步：安装依赖并启动

```bash
# 安装新的依赖包
npm install

# 启动服务
npm start
```

## 验证是否成功

启动后，你应该看到：

```
🔒 使用代理: http://127.0.0.1:7890
🔄 开始抓取竞品数据...
📡 抓取 Flashpoint...
  ✓ Twitter: 5 条
📡 抓取 Chainalysis...
  ✓ RSS: 5 条
  ✓ Twitter: 5 条
...
✅ 数据抓取完成！共获取 XX 条更新
```

## 常见问题

### 1. 还是显示 "抓取失败"

**原因**：代理端口不对或代理软件未开启

**解决**：
- 确认代理软件正在运行
- 检查端口号是否正确
- 尝试在浏览器访问 Google 测试代理是否工作

### 2. 显示 "代理配置错误"

**原因**：代理地址格式不对

**解决**：
- HTTP代理格式：`http://127.0.0.1:端口`
- Socks5格式：`socks5://127.0.0.1:端口`
- 注意不要有多余空格

### 3. 部分网站能抓取，部分不能

**原因**：正常现象，有些网站有反爬虫保护

**解决**：
- 这是正常的，不是所有网站都能抓取
- 只要能获取到一些数据就可以了
- 可以在 `config.js` 中调整竞品列表

### 4. 想切换回模拟数据

编辑 `.env` 文件：
```bash
USE_MOCK_DATA=true
```

## 测试代理是否工作

在项目目录运行：

```bash
node -e "require('dotenv').config(); const axios = require('axios'); const {getAxiosConfig} = require('./scripts/fetchWithProxy'); axios.get('https://www.google.com', getAxiosConfig()).then(() => console.log('✅ 代理工作正常')).catch(e => console.log('❌ 代理失败:', e.message));"
```

如果显示 "✅ 代理工作正常"，说明配置成功！
