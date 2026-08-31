const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

const mockArticles = [
  {
    title: 'Exploit Alert: Cross-chain Lending Protocol Reports Abnormal Outflow',
    summary: 'A lending protocol reported a suspicious outflow involving multiple wallet clusters and bridge transactions. The incident may require address labeling and transaction rule review.',
    days: 1,
    source: 'Twitter',
    sourceName: 'Twitter/X'
  },
  {
    title: 'Weekly Crypto Crime Review: Ransomware Payments and Mixer Exposure Rise',
    summary: 'The weekly review highlights ransomware payments, darknet marketplace settlements and mixer-related exposure across several chains.',
    days: 2,
    source: 'Blog',
    sourceName: '官网博客'
  },
  {
    title: 'Product Update: AML Coverage Expands to More Cross-chain Entities',
    summary: 'The product update adds new entity attribution, sanctions screening support and workflow improvements for compliance analysts.',
    days: 3,
    source: 'LinkedIn',
    sourceName: 'LinkedIn'
  },
  {
    title: 'Research Note: Phishing Kits Target Wallet Approval Flows',
    summary: 'Researchers observed phishing kits imitating wallet approval flows and draining assets after users signed malicious permissions.',
    days: 5,
    source: 'Blog',
    sourceName: '官网博客'
  },
  {
    title: 'Regulatory Update: New Sanctions Guidance Published for Digital Assets',
    summary: 'The guidance reminds compliance teams to review sanctions screening coverage, blocked address handling and escalation procedures.',
    days: 6,
    source: 'Twitter',
    sourceName: 'Twitter/X'
  },
  {
    title: 'AI Risk Scoring Adds Alert Triage for Security Operations',
    summary: 'The release focuses on automated alert triage, entity enrichment and suspicious pattern scoring for security and compliance workflows.',
    days: 7,
    source: 'LinkedIn',
    sourceName: 'LinkedIn'
  }
];

function generateMockData() {
  const results = {};

  config.competitors.forEach((competitor) => {
    const updates = mockArticles.map((article, index) => {
      const date = new Date();
      date.setDate(date.getDate() - article.days);

      return {
        title: article.title,
        summary: article.summary,
        link: buildMockLink(competitor, article, index),
        date: date.toISOString(),
        source: article.source,
        sourceName: article.sourceName
      };
    });

    results[competitor.name] = {
      ...competitor,
      updates,
      lastUpdated: new Date().toISOString()
    };
  });

  return results;
}

function buildMockLink(competitor, article, index) {
  if (article.source === 'Twitter' && competitor.twitter) {
    return `https://twitter.com/${competitor.twitter}`;
  }

  if (article.source === 'LinkedIn') {
    return competitor.linkedin || `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(competitor.name)}`;
  }

  return `${competitor.website}#article-${index}`;
}

async function saveMockData() {
  console.log('生成测试数据...\n');

  const data = generateMockData();
  const dataDir = path.join(__dirname, '../data');

  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(
    path.join(dataDir, 'competitors.json'),
    JSON.stringify(data, null, 2)
  );

  console.log('测试数据生成完成。');
  console.log('提示：当前为测试数据。真实抓取请设置 USE_MOCK_DATA=false，并配置可访问的公开来源或代理。\n');

  return data;
}

if (require.main === module) {
  saveMockData().catch(console.error);
}

module.exports = { generateMockData, saveMockData };
