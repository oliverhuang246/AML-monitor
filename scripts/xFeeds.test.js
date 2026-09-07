const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createXFetcher } = require('./xFeeds');
const { buildTwitterItem, isBlockedTwitterFeed } = require('./fetchData');

const now = Date.parse('2026-09-06T12:00:00Z');
const post = (date = '2026-09-05T12:00:00Z') => ({
  title: 'A published update', contentSnippet: 'Details of the update',
  link: 'https://mirror.example/account/status/123456789#fragment', pubDate: date
});
const options = {
  now: () => now, buildItem: buildTwitterItem, isBlocked: isBlockedTwitterFeed,
  env: { X_NITTER_INSTANCES: 'https://first.example,https://second.example' }
};

test('stale first mirror does not hide recent posts from the fallback', async () => {
  const calls = [];
  const fetchX = createXFetcher({ ...options, parseFeed: async url => {
    calls.push(url);
    return { items: [post(url.includes('first.') ? '2026-08-01T00:00:00Z' : undefined)] };
  } });
  const result = await fetchX('account');
  assert.equal(calls.length, 2);
  assert.equal(result.status.state, 'ok');
  assert.equal(result.status.provider, 'second.example');
  assert.equal(result.items[0].link, 'https://x.com/account/status/123456789');
});

test('rate-limited host is skipped for other accounts during the refresh', async () => {
  let failures = 0;
  const fetchX = createXFetcher({ ...options, parseFeed: async url => {
    if (url.includes('first.')) {
      failures++;
      throw { response: { status: 429 } };
    }
    return { items: [post()] };
  } });
  await fetchX('account');
  const result = await fetchX('other');
  assert.equal(failures, 1);
  assert.equal(result.status.attempts[0].state, 'skipped');
  assert.match(result.status.attempts[0].reason, /频率/);
});

test('an account-specific 404 does not disable the host for every account', async () => {
  const fetchX = createXFetcher({ ...options, parseFeed: async url => {
    if (url.includes('/missing/')) throw { response: { status: 404 } };
    return { items: [post()] };
  } });
  assert.equal((await fetchX('missing')).status.state, 'unavailable');
  assert.equal((await fetchX('account')).status.provider, 'first.example');
});

test('unavailable feeds preserve prior success metadata without inventing posts', async () => {
  const fetchX = createXFetcher({ ...options, parseFeed: async () => { throw { code: 'ETIMEDOUT' }; } });
  const result = await fetchX('account', { lastSuccessAt: '2026-09-01T00:00:00Z' });
  assert.deepEqual(result.items, []);
  assert.equal(result.status.state, 'unavailable');
  assert.equal(result.status.lastSuccessAt, '2026-09-01T00:00:00Z');
});

test('old, future and undated posts do not become current updates', async () => {
  const fetchX = createXFetcher({ ...options, parseFeed: async () => ({ items: [
    post('2026-08-01T00:00:00Z'), post('2027-01-01T00:00:00Z'), post(null)
  ] }) });
  const result = await fetchX('account');
  assert.equal(result.status.state, 'no-recent');
  assert.equal(result.status.latestPublishedAt, '2026-08-01T00:00:00.000Z');
  assert.equal(result.items.length, 0);
});

test('RSSHub error feeds fall back instead of showing their error as a tweet', async () => {
  const fetchX = createXFetcher({ ...options,
    env: { ...options.env, USE_RSSHUB_X: 'true', RSSHUB_BASE_URL: 'https://rss.example' },
    parseFeed: async url => url.includes('rss.example')
      ? { title: 'Could not load', items: [post()] }
      : { items: [post()] }
  });
  assert.equal((await fetchX('account')).status.provider, 'first.example');
});

test('only dated permalinks are accepted, and retweets are excluded', () => {
  assert.equal(buildTwitterItem({ ...post(), link: 'https://x.com/account' }), null);
  assert.equal(buildTwitterItem(post(null)), null);
  assert.equal(buildTwitterItem({ ...post(), title: 'RT @other: something' }), null);
  assert.equal(buildTwitterItem({ ...post(), title: 'RT by @other: something' }), null);
});
