const origin = 'https://make.fun';
const root = document.querySelector('#app');
const cache = new Map();
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const calendar = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
let navigation = 0;

function escape(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, character => entities[character]);
}

function money(value) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? currency.format(amount) : '—';
}

function date(value) {
  const timestamp = value ? new Date(value) : null;
  return timestamp && Number.isFinite(timestamp.getTime()) ? calendar.format(timestamp) : 'Not announced';
}

function entryFee(value) {
  return Number(value) > 0 ? `${money(value)} entry` : 'free entry';
}

function bountyLink(slug) {
  return `#/bounty/${encodeURIComponent(slug)}`;
}

async function request(path) {
  let previous = cache.get(path);
  if (!previous) {
    try {
      const stored = JSON.parse(sessionStorage.getItem(path));
      if (stored && Object.hasOwn(stored, 'data')) previous = stored;
    } catch {}
  }

  const response = await fetch(origin + path, {
    headers: typeof previous?.etag === 'string' ? { 'If-None-Match': previous.etag } : {},
    redirect: 'error'
  });
  if (response.status === 304 && previous) {
    cache.set(path, previous);
    return previous.data;
  }
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);

  const record = { data: await response.json(), etag: response.headers.get('ETag') };
  cache.set(path, record);
  try {
    sessionStorage.setItem(path, JSON.stringify(record));
  } catch {}
  return record.data;
}

function picture(path) {
  if (typeof path !== 'string' || !path) return '';
  let url;
  try {
    url = new URL(path, origin);
  } catch {
    return '';
  }
  if (url.origin !== origin || url.username || url.password) return '';

  const image = document.createElement('img');
  image.crossOrigin = 'anonymous';
  image.referrerPolicy = 'no-referrer';
  image.alt = '';
  image.width = 36;
  image.height = 36;
  image.src = url.href;
  return image.outerHTML;
}

function render(content) {
  const onProfile = location.hash.startsWith('#/profile/');
  root.innerHTML = `
    <header>
      <a class="brand" href="#/">make.fun <small>LIVE ARENA</small></a>
      <nav aria-label="Main navigation">
        <a href="#/"${!onProfile ? ' aria-current="page"' : ''}>Bounties</a>
        <a href="#/profile/dhozil"${onProfile ? ' aria-current="page"' : ''}>Profile</a>
      </nav>
    </header>
    <section>${content}</section>
    <footer>Make your next idea count. / make.fun</footer>`;
}

function card(item) {
  return `
    <a class="card" href="${bountyLink(item.slug)}">
      <small>${escape(item.category || 'BOUNTY')} · ${escape(date(item.deadline))}</small>
      <h2>${escape(item.title)}</h2>
      <p>${escape((item.description || '').slice(0, 150))}</p>
      <strong class="pot">${money(item.potUsd ?? item.rewardAmount)} <small>live pot</small></strong>
      <p>${entryFee(item.entryFeeUsd)} · ${escape(item.submissionCount ?? 0)} entries</p>
    </a>`;
}

async function board() {
  const result = await request('/api/competitions?limit=60');
  const items = Array.isArray(result.items) ? result.items : [];
  const now = Date.now();
  const open = items
    .filter(item => new Date(item.deadline).getTime() > now)
    .sort((first, second) => new Date(first.deadline) - new Date(second.deadline));
  const closed = items
    .filter(item => new Date(item.deadline).getTime() <= now)
    .sort((first, second) => new Date(second.deadline) - new Date(first.deadline));

  return `
    <div class="hero">
      <small>BUILD. ENTER. COMPETE.</small>
      <h1>Ideas deserve<br><em>a real arena.</em></h1>
      <p>Find a challenge and put your work in play.</p>
    </div>
    <h2>Open bounties · ${open.length}</h2>
    <div class="grid">${open.map(card).join('') || '<p class="empty">No open bounties right now.</p>'}</div>
    <div class="closed">
      <h2>Recently closed</h2>
      <div class="grid">${closed.slice(0, 8).map(card).join('') || '<p class="empty">No closed bounties yet.</p>'}</div>
    </div>`;
}

async function bounty(slug) {
  const item = await request(`/api/competitions/${encodeURIComponent(slug)}`);
  const rewards = Array.isArray(item.rewardsNow)
    ? item.rewardsNow
    : Object.entries(item.rewards || {}).map(([place, amountUsd]) => ({ place, amountUsd }));
  const status = item.status || (new Date(item.deadline).getTime() > Date.now() ? 'Open' : 'Closed');
  const rows = rewards.map(reward => `
    <tr><td>${escape(reward.place)}</td><td>${money(reward.amountUsd)}</td></tr>`).join('');

  return `
    <a href="#/">← Bounties</a>
    <p class="label">${escape(status)}</p>
    <h1>${escape(item.title)}</h1>
    <strong class="pot">${money(item.potUsd ?? item.rewardAmount)} <small>live pot</small></strong>
    <p>${entryFee(item.entryFeeUsd)} · ${escape(item.submissionCount ?? 0)} entries</p>
    <p class="description">${escape(item.description)}</p>
    <h2>Dates</h2>
    <p>Starts: ${escape(date(item.opensAt || item.startsAt || item.publishedAt || item.createdAt))}<br>
      Deadline: ${escape(date(item.deadline))}</p>
    <h2>Rewards</h2>
    <table>
      <caption class="sr-only">Current rewards by finishing place</caption>
      <thead><tr><th scope="col">Place</th><th scope="col">Reward</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="2">Rewards not announced.</td></tr>'}</tbody>
    </table>
    <p><a class="button" href="${bountyLink(slug)}/leaderboard">See leaderboard →</a></p>`;
}

function humanSize(value) {
  if (value == null || value === '') return '—';
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

function score(value, precision) {
  if (value == null || value === '') return '—';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? (numeric / 1e6).toFixed(precision) : '—';
}

async function leaderboard(slug) {
  const result = await request(`/api/competitions/${encodeURIComponent(slug)}/leaderboard`);
  const entries = Array.isArray(result.entries) ? result.entries : [];
  const rows = entries.map(entry => {
    const field = name => entry.values?.[name] ?? entry.display?.[name] ?? entry[name];
    const low = field('judge_low') ?? entry.interval?.low;
    const high = field('judge_high') ?? entry.interval?.high;
    return `
      <tr>
        <td class="numeric">${escape(entry.rank ?? '—')}</td>
        <td><div class="person">${picture(entry.image)}<a href="#/profile/${encodeURIComponent(entry.handle)}">${escape(entry.handle)}</a></div></td>
        <td class="entry-title">${escape(entry.title)}</td>
        <td class="numeric">${score(field('judge'), 4)}</td>
        <td class="numeric">${score(low, 2)} – ${score(high, 2)}</td>
        <td class="numeric">${String(field('valid')) === '1' ? '✓' : '—'}</td>
        <td class="numeric">${humanSize(field('bytes'))}</td>
      </tr>`;
  });

  return `
    <a href="${bountyLink(slug)}">← Bounty</a>
    <p class="label">THE RESULTS</p>
    <h1>Leaderboard</h1>
    <p>${escape(slug)} · ${rows.length} entries</p>
    <div class="table-wrap" tabindex="0" role="region" aria-label="Leaderboard, scroll horizontally for all columns">
      <table>
        <caption class="sr-only">Ranked entries for ${escape(slug)}</caption>
        <thead><tr>
          <th scope="col">Rank</th><th scope="col">Handle</th><th scope="col">Title</th>
          <th scope="col">Judge</th><th scope="col">Interval</th><th scope="col">Valid</th><th scope="col">Bytes</th>
        </tr></thead>
        <tbody>${rows.join('') || '<tr><td colspan="7">No entries yet.</td></tr>'}</tbody>
      </table>
    </div>`;
}

async function profile(handle) {
  const person = await request(`/api/profiles/${encodeURIComponent(handle)}`);
  const record = person.record || {};
  return `
    <p class="label">BUILDER PROFILE</p>
    ${picture(person.picture || person.image || person.avatar)}
    <h1>${escape(person.display_name || person.handle || handle)}</h1>
    <p>@${escape(person.handle || handle)}</p>
    <p class="description">${escape(person.bio || 'This builder has not added a bio yet.')}</p>
    <div class="grid">
      <article class="card"><h2>${escape(record.competitions_entered ?? 0)}</h2><p>Competitions entered</p></article>
      <article class="card"><strong class="pot">${money(record.prize_usd)}</strong><p>Prize earnings</p></article>
      <article class="card"><h2>${escape(record.competitions_won ?? 0)}</h2><p>Competitions won</p></article>
      <article class="card"><h2>${escape(record.competitions_placed ?? 0)}</h2><p>Prize placements</p></article>
    </div>`;
}

async function navigate() {
  const current = ++navigation;
  window.__shotReady = false;
  root.setAttribute('aria-busy', 'true');
  render('<p role="status">Loading…</p>');

  try {
    const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    const [surface, identifier, tab] = parts;
    let content;
    if (!surface && parts.length === 1) {
      content = await board();
    } else if (surface === 'bounty' && identifier && parts.length <= 3 && (!tab || tab === 'leaderboard')) {
      content = await (tab ? leaderboard(identifier) : bounty(identifier));
    } else if (surface === 'profile' && identifier && parts.length === 2) {
      content = await profile(identifier);
    } else {
      content = '<h1>Page not found</h1><a href="#/">Browse bounties</a>';
    }
    if (current !== navigation) return;
    render(content);
    root.setAttribute('aria-busy', 'false');
    window.__shotReady = true;
  } catch (error) {
    if (current !== navigation) return;
    render(`
      <div role="alert">
        <h1>Could not load this page</h1>
        <p>${escape(error.message)}</p>
        <button id="retry" type="button">Retry</button>
      </div>`);
    root.querySelector('#retry').addEventListener('click', navigate);
    root.setAttribute('aria-busy', 'false');
    window.__shotReady = true;
  }
}

window.addEventListener('hashchange', navigate);
navigate();
