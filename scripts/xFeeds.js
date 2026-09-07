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

// Keep failing hosts out of the remaining requests in this refresh, not future refreshes.
function createXFetcher({ parseFeed, buildItem, isBlocked, env = process.env, now = Date.now, limit = 12, days = 7 }) {
  const configured = String(env.X_NITTER_INSTANCES || '').split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);
  const mirrors = configured.length ? [...new Set(configured)] : DEFAULT_MIRRORS;
  const unavailable = new Map();
  const configuredTimeout = Number(env.X_FEED_TIMEOUT_MS);
  const timeout = configuredTimeout > 0 ? Math.min(configuredTimeout, 20000) : 8000;

  return async function fetchX(username, previous = {}) {
    const attemptedAt = new Date(now()).toISOString();
    const cutoff = now() - days * 86400000;
    const attempts = [];
    let latestPublishedAt = null;
    let receivedFeed = false;
    const sources = mirrors.map(base => ({ base, url: `${base}/${encodeURIComponent(username)}/rss` }));
    if (env.USE_RSSHUB_X === 'true' && env.RSSHUB_BASE_URL) {
      const base = env.RSSHUB_BASE_URL.replace(/\/+$/, '');
      sources.unshift({ base, url: `${base}/twitter/user/${encodeURIComponent(username)}` });
    }

    for (const { base, url } of sources) {
      // Store only the hostname; custom feed URLs can contain private credentials.
      let provider;
      try { provider = new URL(base).hostname; } catch { continue; }
      if (unavailable.has(base)) {
        attempts.push({ provider, state: 'skipped', reason: unavailable.get(base) });
        continue;
      }
      try {
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
      } catch (error) {
        const reason = failureReason(error);
        attempts.push({ provider, state: 'failed', reason });
        if (error.response?.status !== 404) unavailable.set(base, reason);
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
