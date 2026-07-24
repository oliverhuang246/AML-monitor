// 竞品与情报来源配置
module.exports = {
  competitors: [
    {
      name: 'Flashpoint',
      homepage: 'https://flashpoint.io',
      website: 'https://flashpoint.io/blog',
      websiteSourceName: '官网博客',
      rss: 'https://flashpoint.io/feed',
      twitter: 'FlashpointIntel',
      category: '威胁情报',
      selectors: {
        article: 'article, .blog-post, .post-item, [class*="blog"], [class*="post"]',
        title: 'h1, h2, h3, h4, .title, [class*="title"]',
        link: 'a',
        excerpt: 'p, .excerpt, .summary, [class*="excerpt"]',
        date: 'time, [class*="date"], [class*="meta"]'
      }
    },
    {
      name: 'DarkBlue Intelligence',
      homepage: 'https://www.caci.com/darkblue',
      website: 'https://www.caci.com/darkblue',
      websiteSourceName: '官网动态',
      twitter: 'CACIIntl',
      category: '开源情报',
      selectors: {
        article: 'article, .views-row, .card, [class*="news"], [class*="article"]',
        title: 'h2, h3, a, [class*="title"]',
        link: 'a',
        excerpt: 'p, [class*="summary"], [class*="description"]',
        date: 'time, [class*="date"], [class*="meta"]'
      }
    },
    {
      name: 'StealthMole',
      homepage: 'https://www.stealthmole.com',
      rss: 'https://stealthmole-intelligence-hub.blogspot.com/feeds/posts/default',
      twitter: 'stealthmole_int',
      category: '暗网监测'
    },
    {
      name: 'Chainalysis',
      homepage: 'https://www.chainalysis.com',
      website: 'https://www.chainalysis.com/blog',
      websiteSourceName: '官网博客',
      rss: 'https://www.chainalysis.com/blog/feed/',
      twitter: 'chainalysis',
      category: '区块链分析',
      selectors: {
        article: 'article, .post, .card, [class*="blog"], [class*="post"]',
        title: 'h2, h3, [class*="title"]',
        link: 'a',
        excerpt: 'p, [class*="excerpt"], [class*="summary"]',
        date: 'time, [class*="date"], [class*="meta"]'
      }
    },
    {
      name: 'Elliptic',
      homepage: 'https://www.elliptic.co',
      website: 'https://www.elliptic.co/blog',
      websiteSourceName: '官网博客',
      rss: 'https://www.elliptic.co/blog/rss.xml',
      twitter: 'elliptic',
      category: '区块链分析'
    },
    {
      name: 'TRM Labs',
      homepage: 'https://www.trmlabs.com',
      website: 'https://www.trmlabs.com/resources/blog',
      websiteSourceName: '官网博客',
      rss: 'https://www.trmlabs.com/post/rss.xml',
      twitter: 'trmlabs',
      category: '区块链分析',
      selectors: {
        article: 'article, .card, .post, [class*="blog"], [class*="post"], [class*="resource"]',
        title: 'h2, h3, [class*="title"]',
        link: 'a',
        excerpt: 'p, [class*="excerpt"], [class*="summary"], [class*="description"]',
        date: 'time, [class*="date"], [class*="meta"]'
      }
    },
    {
      name: 'BlockSec',
      homepage: 'https://blocksec.com',
      website: 'https://blocksec.com/blog',
      websiteSourceName: '官网博客',
      twitter: 'BlockSecTeam',
      category: '链上安全',
      selectors: {
        article: 'article, .post, .blog-card, .blog-item, [class*="blog"]',
        title: 'h1, h2, h3, .title, [class*="title"]',
        link: 'a',
        excerpt: 'p, .excerpt, .summary, [class*="desc"]',
        date: 'time, [class*="date"], [class*="time"], [class*="meta"]'
      }
    },
    {
      name: 'PeckShield',
      homepage: 'https://peckshield.com',
      website: 'https://peckshield.com',
      websiteSourceName: '官网',
      twitter: 'PeckShieldAlert',
      category: '链上安全预警',
      selectors: {
        article: 'article, .card, .news, .post, [class*="news"], [class*="post"], [class*="blog"]',
        title: 'h2, h3, a, [class*="title"]',
        link: 'a',
        excerpt: 'p, [class*="summary"], [class*="description"]',
        date: 'time, [class*="date"], [class*="meta"]'
      }
    },
    {
      name: 'Scam Sniffer',
      homepage: 'https://www.scamsniffer.io',
      website: 'https://www.scamsniffer.io',
      websiteSourceName: '官网研究',
      twitter: 'realScamSniffer',
      category: '钓鱼与钱包欺诈',
      selectors: {
        article: 'article, .card, .post, [class*="blog"], [class*="post"], [class*="research"]',
        title: 'h2, h3, [class*="title"]',
        link: 'a',
        excerpt: 'p, [class*="summary"], [class*="description"]',
        date: 'time, [class*="date"], [class*="meta"]'
      }
    },
    {
      name: 'CertiK',
      homepage: 'https://www.certik.com',
      website: 'https://www.certik.com/blog',
      websiteSourceName: '官网博客',
      twitter: 'CertiKAlert',
      category: '链上安全与审计',
      selectors: {
        article: 'article, .blog-card, .post, [class*="article"], [class*="blog"]',
        title: 'h1, h2, h3, [class*="title"]',
        link: 'a',
        excerpt: 'p, [class*="description"], [class*="summary"]',
        date: 'time, [class*="date"], [class*="meta"]'
      }
    },
    {
      name: 'OFAC',
      homepage: 'https://ofac.treasury.gov',
      website: 'https://ofac.treasury.gov/recent-actions',
      websiteSourceName: '官网公告',
      twitter: null,
      category: '制裁与监管',
      selectors: {
        article: '.view-content .views-row, article, .card, .usa-collection__item',
        title: 'h2, h3, .field-content, a',
        link: 'a',
        excerpt: '.field-content, p',
        date: 'time, [class*="date"], [class*="meta"], .font-sans-2xs'
      }
    },
    {
      name: 'SlowMist',
      homepage: 'https://www.slowmist.com',
      website: 'https://slowmist.medium.com',
      websiteSourceName: 'Medium 博客',
      rss: 'https://slowmist.medium.com/feed',
      twitter: 'SlowMist_Team',
      category: '区块链安全',
      selectors: {
        article: 'article, .post',
        title: 'h1, h2, h3',
        link: 'a',
        date: 'time, [datetime], [class*="date"]'
      }
    }
  ],

  updateInterval: '0 0 * * *',
  dataRetentionDays: 7
};
