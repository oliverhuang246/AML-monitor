const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const { getAxiosConfig, getProxyAgent } = require('./fetchWithProxy');

const PER_SOURCE_LIMIT = Number(process.env.PER_SOURCE_LIMIT || 12);
const PER_COMPETITOR_LIMIT = Number(process.env.PER_COMPETITOR_LIMIT || 30);

const parser = new Parser({
  requestOptions: getProxyAgent() ? {
    agent: getProxyAgent()
  } : {}
});

function cleanText(text, maxLength = 260) {
  if (!text) return '';

  const normalized = String(text)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return '';
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function shortenTitle(title, maxLength = 120) {
  const cleaned = cleanText(title, maxLength);
  return cleaned || '无标题';
}

function normalizeLink(link, baseUrl) {
  if (!link) return '';
  if (link.startsWith('http')) return link;
  const base = new URL(baseUrl);
  return link.startsWith('/') ? `${base.origin}${link}` : `${base.origin}/${link}`;
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function parseDateValue(value) {
  const text = cleanText(value, 1000);
  if (!text) return null;

  const patterns = [
    /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b/i,
    /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/,
    /\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/,
    /\b\d{8}\b/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const value = match[0];
    const normalized = /^\d{8}$/.test(value)
      ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00Z`
      : value;
    const parsed = new Date(normalized);
    if (isValidDate(parsed)) return parsed.toISOString();
  }

  const direct = new Date(text);
  return isValidDate(direct) ? direct.toISOString() : null;
}

function extractPublishedDate($, $elem, selectors = {}) {
  const dateSelector = selectors.date || [
    'time',
    '[datetime]',
    '[itemprop*="date"]',
    '[class*="date"]',
    '[class*="time"]',
    '.posted',
    '.meta',
    '.field-content',
    '.usa-collection__meta'
  ].join(', ');

  const attrNames = ['datetime', 'content', 'data-date', 'data-datetime', 'title', 'aria-label'];
  const candidates = [];

  for (const attr of attrNames) {
    const ownValue = $elem.attr(attr);
    if (ownValue) candidates.push(ownValue);
  }

  $elem.find(dateSelector).each((_, node) => {
    const $node = $(node);
    for (const attr of attrNames) {
      const value = $node.attr(attr);
      if (value) candidates.push(value);
    }
    candidates.push($node.text());
  });

  candidates.push($elem.text());

  for (const candidate of candidates) {
    const parsed = parseDateValue(candidate);
    if (parsed) return parsed;
  }

  return null;
}

function isRetweetOrReply(content, title) {
  if (!content && !title) return false;
  const text = `${content || ''} ${title || ''}`.toLowerCase();

  return (
    text.includes('rt @') ||
    text.includes('retweeted') ||
    text.startsWith('r to @') ||
    text.includes('replying to @') ||
    text.includes('in reply to')
  );
}

async function fetchRSS(url) {
  try {
    const feed = await parser.parseURL(new URL(url).href);
    return feed.items.slice(0, PER_SOURCE_LIMIT).map((item) => {
      const content = item.contentSnippet || item.content || item.summary || item.description || '';
      return {
        title: shortenTitle(item.title),
        summary: cleanText(content),
        link: item.link,
        date: item.pubDate || item.isoDate || new Date().toISOString(),
        source: 'Blog',
        sourceName: '博客/RSS'
      };
    });
  } catch (error) {
    console.log(`  RSS 抓取失败：${url} (${error.message})`);
    return [];
  }
}

async function fetchWebsite(url, selectors = {}) {
  try {
    const { data } = await axios.get(url, getAxiosConfig());
    const $ = cheerio.load(data);

    const articleSelector = selectors.article || 'article, .post, .news-item, .blog-post, .card, [class*="article"], [class*="blog"], [class*="post"]';
    const titleSelector = selectors.title || 'h1, h2, h3, .title, [class*="title"]';
    const linkSelector = selectors.link || 'a';
    const excerptSelector = selectors.excerpt || 'p, .excerpt, .summary, .description, [class*="excerpt"], [class*="summary"], [class*="desc"]';

    const articles = [];
    const seen = new Set();
    const elements = $(articleSelector).slice(0, PER_SOURCE_LIMIT * 3);

    for (let i = 0; i < elements.length && articles.length < PER_SOURCE_LIMIT; i++) {
      const $elem = $(elements[i]);
      const title = cleanText($elem.find(titleSelector).first().text() || $elem.text(), 160);
      const rawLink = $elem.find(linkSelector).first().attr('href') || $elem.attr('href');
      const link = normalizeLink(rawLink, url);

      if (!title || !link || seen.has(link)) continue;
      seen.add(link);

      articles.push({
        title: shortenTitle(title),
        summary: cleanText($elem.find(excerptSelector).first().text()),
        link,
        date: extractPublishedDate($, $elem, selectors) || parseDateValue(link),
        source: 'Website',
        sourceName: '官网'
      });
    }

    return articles;
  } catch (error) {
    console.log(`  官网抓取失败：${url} (${error.message})`);
    return [];
  }
}

async function fetchWebsiteSource(sourceConfig) {
  const items = await fetchWebsite(sourceConfig.url, sourceConfig.selectors || {});
  return items.map((item) => ({
    ...item,
    sourceName: sourceConfig.sourceName || item.sourceName || '官网',
    sourceUrl: sourceConfig.url
  }));
}

async function fetchTwitter(username) {
  const mirrors = [
    'https://nitter.poast.org',
    'https://nitter.privacydev.net',
    'https://nitter.net'
  ];

  for (const mirror of mirrors) {
    try {
      const feed = await parser.parseURL(`${mirror}/${username}/rss`);
      const items = [];

      for (const item of feed.items.slice(0, PER_SOURCE_LIMIT * 2)) {
        const content = item.contentSnippet || item.content || '';
        const title = item.title || '';
        if (isRetweetOrReply(content, title)) continue;

        const firstTweet = content.split(/\n\n/)[0].trim();
        items.push({
          title: shortenTitle(title || firstTweet),
          summary: cleanText(firstTweet, 220),
          link: item.link.replace(mirror, 'https://twitter.com'),
          date: item.pubDate || item.isoDate || new Date().toISOString(),
          source: 'Twitter',
          sourceName: 'Twitter/X'
        });

        if (items.length >= PER_SOURCE_LIMIT) break;
      }

      return items;
    } catch (error) {
      continue;
    }
  }

  console.log(`  Twitter/X 抓取失败：@${username}`);
  return [];
}

async function fetchAllData() {
  console.log('开始抓取真实竞品数据...\n');
  const results = {};
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.dataRetentionDays);

  for (const competitor of config.competitors) {
    console.log(`抓取 ${competitor.name}...`);
    const data = [];

    if (competitor.rss) {
      const rssData = await fetchRSS(competitor.rss);
      data.push(...rssData);
      if (rssData.length > 0) console.log(`  博客/RSS：${rssData.length} 条`);
    }

    if (competitor.twitter) {
      const twitterData = await fetchTwitter(competitor.twitter);
      data.push(...twitterData);
      if (twitterData.length > 0) console.log(`  Twitter/X：${twitterData.length} 条`);
    }

    const websiteSources = [];
    if (competitor.website) {
      websiteSources.push({
        url: competitor.website,
        sourceName: competitor.websiteSourceName || '官网',
        selectors: competitor.selectors
      });
    }
    if (Array.isArray(competitor.websites)) {
      websiteSources.push(...competitor.websites);
    }

    for (const sourceConfig of websiteSources) {
      const webData = await fetchWebsiteSource(sourceConfig);
      data.push(...webData);
      if (webData.length > 0) console.log(`  ${sourceConfig.sourceName || '官网'}：${webData.length} 条`);
    }

    const uniqueData = Array.from(
      new Map(data.filter((item) => item.link).map((item) => [item.link, item])).values()
    );

    const filteredData = uniqueData
      .filter((item) => {
        const itemDate = new Date(item.date);
        return !item.date || !isValidDate(itemDate) || itemDate >= cutoffDate;
      })
      .sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);
        const aTime = isValidDate(aDate) ? aDate.getTime() : 0;
        const bTime = isValidDate(bDate) ? bDate.getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, PER_COMPETITOR_LIMIT);

    results[competitor.name] = {
      ...competitor,
      updates: filteredData,
      lastUpdated: new Date().toISOString()
    };

    console.log(`  合计：${filteredData.length} 条近 ${config.dataRetentionDays} 天动态\n`);
  }

  const dataDir = path.join(__dirname, '../data');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(
    path.join(dataDir, 'competitors.json'),
    JSON.stringify(results, null, 2)
  );

  const totalUpdates = Object.values(results).reduce((sum, competitor) => sum + competitor.updates.length, 0);
  console.log(`真实数据抓取完成，共 ${totalUpdates} 条近 ${config.dataRetentionDays} 天动态。\n`);
  return results;
}

if (require.main === module) {
  fetchAllData().catch(console.error);
}

module.exports = { fetchAllData };
