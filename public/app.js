let allData = {};
let currentCompetitor = 'all';
let searchQuery = '';
let dataConfig = {};

const sourceLabels = {
  Twitter: 'Twitter/X',
  Blog: '博客/RSS',
  Website: '官网',
  RSS: 'RSS订阅',
  LinkedIn: 'LinkedIn'
};

const sourceIcons = {
  Twitter: 'X',
  Blog: '博客',
  Website: '官网',
  RSS: 'RSS',
  LinkedIn: 'in'
};

async function loadData() {
  try {
    const response = await fetch('/api/competitors');
    const result = await response.json();

    allData = result.competitors || {};
    dataConfig = result.config || {};

    renderSidebar();
    renderUpdates();
    updateDataInfo();
    updateMetrics();
    document.getElementById('loading').style.display = 'none';
  } catch (error) {
    document.getElementById('loading').textContent = '加载失败，请稍后刷新页面';
  }
}

function getCompetitors() {
  return Object.values(allData);
}

function getRecentUpdates(competitor) {
  const retentionDays = dataConfig.dataRetentionDays || 7;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  return (competitor?.updates || []).filter((update) => {
    const updateDate = new Date(update.date);
    return !Number.isNaN(updateDate.getTime()) && updateDate >= cutoff;
  });
}

function getVisibleUpdates() {
  let updates = [];

  if (currentCompetitor === 'all') {
    getCompetitors().forEach((competitor) => {
      getRecentUpdates(competitor).forEach((update) => {
        updates.push({
          ...update,
          competitorName: competitor.name,
          competitorCategory: competitor.category
        });
      });
    });
  } else {
    const competitor = allData[currentCompetitor];
    updates = getRecentUpdates(competitor).map((update) => ({
      ...update,
      competitorName: competitor.name,
      competitorCategory: competitor.category
    }));
  }

  updates.sort((a, b) => {
    const aTime = Number.isNaN(new Date(a.date).getTime()) ? 0 : new Date(a.date).getTime();
    const bTime = Number.isNaN(new Date(b.date).getTime()) ? 0 : new Date(b.date).getTime();
    return bTime - aTime;
  });
  return updates;
}

function getSourceLabel(update) {
  return update.sourceName || sourceLabels[update.source] || update.source || '来源';
}

function updateDataInfo() {
  const infoElement = document.getElementById('dataInfo');
  if (!infoElement) return;

  const modeText = dataConfig.useMockData ? '测试数据' : '真实抓取';
  if (!dataConfig.lastUpdated) {
    infoElement.textContent = `${modeText} · 保留最近 ${dataConfig.dataRetentionDays || 7} 天`;
    return;
  }

  const lastUpdated = new Date(dataConfig.lastUpdated);
  const now = new Date();
  const diffHours = Math.floor((now - lastUpdated) / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  let timeAgo = '刚刚更新';
  if (diffHours >= 24) {
    timeAgo = `${diffDays} 天前更新`;
  } else if (diffHours >= 1) {
    timeAgo = `${diffHours} 小时前更新`;
  }

  infoElement.textContent = `${modeText} · ${timeAgo} · 保留最近 ${dataConfig.dataRetentionDays || 7} 天`;
}

function updateMetrics() {
  const competitors = getCompetitors();
  const totalUpdates = competitors.reduce((sum, competitor) => sum + getRecentUpdates(competitor).length, 0);

  document.getElementById('metricSources').textContent = competitors.length;
  document.getElementById('metricUpdates').textContent = totalUpdates;
  document.getElementById('totalCount').textContent = `${competitors.length} 个来源 · ${totalUpdates} 条动态`;
}

function renderSidebar() {
  const container = document.getElementById('competitorsList');
  container.innerHTML = '';

  const competitors = getCompetitors();
  const totalUpdates = competitors.reduce((sum, competitor) => sum + getRecentUpdates(competitor).length, 0);

  container.appendChild(createCompetitorItem({
    name: '全部动态',
    count: totalUpdates,
    color: '#2563eb',
    active: currentCompetitor === 'all',
    onClick: () => selectCompetitor('all')
  }));

  const colors = ['#dc2626', '#d97706', '#059669', '#2563eb', '#7c3aed', '#db2777', '#0891b2', '#475569', '#16a34a', '#ea580c', '#0f766e', '#be123c'];
  competitors.forEach((competitor, index) => {
    container.appendChild(createCompetitorItem({
      name: competitor.name,
      count: getRecentUpdates(competitor).length,
      color: colors[index % colors.length],
      active: currentCompetitor === competitor.name,
      onClick: () => selectCompetitor(competitor.name)
    }));
  });
}

function createCompetitorItem({ name, count, color, active, onClick }) {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = `competitor-item ${active ? 'active' : ''}`;
  item.onclick = onClick;
  item.innerHTML = `
    <span class="competitor-dot" style="background: ${color};"></span>
    <span class="competitor-info">
      <span class="competitor-item-name">${escapeHtml(name)}</span>
    </span>
    <span class="competitor-count">${count}</span>
  `;
  return item;
}

function selectCompetitor(name) {
  currentCompetitor = name;

  if (name === 'all') {
    document.getElementById('currentTitle').textContent = '全部动态';
    document.getElementById('currentSubtitle').textContent = '追踪竞品、链上风控和威胁情报来源的近七日公开动态';
  } else {
    const competitor = allData[name];
    const count = getRecentUpdates(competitor).length;
    document.getElementById('currentTitle').textContent = competitor.name;
    document.getElementById('currentSubtitle').textContent = `${competitor.category || '情报来源'} · 近七日 ${count} 条动态`;
  }

  renderSidebar();
  renderUpdates();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderUpdates() {
  const container = document.getElementById('updatesList');
  container.innerHTML = '';

  let updates = getVisibleUpdates();

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    updates = updates.filter((update) =>
      (update.title || '').toLowerCase().includes(query) ||
      (update.summary || '').toLowerCase().includes(query)
    );
  }

  if (updates.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">空</div>
        <p>暂无符合条件的动态</p>
      </div>
    `;
    return;
  }

  updates.forEach((update) => {
    const card = document.createElement('article');
    card.className = 'update-card';
    const source = update.source || 'Website';
    const sourceText = getSourceLabel(update);
    const sourceIcon = sourceIcons[source] || '情';

    card.innerHTML = `
      <div class="update-header">
        <div class="update-icon">${escapeHtml(sourceIcon)}</div>
        <div class="update-content">
          <span class="update-source">${escapeHtml(update.competitorName)} · 来源：${escapeHtml(sourceText)}</span>
          <h3 class="update-title">${escapeHtml(update.title || '无标题')}</h3>
          ${update.summary ? `<p class="update-summary">${escapeHtml(update.summary)}</p>` : ''}
        </div>
      </div>
      <div class="update-footer">
        <span class="update-date">${formatDate(update.date)} · ${escapeHtml(update.competitorCategory || '情报')}</span>
        <a href="${escapeAttribute(update.link || '#')}" target="_blank" rel="noopener noreferrer" class="read-more">阅读原文 →</a>
      </div>
    `;

    container.appendChild(card);
  });
}

function handleSearch() {
  searchQuery = document.getElementById('searchInput').value.trim();
  renderUpdates();
}

async function refreshData() {
  const btn = document.getElementById('refreshBtn');
  const originalHTML = btn.innerHTML;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000);
  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span><span>刷新中</span>';

  try {
    const response = await fetch('/api/refresh', {
      method: 'POST',
      signal: controller.signal
    });
    if (!response.ok) throw new Error('刷新失败');
    await loadData();
    btn.innerHTML = '<span>✓</span><span>已刷新</span>';
  } catch (error) {
    btn.innerHTML = `<span>!</span><span>${error.name === 'AbortError' ? '刷新超时' : '刷新失败'}</span>`;
  } finally {
    clearTimeout(timeoutId);
  }

  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }, 1600);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '发布时间未知';

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

loadData();
