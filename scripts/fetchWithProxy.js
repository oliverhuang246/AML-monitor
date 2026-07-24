// 带代理的数据抓取
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

// 从环境变量读取代理配置
const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

function getProxyAgent() {
  if (!PROXY) {
    return null;
  }

  try {
    // 判断是 socks 还是 http 代理
    if (PROXY.startsWith('socks')) {
      return new SocksProxyAgent(PROXY);
    } else {
      return new HttpsProxyAgent(PROXY);
    }
  } catch (error) {
    console.error('❌ 代理配置错误:', error.message);
    return null;
  }
}

function getAxiosConfig() {
  const config = {
    headers: { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    },
    timeout: 20000
  };

  const agent = getProxyAgent();
  if (agent) {
    config.httpsAgent = agent;
    config.httpAgent = agent;
    config.proxy = false; // 禁用 axios 默认代理
  }

  return config;
}

module.exports = { getAxiosConfig, getProxyAgent };
