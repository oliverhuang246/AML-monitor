// 自动检测代理端口
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

// 常见代理端口
const commonPorts = [
  { port: 7890, type: 'http', name: 'Clash' },
  { port: 7891, type: 'socks5', name: 'Clash Socks' },
  { port: 10809, type: 'http', name: 'V2Ray' },
  { port: 10808, type: 'socks5', name: 'V2Ray Socks' },
  { port: 1080, type: 'socks5', name: 'Shadowsocks' },
  { port: 1081, type: 'http', name: 'Shadowsocks HTTP' },
  { port: 8080, type: 'http', name: 'HTTP Proxy' },
  { port: 8888, type: 'http', name: 'HTTP Proxy Alt' },
  { port: 1087, type: 'socks5', name: 'Socks5 Alt' },
];

async function testProxy(port, type) {
  const proxyUrl = type === 'socks5' 
    ? `socks5://127.0.0.1:${port}`
    : `http://127.0.0.1:${port}`;
  
  try {
    const agent = type === 'socks5'
      ? new SocksProxyAgent(proxyUrl)
      : new HttpsProxyAgent(proxyUrl);
    
    await axios.get('https://www.google.com', {
      httpsAgent: agent,
      httpAgent: agent,
      proxy: false,
      timeout: 5000
    });
    
    return true;
  } catch (error) {
    return false;
  }
}

async function findWorkingProxy() {
  console.log('🔍 正在检测可用的代理端口...\n');
  
  for (const config of commonPorts) {
    process.stdout.write(`测试 ${config.name} (${config.type}:${config.port})... `);
    
    const works = await testProxy(config.port, config.type);
    
    if (works) {
      console.log('✅ 可用！\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('找到可用代理！请将以下配置写入 .env 文件：\n');
      
      if (config.type === 'socks5') {
        console.log(`USE_MOCK_DATA=false`);
        console.log(`HTTP_PROXY=socks5://127.0.0.1:${config.port}`);
        console.log(`HTTPS_PROXY=socks5://127.0.0.1:${config.port}`);
      } else {
        console.log(`USE_MOCK_DATA=false`);
        console.log(`HTTP_PROXY=http://127.0.0.1:${config.port}`);
        console.log(`HTTPS_PROXY=http://127.0.0.1:${config.port}`);
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return;
    } else {
      console.log('❌ 不可用');
    }
  }
  
  console.log('\n❌ 未找到可用的代理端口');
  console.log('\n请检查：');
  console.log('1. 代理软件是否正在运行');
  console.log('2. 在代理软件中查看实际端口号');
  console.log('3. 确认代理软件允许本地连接');
}

findWorkingProxy().catch(console.error);
