require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const { getAxiosConfig, getProxyAgent } = require('./fetchWithProxy');

const PER_SOURCE_LIMIT = Number(process.env.PER_SOURCE_LIMIT || 12);
const PER_COMPETITOR_LIMIT = Number(process.env.PER_COMPETITOR_LIMIT || 30);
const USE_RSSHUB_X = process.env.USE_RSSHUB_X === 'true';
const RSSHUB_BASE_URL = (process.env.RSSHUB_BASE_URL || '').replace(/\/+$/, '');
const DEFAULT_NITTER_MIRRORS = [
  'https://nitter.perennialte.ch',
  'https://nitter.poast.org',
  'https://nitter.tiekoetter.com',
  'https://nitter.space',
  'https://nitter.privacyredirect.com',
  'https://nitter.privacydev.net',
  'https://nitter.net'
];
const X_FEED_TIMEOUT_MS = Number(process.env.X_FEED_TIMEOUT_MS || 12000);

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

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function getNitterMirrors() {
  const configuredMirrors = parseList(process.env.X_NITTER_INSTANCES);
  return configuredMirrors.length > 0 ? configuredMirrors : DEFAULT_NITTER_MIRRORS;
}

async function parseFeedURL(url, options = {}) {
  const { data } = await axios.get(new URL(url).href, {
    ...getAxiosConfig(),
    timeout: options.timeout || getAxiosConfig().timeout,
    responseType: 'text',
    transformResponse: [(value) => value]
  });

  return parser.parseString(data);
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function dateFromOffset(amount, unit) {
  const date = new Date();
  const normalizedUnit = unit.toLowerCase();

  if (['m', 'min', 'mins', 'minute', 'minutes'].includes(normalizedUnit)) {
    date.setMinutes(date.getMinutes() - amount);
  } else if (['h', 'hr', 'hrs', 'hour', 'hours'].includes(normalizedUnit)) {
    date.setHours(date.getHours() - amount);
  } else if (['d', 'day', 'days'].includes(normalizedUnit)) {
    date.setDate(date.getDate() - amount);
  } else if (['w', 'wk', 'wks', 'week', 'weeks'].includes(normalizedUnit)) {
    date.setDate(date.getDate() - amount * 7);
  } else if (['mo', 'mos', 'month', 'months'].includes(normalizedUnit)) {
    date.setMonth(date.getMonth() - amount);
  } else if (['y', 'yr', 'yrs', 'year', 'years'].includes(normalizedUnit)) {
    date.setFullYear(date.getFullYear() - amount);
  } else {
    return null;
  }

  return date.toISOString();
}

function parseRelativeDateValue(text) {
  const normalized = cleanText(text, 1000);
  if (!normalized) return null;

  if (/\b(just now|today)\b/i.test(normalized)) {
    return new Date().toISOString();
  }

  const match = normalized.match(/\b(\d{1,2})\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks|mo|mos|month|months|y|yr|yrs|year|years)\b/i);
  if (!match) return null;

  return dateFromOffset(Number(match[1]), match[2]);
}

function isRecentItem(item, cutoffDate) {
  if (!item.date) return false;
  const itemDate = new Date(item.date);
  return isValidDate(itemDate) && itemDate >= cutoffDate;
}

function parseDateValue(value) {
  const text = cleanText(value, 1000);
  if (!text) return null;

  const patterns = [
    /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}(?=\D|$)/i,
    /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}\s+\d{4}(?=\D|$)/i,
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

async function loadExistingData() {
  try {
    const dataPath = path.join(__dirname, '../data/competitors.json');
    const rawData = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(rawData);
  } catch {
    return {};
  }
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

function titleFromCardText(text, dateText) {
  let title = cleanText(text, 220);
  if (dateText) {
    title = cleanText(title.replace(dateText, ''), 220);
  }

  const categories = [
    'Security Insights',
    'Knowledge',
    'Research',
    'Incident Analysis',
    'Policy Pulse',
    'Technical Insights',
    'Educational',
    'Company Updates',
    'Announcements',
    'Products & Services',
    'Ecosystem Analysis',
    'New'
  ];

  for (const category of categories) {
    if (title.startsWith(category)) {
      title = cleanText(title.slice(category.length), 220);
    }
  }

  return shortenTitle(title);
}

function extractDatedLinkCards($, url, selectors = {}) {
  const linkPattern = selectors.linkPattern || /\/(blog|news|newsroom|research|resources)\//i;
  const cards = [];
  const seen = new Set();

  $('a[href]').each((_, node) => {
    if (cards.length >= PER_SOURCE_LIMIT) return;

    const $link = $(node);
    const rawLink = $link.attr('href');
    const link = normalizeLink(rawLink, url);
    const text = cleanText($link.text(), 700);
    const parsedDate = parseDateValue(text);

    if (!link || seen.has(link) || !linkPattern.test(link) || !parsedDate || text.length < 20) {
      return;
    }

    seen.add(link);
    const dateTextMatch = text.match(/(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,)?\s+\d{4}(?=\D|$)/i);
    const dateText = dateTextMatch ? dateTextMatch[0] : '';

    cards.push({
      title: titleFromCardText(text, dateText),
      summary: cleanText(text.replace(dateText, ''), 260),
      link,
      date: parsedDate,
      source: 'Website',
      sourceName: '官网'
    });
  });

  return cards;
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

function buildTwitterItem(item, fallbackLinkPrefix = 'https://twitter.com') {
  const content = item.contentSnippet || item.content || '';
  const title = item.title || '';
  if (isRetweetOrReply(content, title)) return null;

  const firstTweet = content.split(/\n\n/)[0].trim();
  const rawLink = item.link || '';
  const link = rawLink
    ? rawLink.replace(/^https?:\/\/[^/]+/, fallbackLinkPrefix)
    : fallbackLinkPrefix;

  return {
    title: shortenTitle(title || firstTweet),
    summary: cleanText(firstTweet, 220),
    link,
    date: item.pubDate || item.isoDate || new Date().toISOString(),
    source: 'Twitter',
    sourceName: 'Twitter/X'
  };
}

function isBlockedTwitterFeed(feed) {
  const text = [
    feed?.title,
    feed?.description,
    ...(feed?.items || []).flatMap((item) => [item.title, item.contentSnippet, item.content])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    text.includes('rss reader not yet whitelisted') ||
    text.includes('instance has been rate limited') ||
    text.includes('could not load') ||
    text.includes('cease and desist') ||
    text.includes('service xcancel is stopped')
  );
}

async function fetchTwitterFromRSSHub(username) {
  if (!USE_RSSHUB_X || !RSSHUB_BASE_URL) return [];

  const route = `${RSSHUB_BASE_URL}/twitter/user/${username}`;

  try {
    const feed = await parseFeedURL(route, { timeout: X_FEED_TIMEOUT_MS });
    const items = [];

    for (const item of feed.items.slice(0, PER_SOURCE_LIMIT * 2)) {
      const twitterItem = buildTwitterItem(item);
      if (!twitterItem) continue;
      items.push(twitterItem);
      if (items.length >= PER_SOURCE_LIMIT) break;
    }

    if (items.length > 0) {
      console.log(`  Twitter/X RSSHub：${items.length} 条`);
    }

    return items;
  } catch (error) {
    console.log(`  Twitter/X RSSHub 抓取失败：@${username} (${error.message})`);
    return [];
  }
}

async function fetchRSS(url) {
  try {
    const feed = await parseFeedURL(url);
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
    const datedLinkCards = extractDatedLinkCards($, url, selectors);
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

    return Array.from(
      new Map([...datedLinkCards, ...articles].map((item) => [item.link, item])).values()
    ).slice(0, PER_SOURCE_LIMIT);
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
  const rsshubData = await fetchTwitterFromRSSHub(username);
  if (rsshubData.length > 0) return rsshubData;

  const mirrors = getNitterMirrors();

  for (const mirror of mirrors) {
    try {
      const feed = await parseFeedURL(`${mirror}/${username}/rss`, { timeout: X_FEED_TIMEOUT_MS });
      if (isBlockedTwitterFeed(feed)) continue;

      const items = [];

      for (const item of feed.items.slice(0, PER_SOURCE_LIMIT * 2)) {
        const twitterItem = buildTwitterItem(item);
        if (!twitterItem) continue;
        items.push(twitterItem);

        if (items.length >= PER_SOURCE_LIMIT) break;
      }

      if (items.length > 0) {
        console.log(`  Twitter/X 镜像：${items.length} 条 (${mirror})`);
        return items;
      }

    } catch (error) {
      continue;
    }
  }

  console.log(`  Twitter/X 抓取失败：@${username}`);
  return [];
}

function cleanLinkedInText(text) {
  return cleanText(
    text
      .replace(/LinkedIn and 3rd parties use essential and non-essential cookies[\s\S]*/i, '')
      .replace(/\b(follow|followers|likes?|comments?|reposts?|share|sign in|join now)\b/gi, ' '),
    320
  );
}

async function fetchLinkedIn(url) {
  if (!url) return [];

  try {
    const { data } = await axios.get(url, getAxiosConfig());
    const $ = cheerio.load(data);
    const items = [];
    const seen = new Set();
    const selectors = [
      '.profile-creator-shared-feed-update__container',
      '.feed-shared-update-v2',
      '[class*="feed-update"]',
      '[class*="update"]'
    ].join(', ');

    $(selectors).each((_, node) => {
      if (items.length >= PER_SOURCE_LIMIT) return;

      const $node = $(node);
      const rawText = cleanLinkedInText($node.text());
      const date = parseRelativeDateValue(rawText) || parseDateValue(rawText);
      if (!rawText || !date) return;

      const rawLink = $node
        .find('a[href*="/posts/"], a[href*="/feed/update/"], a[href*="activity-"]')
        .first()
        .attr('href');
      const link = rawLink ? normalizeLink(rawLink.split('?')[0], url) : url;
      const uniqueKey = `${link}:${rawText.slice(0, 80)}`;
      if (seen.has(uniqueKey)) return;
      seen.add(uniqueKey);

      items.push({
        title: shortenTitle(rawText),
        summary: rawText,
        link,
        date,
        source: 'LinkedIn',
        sourceName: 'LinkedIn'
      });
    });

    return items;
  } catch (error) {
    console.log(`  LinkedIn 抓取失败：${url} (${error.message})`);
    return [];
  }
}

async function fetchAllData() {
  console.log('开始抓取真实竞品数据...\n');
  const results = {};
  const existingData = process.env.IGNORE_EXISTING_DATA === 'true' ? {} : await loadExistingData();
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

    if (competitor.linkedin) {
      const linkedinData = await fetchLinkedIn(competitor.linkedin);
      data.push(...linkedinData);
      if (linkedinData.length > 0) console.log(`  LinkedIn：${linkedinData.length} 条`);
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
      .filter((item) => isRecentItem(item, cutoffDate))
      .sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);
        const aTime = isValidDate(aDate) ? aDate.getTime() : 0;
        const bTime = isValidDate(bDate) ? bDate.getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, PER_COMPETITOR_LIMIT);

    const existingCompetitor = existingData[competitor.name];
    const existingUpdates = Array.isArray(existingCompetitor?.updates) ? existingCompetitor.updates : [];
    const existingRecentUpdates = existingUpdates.filter((item) => isRecentItem(item, cutoffDate));
    const mergedRecentUpdates = Array.from(
      new Map([...filteredData, ...existingRecentUpdates].filter((item) => item.link).map((item) => [item.link, item])).values()
    )
      .sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, PER_COMPETITOR_LIMIT);
    const updatesToSave = mergedRecentUpdates.length > 0 ? mergedRecentUpdates : existingRecentUpdates;

    if (filteredData.length === 0 && existingRecentUpdates.length > 0) {
      console.log(`  本次未抓到新数据，保留已有 ${existingRecentUpdates.length} 条有效动态`);
    }

    results[competitor.name] = {
      ...competitor,
      updates: updatesToSave,
      lastUpdated: filteredData.length > 0
        ? new Date().toISOString()
        : existingCompetitor?.lastUpdated || new Date().toISOString(),
      lastRefreshAttempted: new Date().toISOString(),
      lastRefreshStatus: filteredData.length > 0 ? 'updated' : 'kept-existing'
    };

    console.log(`  合计：${updatesToSave.length} 条近 ${config.dataRetentionDays} 天动态\n`);
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
