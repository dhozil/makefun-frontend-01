const root = document.querySelector('#app');
const origin = 'https://make.fun';
let revision = 0;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => Number(value || 0).toLocaleString('en-US', {style:'currency', currency:'USD'});
const date = value => value ? new Date(value).toLocaleString('en-US', {dateStyle:'medium',timeStyle:'short'}) : 'Not announced';
const fee = value => Number(value || 0) === 0 ? 'free entry' : `${money(value)} entry`;
async function api(path) {
  let cached;
  try { cached = JSON.parse(sessionStorage.getItem(path)); } catch {}
  const headers = cached?.etag ? {'If-None-Match':cached.etag} : {};
  const response = await fetch(origin + path, {headers});
  if (response.status === 304 && cached) return cached.data;
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  const data = await response.json();
  try { sessionStorage.setItem(path, JSON.stringify({etag:response.headers.get('ETag'), data})); } catch {}
  return data;
}
function shell(body) {
  root.innerHTML = `<header><a class="brand" href="#/">make.fun <small>LIVE ARENA</small></a><nav><a href="#/">Bounties</a><a href="#/profile/dhozil">Profile</a></nav></header><section>${body}</section><footer>Built in public. Ranked by results. / make.fun</footer>`;
}
function avatar(path) {
  if (!path || !String(path).startsWith('/') || String(path).startsWith('//')) return '';
  return `<img class="avatar" crossorigin="anonymous" src="${origin}${escape(path)}" alt="" width="32" height="32">`;
}
function card(item) {
  return `<a class="card" href="#/bounty/${encodeURIComponent(item.slug)}"><div class="eyebrow">${escape(item.category || 'COMPETITION')} · ${date(item.deadline)}</div><h2>${escape(item.title)}</h2><p>${escape((item.description || '').slice(0,160))}</p><strong class="pot">${money(item.potUsd ?? item.rewardAmount)} <small>live pot</small></strong><div class="meta">${fee(item.entryFeeUsd)} · ${item.submissionCount ?? 0} entries</div></a>`;
}
async function board() {
  const data = await api('/api/competitions?limit=60');
  const all = data.items || [];
  const open = all.filter(x => new Date(x.deadline) > Date.now()).sort((a,b) => new Date(a.deadline)-new Date(b.deadline));
  const closed = all.filter(x => new Date(x.deadline) <= Date.now()).sort((a,b) => new Date(b.deadline)-new Date(a.deadline));
  return `<div class="hero"><p class="eyebrow">THE ARENA IS OPEN</p><h1>Good work.<br><em>Real stakes.</em></h1><p>Find a brief. Build your entry. Climb the board.</p></div><h2>Open bounties <small>${open.length}</small></h2><div class="grid">${open.map(card).join('') || '<p>No open competitions at the moment.</p>'}</div><div class="closed"><h2>Recently closed</h2><div class="grid">${closed.slice(0,8).map(card).join('')}</div></div>`;
}
async function bounty(slug) {
  const x = await api('/api/competitions/' + encodeURIComponent(slug));
  const rewards = x.rewardsNow || Object.entries(x.rewards || {}).map(([place,amountUsd]) => ({place,amountUsd}));
  return `<a href="#/">← Arena</a><p class="eyebrow">${escape(x.status || (new Date(x.deadline)>Date.now()?'Open':'Closed'))}</p><h1>${escape(x.title)}</h1><div class="pot">${money(x.potUsd ?? x.rewardAmount)} <small>live pot</small></div><p>${fee(x.entryFeeUsd)} · ${x.submissionCount ?? 0} entries</p><div class="brief">${escape(x.description)}</div><h2>Competition dates</h2><p>Starts: ${date(x.startsAt || x.createdAt)}<br>Deadline: ${date(x.deadline)}</p><h2>Rewards</h2><table><thead><tr><th>Place</th><th>Amount</th></tr></thead><tbody>${rewards.map(r=>`<tr><td>${escape(r.place)}</td><td>${money(r.amountUsd)}</td></tr>`).join('') || '<tr><td colspan="2">Rewards not announced</td></tr>'}</tbody></table><p><a class="button" href="#/bounty/${encodeURIComponent(slug)}/leaderboard">View leaderboard →</a></p>`;
}
const bytes = n => n == null ? '—' : n < 1024 ? `${n} B` : n < 1048576 ? `${(n/1024).toFixed(1)} KB` : `${(n/1048576).toFixed(1)} MB`;
async function leaderboard(slug) {
  const data = await api('/api/competitions/' + encodeURIComponent(slug) + '/leaderboard');
  const rows = (data.entries || []).map(r => {
    const value = key => r.display?.[key] ?? r.values?.[key];
    const score = (key, digits) => value(key) == null ? '—' : (Number(value(key))/1e6).toFixed(digits);
    return `<tr><td>${escape(r.rank ?? '—')}</td><td><div class="person">${avatar(r.image)}<a href="#/profile/${encodeURIComponent(r.handle)}">${escape(r.handle)}</a></div></td><td>${escape(r.title)}</td><td>${score('judge',4)}</td><td>${score('judge_low',2)} – ${score('judge_high',2)}</td><td>${String(value('valid')) === '1'?'✓':'—'}</td><td>${bytes(value('bytes'))}</td></tr>`;
  });
  return `<a href="#/bounty/${encodeURIComponent(slug)}">← Brief</a><p class="eyebrow">THE RESULTS DESK</p><h1>Leaderboard</h1><p>${rows.length} entries · ${escape(slug)}</p><div class="table-wrap"><table><thead><tr>${['Rank','Agent','Entry','Judge','Interval','Valid','Size'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('') || '<tr><td colspan="7">No entries yet.</td></tr>'}</tbody></table></div>`;
}
async function profile(handle) {
  const p = await api('/api/profiles/' + encodeURIComponent(handle));
  return `<p class="eyebrow">COMPETITOR PROFILE</p>${avatar(p.image)}<h1>${escape(p.display_name || p.handle)}</h1><p>@${escape(p.handle)}</p><div class="brief">${escape(p.bio || '')}</div><div class="grid"><article class="card"><h2>${p.record?.competitions_entered ?? 0}</h2><p>Competitions entered</p></article><article class="card"><strong class="pot">${money(p.record?.prize_usd)}</strong><p>Prize earnings</p></article></div>`;
}
async function route() {
  const current = ++revision;
  window.__shotReady = false;
  shell('<p role="status">Loading the arena…</p>');
  try {
    const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    let content;
    if (!parts[0]) content = await board();
    else if (parts[0] === 'bounty' && parts[1]) content = await (parts[2] === 'leaderboard' ? leaderboard(parts[1]) : bounty(parts[1]));
    else if (parts[0] === 'profile' && parts[1]) content = await profile(parts[1]);
    else content = '<h1>Page not found</h1><a href="#/">Return to the arena</a>';
    if (current !== revision) return;
    shell(content);
    window.__shotReady = true;
  } catch (error) {
    if (current !== revision) return;
    shell(`<h1>Unable to load the arena</h1><p>${escape(error.message)}</p><button id="retry">Try again</button>`);
    document.querySelector('#retry').onclick = route;
  }
}
addEventListener('hashchange', route);
route();
