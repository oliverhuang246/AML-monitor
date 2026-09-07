const DEFAULT_DIRECT_FEEDS = [
  'https://fxtwitter.com/{username}/feed.xml'
];

const DEFAULT_MIRRORS = [
  'https://nitter.perennialte.ch',
  'https://nitter.poast.org',
  'https://nitter.tiekoetter.com',
  'https://nitter.space'
];

function failureReason(error) {
  const status = error.response?.status;
  if (status === 429) return '访问频率受限';
  if (status === 401 || status === 403) return '来源拒绝访问';
  if (status === 404) return '订阅地址或账号不存在';
  if (status === 410) return '来源已停止服务';
  if (status) return `来源返回错误（${status}）`;
  if (['ECONNABORTED', 'ETIMEDOUT'].includes(error.code)) return '连接超时';
  if (String(error.code).includes('CERT') || String(error.code).includes('TLS')) return '证书验证失败';
  if (error.code) return '网络连接失败';
  return '返回内容不是有效订阅';
}

function splitList(value) {
  return String(value || '').split(',').map(s => s.trim()).filter(Boolean);
}

function hasOwn(env, key) {
  return Object.prototype.hasOwnProperty.call(env, key);
}

function makeTemplateSource(template, username) {
  const url = template.includes('{username}')
    ? template.replaceAll('{username}', encodeURIComponent(username))
    : `${template.replace(/\/+$/, '')}/${encodeURIComponent(username)}/feed.xml`;
  let base = url;
  try { base = new URL(url).origin; } catch {}
  return { base, url, kind: 'direct' };
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldSkipHost(error, source) {
  const status = error.response?.status;
  if (status === 404) return false;
  if (source.kind === 'direct' && !status) return false;
  return true;
}

// Keep failing hosts out of the remaining requests in this refresh, not future refreshes.
function createXFetcher({ parseFeed, buildItem, isBlocked, env = process.env, now = Date.now, limit = 12, days = 7 }) {
  const directFeeds = hasOwn(env, 'X_DIRECT_FEED_URLS') ? splitList(env.X_DIRECT_FEED_URLS) : DEFAULT_DIRECT_FEEDS;
  const configured = splitList(env.X_NITTER_INSTANCES).map(s => s.replace(/\/+$/, ''));
  const mirrors = configured.length ? [...new Set(configured)] : DEFAULT_MIRRORS;
  const unavailable = new Map();
  const configuredTimeout = Number(env.X_FEED_TIMEOUT_MS);
  const timeout = configuredTimeout > 0 ? Math.min(configuredTimeout, 20000) : 8000;
  const configuredDelay = Number(env.X_FEED_DELAY_MS);
  const directDelay = configuredDelay >= 0 ? Math.min(configuredDelay, 10000) : 1200;
  const configuredRetries = Number(env.X_FEED_RETRIES);
  const directRetries = configuredRetries >= 0 ? Math.min(configuredRetries, 3) : 1;
  let lastDirectRequestAt = 0;

  return async function fetchX(username, previous = {}) {
    const attemptedAt = new Date(now()).toISOString();
    const cutoff = now() - days * 86400000;
    const attempts = [];
    let latestPublishedAt = null;
    let receivedFeed = false;
    const sources = [
      ...directFeeds.map(template => makeTemplateSource(template, username)),
      ...mirrors.map(base => ({ base, url: `${base}/${encodeURIComponent(username)}/rss`, kind: 'nitter' }))
    ];
    if (env.USE_RSSHUB_X === 'true' && env.RSSHUB_BASE_URL) {
      const base = env.RSSHUB_BASE_URL.replace(/\/+$/, '');
      sources.unshift({ base, url: `${base}/twitter/user/${encodeURIComponent(username)}`, kind: 'rsshub' });
    }

    for (const source of sources) {
      const { base, url } = source;
      // Store only the hostname; custom feed URLs can contain private credentials.
      let provider;
      try { provider = new URL(base).hostname; } catch { continue; }
      if (unavailable.has(base)) {
        attempts.push({ provider, state: 'skipped', reason: unavailable.get(base) });
        continue;
      }
      const maxAttempts = source.kind === 'direct' ? directRetries + 1 : 1;
      for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber++) {
        try {
          if (source.kind === 'direct' && directDelay > 0) {
            const elapsed = now() - lastDirectRequestAt;
            if (elapsed < directDelay) await wait(directDelay - elapsed);
            lastDirectRequestAt = now();
          }

          const feed = await parseFeed(url, { timeout });
        if (!Array.isArray(feed.items) || isBlocked(feed)) {
          unavailable.set(base, '来源返回拦截提示或无效订阅');
          attempts.push({ provider, state: 'failed', reason: unavailable.get(base) });
          continue;
        }
        receivedFeed = true;
        const valid = feed.items.map(buildItem).filter(Boolean);
        const dated = valid.filter(item => {
          const timestamp = Date.parse(item.date);
          return Number.isFinite(timestamp) && timestamp <= now();
        }).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
        const latest = dated[0]?.date;
        if (latest && (!latestPublishedAt || Date.parse(latest) > Date.parse(latestPublishedAt))) {
          latestPublishedAt = new Date(latest).toISOString();
        }
        const recent = dated.filter(item => Date.parse(item.date) >= cutoff).slice(0, limit);
        attempts.push({ provider, state: recent.length ? 'ok' : 'no-recent', count: recent.length });
        if (recent.length) {
          return {
            items: recent,
            status: { state: 'ok', attemptedAt, lastSuccessAt: attemptedAt, latestPublishedAt, provider, count: recent.length, attempts }
          };
        }
        // A reachable mirror may be stale. Try the next one before reporting no recent posts.
          break;
        } catch (error) {
          const reason = failureReason(error);
          attempts.push({
            provider,
            state: attemptNumber < maxAttempts ? 'retrying' : 'failed',
            reason: attemptNumber < maxAttempts ? `${reason}，准备重试` : reason
          });
          if (attemptNumber < maxAttempts) {
            await wait(Math.min(500 * attemptNumber, 1500));
            continue;
          }
          if (shouldSkipHost(error, source)) unavailable.set(base, reason);
        }
      }
    }
    return {
      items: [],
      status: {
        state: receivedFeed ? 'no-recent' : 'unavailable', attemptedAt,
        lastSuccessAt: previous.lastSuccessAt || null,
        latestPublishedAt: latestPublishedAt || previous.latestPublishedAt || null,
        count: 0, attempts
      }
    };
  };
}

module.exports = { createXFetcher };
