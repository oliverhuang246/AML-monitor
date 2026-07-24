require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cron = require('node-cron');
const { fetchAllData } = require('./scripts/fetchData');
const { saveMockData } = require('./scripts/mockData');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

app.use(express.static('public'));
app.use(express.json());

app.get('/api/competitors', async (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'data', 'competitors.json');
    const data = await fs.readFile(dataPath, 'utf-8');
    const competitors = JSON.parse(data);

    res.json({
      competitors,
      config: {
        dataRetentionDays: config.dataRetentionDays,
        useMockData: USE_MOCK_DATA,
        lastUpdated: competitors[Object.keys(competitors)[0]]?.lastUpdated || new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: '数据读取失败' });
  }
});

app.post('/api/refresh', async (req, res) => {
  try {
    console.log('\n手动触发刷新...');
    const data = USE_MOCK_DATA ? await saveMockData() : await fetchAllData();
    res.json({ success: true, data });
  } catch (error) {
    console.error('刷新失败:', error);
    res.status(500).json({ error: '刷新失败' });
  }
});

cron.schedule(config.updateInterval, () => {
  console.log('\n定时刷新触发。');
  if (USE_MOCK_DATA) {
    saveMockData().catch(console.error);
  } else {
    fetchAllData().catch(console.error);
  }
});

async function initializeData() {
  try {
    const dataPath = path.join(__dirname, 'data', 'competitors.json');
    await fs.access(dataPath);
    if (!USE_MOCK_DATA) {
      const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
      const totalUpdates = Object.values(data).reduce((sum, competitor) => sum + (competitor.updates || []).length, 0);
      if (totalUpdates === 0) {
        console.log('真实抓取模式：现有数据为空，启动时刷新一次数据...');
        await fetchAllData();
        return;
      }
    }
    console.log('使用现有数据。');
  } catch {
    console.log('数据文件不存在，执行首次抓取...');
    if (USE_MOCK_DATA) {
      await saveMockData();
    } else {
      const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
      if (proxy) {
        console.log(`使用代理：${proxy}\n`);
      }
      await fetchAllData();
    }
  }
}

initializeData().catch(console.error);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n竞品监控平台运行中`);
  console.log(`本地访问：http://localhost:${PORT}`);
  console.log(`自动刷新：每天 08:00（UTC+8）`);
  console.log(`数据保留：最近 ${config.dataRetentionDays} 天`);
  console.log(`数据模式：${USE_MOCK_DATA ? '测试数据' : '真实抓取'}`);
});
