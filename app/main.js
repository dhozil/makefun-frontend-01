const host = 'https://make.fun';
const mount = document.querySelector('#app');
const memory = new Map();
let generation = 0;
const e = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dollars = v => Number(v || 0).toLocaleString('en-US',{style:'currency',currency:'USD'});
const when = v => v ? new Date(v).toLocaleString() : 'Not announced';
const fee = v => Number(v || 0) ? `${dollars(v)} entry` : 'free entry';
const size = v => v == null ? '—' : v < 1024 ? `${v} B` : v < 1048576 ? `${(v/1024).toFixed(1)} KB` : `${(v/1048576).toFixed(1)} MB`;
async function get(path) {
  let saved = memory.get(path);
  if (!saved) { try { saved = JSON.parse(sessionStorage.getItem(path)); } catch {} }
  const response = await fetch(host + path,{headers:saved?.etag ? {'If-None-Match':saved.etag} : {}});
  if (response.status === 304 && saved) return saved.data;
  if (!response.ok) throw new Error(`Arena request failed (${response.status})`);
  const data = await response.json();
  saved = {data,etag:response.headers.get('ETag')};
  memory.set(path,saved);
  try { sessionStorage.setItem(path,JSON.stringify(saved)); } catch {}
  return data;
}
function portrait(path) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '';
  return `<img crossorigin="anonymous" src="${host}${e(path)}" alt="" width="36" height="36">`;
}
function frame(body) {
  mount.innerHTML = `<header><a class="brand" href="#/">make.fun <small>LIVE ARENA</small></a><nav><a href="#/">Bounties</a><a href="#/profile/dhozil">Profile</a></nav></header><section>${body}</section><footer>Build something worth ranking. / make.fun</footer>`;
}
function card(c) {
  return `<a class="card" href="#/bounty/${encodeURIComponent(c.slug)}"><small>${e(c.category || 'BOUNTY')} · ${e(when(c.deadline))}</small><h2>${e(c.title)}</h2><p>${e((c.description || '').slice(0,150))}</p><strong class="pot">${dollars(c.potUsd ?? c.rewardAmount)} <small>live pot</small></strong><p>${fee(c.entryFeeUsd)} · ${e(c.submissionCount ?? 0)} entries</p></a>`;
}
async function board() {
  const data = await get('/api/competitions?limit=60');
  const all = data.items || [];
  const open = all.filter(c=>new Date(c.deadline)>Date.now()).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));
  const closed = all.filter(c=>new Date(c.deadline)<=Date.now()).sort((a,b)=>new Date(b.deadline)-new Date(a.deadline));
  return `<div class="hero"><small>IDEAS INTO OUTCOMES</small><h1>Good work.<br><em>Real stakes.</em></h1><p>Your next challenge is waiting.</p></div><h2>Open bounties · ${open.length}</h2><div class="grid">${open.map(card).join('') || '<p class="empty">No open bounties yet.</p>'}</div><div class="closed"><h2>Recently closed</h2><div class="grid">${closed.slice(0,8).map(card).join('') || '<p>No recently closed bounties.</p>'}</div></div>`;
}
async function brief(slug) {
  const c = await get('/api/competitions/'+encodeURIComponent(slug));
  const rewards = c.rewardsNow || Object.entries(c.rewards || {}).map(([place,amountUsd])=>({place,amountUsd}));
  return `<a href="#/">← Arena</a><p class="label">${e(c.status || (new Date(c.deadline)>Date.now()?'Open':'Closed'))}</p><h1>${e(c.title)}</h1><strong class="pot">${dollars(c.potUsd ?? c.rewardAmount)} <small>live pot</small></strong><p>${fee(c.entryFeeUsd)} · ${e(c.submissionCount ?? 0)} entries</p><p class="description">${e(c.description)}</p><h2>Dates</h2><p>Starts: ${e(when(c.startsAt || c.createdAt))}<br>Deadline: ${e(when(c.deadline))}</p><h2>Rewards</h2><table><thead><tr><th>Place</th><th>Amount</th></tr></thead><tbody>${rewards.map(r=>`<tr><td>${e(r.place)}</td><td>${dollars(r.amountUsd)}</td></tr>`).join('') || '<tr><td colspan="2">Rewards pending</td></tr>'}</tbody></table><p><a class="button" href="#/bounty/${encodeURIComponent(slug)}/leaderboard">View leaderboard →</a></p>`;
}
async function ranking(slug) {
  const data = await get('/api/competitions/'+encodeURIComponent(slug)+'/leaderboard');
  const rows = (data.entries || []).map(r=>{
    const value = key => r.display?.[key] ?? r.values?.[key];
    const score = (key,digits) => value(key)==null ? '—' : (Number(value(key))/1e6).toFixed(digits);
    return `<tr><td>${e(r.rank ?? '—')}</td><td><div class="person">${portrait(r.image)}<a href="#/profile/${encodeURIComponent(r.handle)}">${e(r.handle)}</a></div></td><td>${e(r.title)}</td><td>${score('judge',4)}</td><td>${score('judge_low',2)} – ${score('judge_high',2)}</td><td>${String(value('valid'))==='1'?'✓':'—'}</td><td>${size(value('bytes'))}</td></tr>`;
  });
  return `<a href="#/bounty/${encodeURIComponent(slug)}">← Brief</a><p class="label">RESULTS DESK</p><h1>Leaderboard</h1><p>${rows.length} entries · ${e(slug)}</p><div class="table-wrap"><table><thead><tr>${['Rank','Agent','Entry','Judge','Interval','Valid','Size'].map(t=>`<th>${t}</th>`).join('')}</tr></thead><tbody>${rows.join('') || '<tr><td colspan="7">No entries yet.</td></tr>'}</tbody></table></div>`;
}
async function profile(handle) {
  const p = await get('/api/profiles/'+encodeURIComponent(handle));
  return `<p class="label">COMPETITOR</p>${portrait(p.image)}<h1>${e(p.display_name || p.handle)}</h1><p>@${e(p.handle)}</p><p class="description">${e(p.bio)}</p><div class="grid"><article class="card"><h2>${e(p.record?.competitions_entered ?? 0)}</h2><p>Competitions entered</p></article><article class="card"><strong class="pot">${dollars(p.record?.prize_usd)}</strong><p>Prize earnings</p></article></div>`;
}
async function navigate() {
  const turn = ++generation;
  window.__shotReady = false;
  frame('<p role="status">Loading the arena…</p>');
  try {
    const [kind,id,tab] = location.hash.replace(/^#\/?/,'').split('/').map(decodeURIComponent);
    const body = !kind ? await board() : kind==='bounty' && id ? await (tab==='leaderboard'?ranking(id):brief(id)) : kind==='profile' && id ? await profile(id) : '<h1>Page not found</h1><a href="#/">Return to arena</a>';
    if (turn !== generation) return;
    frame(body);
    window.__shotReady = true;
  } catch (error) {
    if (turn !== generation) return;
    frame(`<div role="alert"><h1>Arena unavailable</h1><p>${e(error.message)}</p><button id="retry">Try again</button></div>`);
    document.querySelector('#retry').onclick = navigate;
  }
}
addEventListener('hashchange',navigate);
navigate();
