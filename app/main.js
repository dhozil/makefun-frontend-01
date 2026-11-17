const origin = 'https://make.fun';
const root = document.querySelector('#app');
const cache = new Map();
let navigation = 0;

function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}
const money = value => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const date = value => value ? new Date(value).toLocaleString() : 'Not announced';
const entryFee = value => Number(value) ? `${money(value)} entry` : 'free entry';
const link = slug => `#/bounty/${encodeURIComponent(slug)}`;

async function request(path) {
  let previous = cache.get(path);
  if (!previous) {
    try { previous = JSON.parse(sessionStorage.getItem(path)); } catch {}
  }
  const response = await fetch(origin + path, {
    headers: previous?.etag ? { 'If-None-Match': previous.etag } : {}
  });
  if (response.status === 304 && previous) {
    cache.set(path, previous);
    return previous.data;
  }
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const record = { data: await response.json(), etag: response.headers.get('ETag') };
  cache.set(path, record);
  try { sessionStorage.setItem(path, JSON.stringify(record)); } catch {}
  return record.data;
}

function picture(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return '';
  const image = document.createElement('img');
  image.crossOrigin = 'anonymous';
  image.src = origin + path;
  image.alt = '';
  image.width = 36;
  image.height = 36;
  return image.outerHTML;
}

function render(content) {
  root.innerHTML = `<header><a class="brand" href="#/">make.fun <small>LIVE ARENA</small></a>
    <nav><a href="#/">Bounties</a><a href="#/profile/dhozil">Profile</a></nav></header>
    <section>${content}</section><footer>Make your next idea count. / make.fun</footer>`;
}

function card(item) {
  return `<a class="card" href="${link(item.slug)}">
    <small>${escape(item.category || 'BOUNTY')} · ${escape(date(item.deadline))}</small>
    <h2>${escape(item.title)}</h2><p>${escape((item.description || '').slice(0, 150))}</p>
    <strong class="pot">${money(item.potUsd ?? item.rewardAmount)} <small>live pot</small></strong>
    <p>${entryFee(item.entryFeeUsd)} · ${escape(item.submissionCount ?? 0)} entries</p></a>`;
}

async function board() {
  const result = await request('/api/competitions?limit=60');
  const items = result.items || [];
  const now = Date.now();
  const open = items.filter(item => new Date(item.deadline).getTime() > now)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const closed = items.filter(item => new Date(item.deadline).getTime() <= now)
    .sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
  return `<div class="hero"><small>BUILD. ENTER. COMPETE.</small>
    <h1>Ideas deserve<br><em>a real arena.</em></h1><p>Find a challenge and put your work in play.</p></div>
    <h2>Open bounties · ${open.length}</h2><div class="grid">${open.map(card).join('') || '<p>No open bounties.</p>'}</div>
    <div class="closed"><h2>Recently closed</h2><div class="grid">${closed.slice(0, 8).map(card).join('') || '<p>No closed bounties.</p>'}</div></div>`;
}

async function bounty(slug) {
  const item = await request(`/api/competitions/${encodeURIComponent(slug)}`);
  const rewards = item.rewardsNow || Object.entries(item.rewards || {}).map(([place, amountUsd]) => ({ place, amountUsd }));
  return `<a href="#/">← Bounties</a><p class="label">${escape(item.status || (new Date(item.deadline) > new Date() ? 'Open' : 'Closed'))}</p>
    <h1>${escape(item.title)}</h1><strong class="pot">${money(item.potUsd ?? item.rewardAmount)} <small>live pot</small></strong>
    <p>${entryFee(item.entryFeeUsd)} · ${escape(item.submissionCount ?? 0)} entries</p>
    <p class="description">${escape(item.description)}</p><h2>Dates</h2>
    <p>Starts: ${escape(date(item.startsAt || item.publishedAt || item.createdAt))}<br>Deadline: ${escape(date(item.deadline))}</p>
    <h2>Rewards</h2><table><thead><tr><th>Place</th><th>Reward</th></tr></thead><tbody>
    ${rewards.map(reward => `<tr><td>${escape(reward.place)}</td><td>${money(reward.amountUsd)}</td></tr>`).join('') || '<tr><td colspan="2">Rewards not announced.</td></tr>'}
    </tbody></table><p><a class="button" href="${link(slug)}/leaderboard">See leaderboard →</a></p>`;
}

function humanSize(value) {
  if (value == null) return '—';
  const bytes = Number(value);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

async function leaderboard(slug) {
  const result = await request(`/api/competitions/${encodeURIComponent(slug)}/leaderboard`);
  const rows = (result.entries || []).map(entry => {
    const field = name => entry.display?.[name] ?? entry.values?.[name] ?? entry[name];
    const score = (name, precision) => field(name) == null ? '—' : (Number(field(name)) / 1e6).toFixed(precision);
    return `<tr><td>${escape(entry.rank ?? '—')}</td>
      <td><div class="person">${picture(entry.image)}<a href="#/profile/${encodeURIComponent(entry.handle)}">${escape(entry.handle)}</a></div></td>
      <td>${escape(entry.title)}</td><td>${score('judge', 4)}</td>
      <td>${score('judge_low', 2)} – ${score('judge_high', 2)}</td>
      <td>${String(field('valid')) === '1' ? '✓' : '—'}</td><td>${humanSize(field('bytes'))}</td></tr>`;
  });
  return `<a href="${link(slug)}">← Bounty</a><p class="label">THE RESULTS</p><h1>Leaderboard</h1>
    <p>${escape(slug)} · ${rows.length} entries</p><div class="table-wrap"><table>
    <thead><tr><th>Rank</th><th>Handle</th><th>Title</th><th>Judge</th><th>Interval</th><th>Valid</th><th>Bytes</th></tr></thead>
    <tbody>${rows.join('') || '<tr><td colspan="7">No entries yet.</td></tr>'}</tbody></table></div>`;
}

async function profile(handle) {
  const person = await request(`/api/profiles/${encodeURIComponent(handle)}`);
  return `<p class="label">BUILDER PROFILE</p>${picture(person.picture)}
    <h1>${escape(person.display_name || person.handle)}</h1><p>@${escape(person.handle)}</p>
    <p class="description">${escape(person.bio)}</p><div class="grid">
    <article class="card"><h2>${escape(person.record?.competitions_entered ?? 0)}</h2><p>Competitions entered</p></article>
    <article class="card"><strong class="pot">${money(person.record?.prize_usd)}</strong><p>Prize earnings</p></article></div>`;
}

async function navigate() {
  const current = ++navigation;
  window.__shotReady = false;
  render('<p role="status">Loading…</p>');
  try {
    const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    const [surface, identifier, tab] = parts;
    let content;
    if (!surface) content = await board();
    else if (surface === 'bounty' && identifier && parts.length <= 3 && (!tab || tab === 'leaderboard')) {
      content = await (tab ? leaderboard(identifier) : bounty(identifier));
    } else if (surface === 'profile' && identifier && parts.length === 2) content = await profile(identifier);
    else content = '<h1>Page not found</h1><a href="#/">Browse bounties</a>';
    if (current !== navigation) return;
    render(content);
    window.__shotReady = true;
  } catch (error) {
    if (current !== navigation) return;
    render(`<div role="alert"><h1>Could not load this page</h1><p>${escape(error.message)}</p><button id="retry">Retry</button></div>`);
    root.querySelector('#retry').addEventListener('click', navigate);
    window.__shotReady = true;
  }
}

window.addEventListener('hashchange', navigate);
navigate();
