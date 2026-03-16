// admin/analytics.js - Catholic Market Analytics Dashboard

// ── Auth Check ──────────────────────────────────────────────────────────────
(async () => {
  try {
    const r = await fetch('/api/admin/check-auth');
    if (!r.ok) {
      window.location.href = '/admin/login.html';
    }
  } catch (e) {
    window.location.href = '/admin/login.html';
  }
})();

// ── Logout ───────────────────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  window.location.href = '/admin/login.html';
});

// ── Event Type Config ────────────────────────────────────────────────────────
const EVENT_TYPE_CONFIG = {
  card_click:       { label: 'Card Clicks',     color: '#5b8def' },
  directions_click: { label: 'Directions',       color: '#34d399' },
  website_click:    { label: 'Website Clicks',   color: '#a78bfa' },
  tag_click:        { label: 'Tag Clicks',        color: '#fbbf24' },
  dwell:            { label: '5min+ Views',       color: '#f87171' }
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  return Number(n || 0).toLocaleString();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ── Load Summary (KPI cards + 30-day bar chart) ──────────────────────────────
async function loadSummary() {
  try {
    const r = await fetch('/api/admin/analytics/summary');
    if (!r.ok) throw new Error('Failed');
    const data = await r.json();

    document.getElementById('kpiTotal').textContent = fmt(data.total);
    document.getElementById('kpiToday').textContent = fmt(data.today);
    document.getElementById('kpiDwell').textContent = fmt(data.dwellTotal);
    document.getElementById('kpiUnique').textContent = fmt(data.uniqueBusinesses);

    renderBarChart(data.last30Days || []);
  } catch (e) {
    console.error('loadSummary error:', e);
  }
}

function renderBarChart(rows) {
  const wrap = document.getElementById('barChartWrap');
  wrap.innerHTML = '';

  if (!rows || rows.length === 0) {
    wrap.innerHTML = '<div class="chart-empty">No data for the last 30 days.</div>';
    return;
  }

  // Build a map of date -> count and fill in missing days
  const countMap = {};
  rows.forEach(r => { countMap[r.date] = parseInt(r.count) || 0; });

  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: countMap[key] || 0 });
  }

  const maxCount = Math.max(...days.map(d => d.count), 1);

  days.forEach(day => {
    const pct = Math.round((day.count / maxCount) * 100);
    const heightPct = Math.max(pct, day.count > 0 ? 2 : 1);

    const col = document.createElement('div');
    col.className = 'bar-chart-col';
    col.title = `${day.date}: ${day.count.toLocaleString()} events`;

    const bar = document.createElement('div');
    bar.className = 'bar-chart-bar';
    bar.style.height = heightPct + '%';

    const lbl = document.createElement('div');
    lbl.className = 'bar-chart-label';
    lbl.textContent = formatDateShort(day.date);

    col.appendChild(bar);
    col.appendChild(lbl);
    wrap.appendChild(col);
  });
}

// ── Load Events by Type ──────────────────────────────────────────────────────
async function loadByType(days) {
  const list = document.getElementById('typeBarList');
  list.innerHTML = '<div class="loading-placeholder">Loading...</div>';
  try {
    const r = await fetch(`/api/admin/analytics/by-type?days=${days}`);
    if (!r.ok) throw new Error('Failed');
    const rows = await r.json();

    if (!rows || rows.length === 0) {
      list.innerHTML = '<div class="loading-placeholder">No data for this period.</div>';
      return;
    }

    const maxCount = Math.max(...rows.map(r => parseInt(r.count) || 0), 1);

    list.innerHTML = '';
    rows.forEach(row => {
      const cfg = EVENT_TYPE_CONFIG[row.eventType] || { label: row.eventType, color: '#9ba3c0' };
      const count = parseInt(row.count) || 0;
      const pct = Math.round((count / maxCount) * 100);

      const rowEl = document.createElement('div');
      rowEl.className = 'type-bar-row';
      rowEl.innerHTML = `
        <span class="type-bar-label">${cfg.label}</span>
        <div class="type-bar-track">
          <div class="type-bar-fill" style="width:${pct}%; background:${cfg.color};"></div>
        </div>
        <span class="type-bar-count">${fmt(count)}</span>
      `;
      list.appendChild(rowEl);
    });
  } catch (e) {
    list.innerHTML = '<div class="loading-placeholder">Failed to load.</div>';
    console.error('loadByType error:', e);
  }
}

// ── Load Top Businesses ──────────────────────────────────────────────────────
async function loadTopBusinesses(days) {
  const tbody = document.getElementById('topBizTbody');
  tbody.innerHTML = '<tr><td colspan="8" class="loading-placeholder">Loading...</td></tr>';
  try {
    const r = await fetch(`/api/admin/analytics/top-businesses?limit=20&days=${days}`);
    if (!r.ok) throw new Error('Failed');
    const rows = await r.json();

    if (!rows || rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading-placeholder">No data for this period.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    rows.forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="rank">${i + 1}</td>
        <td class="biz-name">${escapeHtml(row.businessName)}</td>
        <td class="total">${fmt(row.total)}</td>
        <td>${fmt(row.card_clicks)}</td>
        <td>${fmt(row.directions_clicks)}</td>
        <td>${fmt(row.website_clicks)}</td>
        <td>${fmt(row.dwell_sessions)}</td>
        <td>${row.lastSeen ? timeAgo(row.lastSeen) : '–'}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="8" class="loading-placeholder">Failed to load.</td></tr>';
    console.error('loadTopBusinesses error:', e);
  }
}

// ── Load Recent Activity ──────────────────────────────────────────────────────
async function loadRecent() {
  const feed = document.getElementById('activityFeed');
  feed.innerHTML = '<div class="loading-placeholder">Loading...</div>';
  try {
    const r = await fetch('/api/admin/analytics/recent?limit=50');
    if (!r.ok) throw new Error('Failed');
    const rows = await r.json();

    if (!rows || rows.length === 0) {
      feed.innerHTML = '<div class="loading-placeholder">No recent activity.</div>';
      return;
    }

    feed.innerHTML = '';
    rows.forEach(row => {
      const cfg = EVENT_TYPE_CONFIG[row.eventType] || { label: row.eventType, color: '#9ba3c0' };
      const item = document.createElement('div');
      item.className = 'activity-item';
      item.innerHTML = `
        <div class="activity-dot" style="background:${cfg.color};"></div>
        <div class="activity-text">
          <strong>${escapeHtml(row.businessName)}</strong>
          &mdash; ${cfg.label}
        </div>
        <span class="activity-type-badge" style="background:${cfg.color}22; color:${cfg.color};">${cfg.label}</span>
        <span class="activity-time">${timeAgo(row.timestamp)}</span>
      `;
      feed.appendChild(item);
    });
  } catch (e) {
    feed.innerHTML = '<div class="loading-placeholder">Failed to load.</div>';
    console.error('loadRecent error:', e);
  }
}

// ── HTML Escape Helper ────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Date Filter Button Wiring ─────────────────────────────────────────────────
function wireFilterButtons(rowId, onSelect) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.querySelectorAll('.date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      row.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onSelect(parseInt(btn.dataset.days));
    });
  });
}

wireFilterButtons('bizFilterRow', (days) => loadTopBusinesses(days));
wireFilterButtons('typeFilterRow', (days) => loadByType(days));

// ── Initial Load ──────────────────────────────────────────────────────────────
loadSummary();
loadTopBusinesses(30);
loadByType(30);
loadRecent();
