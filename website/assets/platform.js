/** All Talents Agency — shared platform utilities */
export const ASSET_V = '20260619';
export const SHORTLIST_KEY = 'ata_shortlist';
export const SHORTLIST_MAX = 5;

export function formatPrice(n) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

export function getShortlist() {
  try {
    return JSON.parse(localStorage.getItem(SHORTLIST_KEY) || '[]');
  } catch {
    return [];
  }
}

function shortlistApi() {
  const host = location.hostname;
  return host === 'localhost' || host === '127.0.0.1'
    ? 'http://localhost:4100/api'
    : 'https://ata-h0yo.onrender.com/api';
}

function shortlistToken() {
  return localStorage.getItem('ata_token') || localStorage.getItem('aurelux_token') || '';
}

export function setShortlist(ids, { sync = true } = {}) {
  const clean = ids.slice(0, SHORTLIST_MAX);
  localStorage.setItem(SHORTLIST_KEY, JSON.stringify(clean));
  window.dispatchEvent(new CustomEvent('ata-shortlist-change'));
  const token = shortlistToken();
  if (sync && token) {
    fetch(shortlistApi() + '/shortlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ ids: clean }),
    }).catch(() => {});
  }
}

export async function hydrateShortlist() {
  const token = shortlistToken();
  if (!token) return getShortlist();
  try {
    const res = await fetch(shortlistApi() + '/shortlist', { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) return getShortlist();
    const body = await res.json();
    if (Array.isArray(body.ids)) setShortlist(body.ids, { sync: false });
  } catch { /* keep the local board */ }
  return getShortlist();
}

export function toggleShortlist(id) {
  const list = getShortlist();
  const i = list.indexOf(id);
  if (i >= 0) {
    list.splice(i, 1);
  } else {
    if (list.length >= SHORTLIST_MAX) return { ok: false, reason: 'max' };
    list.push(id);
  }
  setShortlist(list);
  return { ok: true, list };
}

export function requireAuth(returnPath) {
  const { token } = window.__ataAuth || {};
  const t = token?.() || localStorage.getItem('ata_token') || localStorage.getItem('aurelux_token');
  if (t) return true;
  const path = returnPath || (location.pathname + location.search);
  localStorage.setItem('ata_return', path.startsWith('/') ? path.slice(1) : path);
  location.href = 'login.html';
  return false;
}

export function consumeReturnUrl() {
  const r = localStorage.getItem('ata_return');
  if (r) {
    localStorage.removeItem('ata_return');
    return r;
  }
  return null;
}

export function getRelatedTalents(target, roster, limit = 8) {
  if (!target || !roster?.length) return [];
  const price = target.startingPrice || 0;
  const scored = roster
    .filter(c => c.id !== target.id)
    .map(c => {
      let score = 0;
      if (c.category === target.category) score += 40;
      if (c.region === target.region) score += 20;
      const p = c.startingPrice || 0;
      if (price && Math.abs(p - price) / price <= 0.3) score += 25;
      score += (c.demandIndex || 0) * 0.15;
      return { c, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(x => x.c);
}

export function renderRelatedRail(container, talents, title = 'Clients also pursued') {
  if (!container || !talents?.length) {
    if (container) container.innerHTML = '';
    return;
  }
  const fmt = formatPrice;
  container.innerHTML = `
    <div class="related-rail-head">
      <p class="eyebrow">${title}</p>
      <a class="related-rail-all" href="explorer.html">View roster →</a>
    </div>
    <div class="related-rail-track">
      ${talents.map(c => `
        <a class="related-card" href="talent.html?id=${c.id}">
          <img src="${c.portrait}" alt="" loading="lazy">
          <div class="related-card-body">
            <span class="related-avail cab-${(c.availability || 'open').toLowerCase()}">${c.availability || 'Open'}</span>
            <h4>${c.name}</h4>
            <p>${c.category} · ${fmt(c.startingPrice)}+</p>
          </div>
        </a>
      `).join('')}
    </div>`;
}

export function renderShortlistTray(roster) {
  let tray = document.getElementById('engagementTray');
  if (!tray) {
    tray = document.createElement('div');
    tray.id = 'engagementTray';
    tray.className = 'engagement-tray';
    document.body.appendChild(tray);
  }
  const ids = getShortlist();
  const map = new Map((roster || []).map(c => [c.id, c]));
  const items = ids.map(id => map.get(id)).filter(Boolean);

  if (!items.length) {
    tray.classList.remove('et-visible');
    tray.innerHTML = '';
    return;
  }

  tray.classList.add('et-visible');
  tray.innerHTML = `
    <div class="et-inner">
      <div class="et-label">Engagement board <span>${items.length}/${SHORTLIST_MAX}</span></div>
      <div class="et-faces">
        ${items.map(c => `
          <a class="et-face" href="talent.html?id=${c.id}" title="${c.name}">
            <img src="${c.portrait}" alt="">
          </a>
        `).join('')}
      </div>
      <div class="et-actions">
        <button type="button" class="et-btn" id="etCompareBtn">Compare</button>
        <a class="et-btn et-primary" href="booking.html?id=${items[0].id}">Book desk →</a>
      </div>
      <button type="button" class="et-clear" id="etClearBtn" aria-label="Clear board">✕</button>
    </div>`;

  document.getElementById('etClearBtn')?.addEventListener('click', () => {
    setShortlist([]);
    renderShortlistTray(roster);
  });
  document.getElementById('etCompareBtn')?.addEventListener('click', () => {
    location.href = 'explorer.html#compare';
  });
}

export function trackEvent(name, detail = {}) {
  try {
    const buf = JSON.parse(sessionStorage.getItem('ata_events') || '[]');
    buf.push({ name, detail, t: Date.now() });
    sessionStorage.setItem('ata_events', JSON.stringify(buf.slice(-50)));
    if (detail.id && (name.includes('view') || name.includes('dossier') || name.includes('booking'))) {
      recordRecentView(detail.id, detail.name || detail.id);
    }
  } catch { /* ignore */ }
}

const RECENT_KEY = 'ata_recent_views';

export function recordRecentView(id, name) {
  try {
    let list = JSON.parse(sessionStorage.getItem(RECENT_KEY) || '[]');
    list = list.filter(x => x.id !== id);
    list.unshift({ id, name: name || id, t: Date.now() });
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
  } catch { /* ignore */ }
}

export function getRecentViews() {
  try {
    return JSON.parse(sessionStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getLocalDemandPulse(celeb) {
  if (!celeb) return { heatLevel: 'normal', label: 'STABLE', message: 'Demand stable' };
  const avail = (celeb.availability || '').toLowerCase();
  const demand = celeb.demandIndex || 0;
  if (avail === 'waitlist' || demand >= 95) {
    return { heatLevel: 'critical', label: 'CRITICAL', message: 'Waitlist pressure — immediate qualification required' };
  }
  if (avail === 'limited' || demand >= 85) {
    return { heatLevel: 'high', label: 'HIGH', message: 'Limited window — inquiry volume elevated' };
  }
  if (demand >= 72) {
    return { heatLevel: 'elevated', label: 'ELEVATED', message: 'Active demand — windows closing' };
  }
  return { heatLevel: 'normal', label: 'STABLE', message: 'Open demand channel' };
}

export function demandPulseHTML(pulse, compact = false) {
  const p = pulse || { heatLevel: 'normal', label: 'STABLE', message: '' };
  if (compact) {
    return `<span class="demand-pulse"><span class="demand-dot dp-${p.heatLevel}"></span><span class="demand-tag dt-${p.heatLevel}">${p.label}</span></span>`;
  }
  return `<div class="demand-pulse"><span class="demand-dot dp-${p.heatLevel}"></span><span class="demand-tag dt-${p.heatLevel}">${p.label}</span><span class="pressure-msg">${p.message || ''}</span></div>`;
}

export async function renderDemandPulse(el, celeb, requestFn, { tryApi = true } = {}) {
  if (!el || !celeb) return;
  const local = getLocalDemandPulse(celeb);
  el.innerHTML = demandPulseHTML(local);
  if (!tryApi || !requestFn) return;
  try {
    const p = await requestFn('/intelligence/pressure/' + celeb.id);
    el.innerHTML = `
      <div class="demand-pulse">
        <span class="demand-dot dp-${p.heatLevel}"></span>
        <span class="demand-tag dt-${p.heatLevel}">${p.heatLevel === 'critical' ? 'CRITICAL' : (p.heatLevel || 'normal').toUpperCase()}</span>
        <span class="pressure-msg">${p.urgencyMessage || local.message}</span>
      </div>`;
  } catch { /* keep local */ }
}

export function observeDemandPulse(container, celeb, requestFn) {
  if (!container || !celeb) return;
  const el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!el) return;
  renderDemandPulse(el, celeb, requestFn);
  if (requestFn) {
    renderDemandPulse(el, celeb, requestFn, { tryApi: true });
  }
}

/** ── Smart roster search (shared: explorer, hero, Cmd+K, API parity) ── */
const SEARCH_GROUP_TAGS = [
  ['bts', 'bts', 'bangtan', 'hybe'],
  ['blackpink', 'blackpink', 'black pink', 'blink'],
  ['beyonce', 'beyonce', 'beyoncé'],
  ['messi', 'messi', 'lionel'],
  ['ronaldo', 'ronaldo', 'cristiano', 'cr7'],
  ['taylor', 'taylor swift', 'swift'],
  ['drake', 'drake', 'ovo'],
  ['kardashian', 'kardashian', 'kim k'],
  ['jenner', 'jenner', 'kylie', 'kendall'],
];

export function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[''`.]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function celebrityHaystack(c) {
  return normalizeSearchText([
    c.name,
    c.id,
    c.category,
    c.region,
    c.agencyRepresentation,
    (c.eliteSignal || '').slice(0, 160),
  ].join(' '));
}

function scoreCelebrityMatch(c, rawQuery) {
  const q = normalizeSearchText(rawQuery);
  if (!q) return 0;
  const nameNorm = normalizeSearchText(c.name);
  const hay = celebrityHaystack(c);
  const tokens = q.split(' ').filter(t => t.length > 0);
  let score = 0;

  if (nameNorm === q) score = 100;
  else if (nameNorm.startsWith(q)) score = Math.max(score, 93);
  else if (nameNorm.includes(q)) score = Math.max(score, 80);

  if (tokens.length > 1 && tokens.every(t => nameNorm.includes(t))) {
    score = Math.max(score, 90);
  }

  tokens.forEach((t) => {
    if (t.length < 2 && !/^\d+$/.test(t)) return;
    const parts = nameNorm.split(' ').filter(Boolean);
    if (parts.some(p => p === t)) score += 28;
    else if (parts.some(p => p.startsWith(t))) score += 20;
    else if (parts.some(p => t.length >= 3 && p.includes(t))) score += 14;
    if (hay.includes(t)) score += 10;
  });

  if (normalizeSearchText(c.id) === q) score = Math.max(score, 96);
  if (normalizeSearchText(c.category) === q) score = Math.max(score, 45);
  if (normalizeSearchText(c.region) === q) score = Math.max(score, 42);
  if (normalizeSearchText(c.agencyRepresentation).includes(q)) score = Math.max(score, 38);

  for (const tags of SEARCH_GROUP_TAGS) {
    const key = tags[0];
    if (q === key || q.includes(key) || tokens.includes(key)) {
      if (tags.slice(1).some(tag => hay.includes(normalizeSearchText(tag)))) {
        score = Math.max(score, 72);
      }
    }
  }

  if (q.length >= 4) {
    const parts = nameNorm.split(' ').filter(p => p.length >= 4);
    for (const part of parts) {
      if (levenshtein(q, part) <= 2) score = Math.max(score, 68);
    }
  }

  return Math.min(100, score);
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const row = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const cur = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = cur;
    }
  }
  return row[n];
}

export function searchRoster(query, roster, opts = {}) {
  const limit = opts.limit ?? 12;
  const minScore = opts.minScore ?? 28;
  const q = String(query || '').trim();
  if (!q) {
    return (roster || []).slice(0, limit).map(celeb => ({ celeb, score: 0 }));
  }
  return (roster || [])
    .map(celeb => ({ celeb, score: scoreCelebrityMatch(celeb, q) }))
    .filter(x => x.score >= minScore)
    .sort((a, b) => b.score - a.score || a.celeb.name.localeCompare(b.celeb.name))
    .slice(0, limit);
}

export function paletteSearchRoster(query, roster, limit = 8) {
  return searchRoster(query, roster, { limit, minScore: 22 }).map(x => x.celeb);
}

export function getSearchSuggestions(query, roster, count = 3) {
  return searchRoster(query, roster, { limit: count, minScore: 18 });
}

export function initSmartSearch(inputEl, opts = {}) {
  if (!inputEl) return () => {};
  const roster = opts.roster || [];
  const wrap = inputEl.closest('.search-wrap') || inputEl.parentElement;
  if (!wrap) return () => {};
  wrap.classList.add('search-wrap-smart');
  let panel = wrap.querySelector('.smart-search-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'smart-search-panel';
    panel.setAttribute('role', 'listbox');
    panel.hidden = true;
    wrap.appendChild(panel);
  }

  let debounce = null;
  let activeIdx = 0;
  let lastResults = [];

  const hrefFor = (c) => (opts.href ? opts.href(c) : `talent.html?id=${c.id}`);

  function renderPanel(q) {
    const trimmed = q.trim();
    if (trimmed.length < (opts.minChars ?? 1)) {
      panel.hidden = true;
      lastResults = [];
      return;
    }
    lastResults = searchRoster(trimmed, roster, {
      limit: opts.limit ?? 10,
      minScore: opts.minScore ?? 26,
    });
    activeIdx = 0;

    if (!lastResults.length) {
      const loose = getSearchSuggestions(trimmed, roster, 4);
      const suggest = loose.length
        ? `<p class="ssp-suggest">Did you mean: ${loose.map(s => `<a href="${hrefFor(s.celeb)}">${s.celeb.name}</a>`).join(', ')}?</p>`
        : '';
      panel.innerHTML = `
        <div class="ssp-empty">No exact match for <strong>${trimmed.replace(/</g, '')}</strong></div>
        ${suggest}
        <a class="ssp-all" href="explorer.html?search=${encodeURIComponent(trimmed)}">Search full roster →</a>`;
      panel.hidden = false;
      bindPanelLinks();
      return;
    }

    panel.innerHTML = lastResults.map((r, i) => `
      <a class="ssp-item${i === 0 ? ' ssp-active' : ''}" role="option" href="${hrefFor(r.celeb)}" data-idx="${i}">
        <img src="${r.celeb.portrait}" alt="" loading="lazy" decoding="async">
        <span class="ssp-text">
          <strong>${r.celeb.name}</strong>
          <span class="ssp-meta">${r.celeb.category} · ${r.celeb.region} · ${r.celeb.availability}</span>
        </span>
      </a>
    `).join('') + `
      <a class="ssp-all" href="explorer.html?search=${encodeURIComponent(trimmed)}">View all ${lastResults.length}+ matches →</a>`;
    panel.hidden = false;
    bindPanelLinks();
  }

  function bindPanelLinks() {
    panel.querySelectorAll('.ssp-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (opts.onPick) opts.onPick(lastResults[Number(el.dataset.idx)]?.celeb);
      });
    });
  }

  function setActive(idx) {
    const items = [...panel.querySelectorAll('.ssp-item')];
    if (!items.length) return;
    activeIdx = Math.max(0, Math.min(idx, items.length - 1));
    items.forEach((el, i) => el.classList.toggle('ssp-active', i === activeIdx));
    items[activeIdx]?.scrollIntoView({ block: 'nearest' });
  }

  const onInput = () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => renderPanel(inputEl.value), opts.debounceMs ?? 100);
  };

  const onKeydown = (e) => {
    if (panel.hidden) return;
    const items = panel.querySelectorAll('.ssp-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(activeIdx + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(activeIdx - 1);
    } else if (e.key === 'Enter' && items.length) {
      e.preventDefault();
      const el = items[activeIdx] || items[0];
      if (el?.href) window.location.href = el.getAttribute('href');
    } else if (e.key === 'Escape') {
      panel.hidden = true;
    }
  };

  const onBlur = () => {
    setTimeout(() => { panel.hidden = true; }, 180);
  };

  const onFocus = () => {
    if (inputEl.value.trim()) renderPanel(inputEl.value);
  };

  inputEl.addEventListener('input', onInput);
  inputEl.addEventListener('keydown', onKeydown);
  inputEl.addEventListener('blur', onBlur);
  inputEl.addEventListener('focus', onFocus);

  return () => {
    inputEl.removeEventListener('input', onInput);
    inputEl.removeEventListener('keydown', onKeydown);
    inputEl.removeEventListener('blur', onBlur);
    inputEl.removeEventListener('focus', onFocus);
  };
}

export function parsePaletteIntent(query, roster) {
  const q = (query || '').trim().toLowerCase();
  const routes = {
    explorer: 'explorer.html',
    explore: 'explorer.html',
    roster: 'explorer.html',
    crowd: 'crowdbooking.html',
    portal: 'portal.html',
    booking: 'booking.html',
    login: 'login.html',
    home: 'index.html',
    qualify: 'index.html#qualify',
  };
  for (const [key, href] of Object.entries(routes)) {
    if (q === key) return { type: 'route', href, label: key };
  }
  if (q === 'qualify' || q.startsWith('qualify ')) {
    return { type: 'qualify', href: 'index.html', label: 'qualify' };
  }
  const pathMatch = q.match(/^path\s+(.+)$/);
  if (pathMatch) {
    const hit = searchRoster(pathMatch[1], roster, { limit: 1, minScore: 40 })[0];
    if (hit) return { type: 'path', href: `index.html?sim=${hit.celeb.id}`, celeb: hit.celeb };
    return { type: 'path', href: 'index.html#accessPathSim', label: pathMatch[1] };
  }
  const holdMatch = q.match(/^hold\s+(.+)$/);
  if (holdMatch) {
    const hit = searchRoster(holdMatch[1], roster, { limit: 1, minScore: 40 })[0];
    if (hit) return { type: 'hold', href: `talent.html?id=${hit.celeb.id}&hold=1`, celeb: hit.celeb };
  }
  const bookMatch = q.match(/^book\s+(.+)$/);
  if (bookMatch) {
    const hit = searchRoster(bookMatch[1], roster, { limit: 1, minScore: 40 })[0];
    if (hit) return { type: 'book', href: `booking.html?id=${hit.celeb.id}`, celeb: hit.celeb };
  }
  const hit = searchRoster(query, roster, { limit: 1, minScore: 55 })[0];
  if (hit && hit.score >= 70) {
    return { type: 'dossier', href: `talent.html?id=${hit.celeb.id}`, celeb: hit.celeb };
  }
  if (q.length > 1) return { type: 'search', href: `explorer.html?search=${encodeURIComponent(query.trim())}` };
  return null;
}

export function bindShortlistTray(roster) {
  const refresh = () => renderShortlistTray(roster);
  window.addEventListener('ata-shortlist-change', refresh);
  refresh();
}

export function renderCompareMatrix(container, result) {
  if (!container || !result?.compared?.length) return;
  const rows = result.compared;
  container.innerHTML = `
    <div class="compare-matrix">
      <div class="cm-row cm-head">
        <span>Talent</span><span>Category</span><span>Region</span><span>Access band</span><span>Availability</span>
      </div>
      ${rows.map((r) => `
        <div class="cm-row">
          <span><b>${r.name}</b></span>
          <span>${r.category || '—'}</span>
          <span>${r.region || '—'}</span>
          <span>${formatPrice(r.startingPrice || 0)}</span>
          <span>${r.availability || '—'}</span>
        </div>
      `).join('')}
    </div>`;
}
