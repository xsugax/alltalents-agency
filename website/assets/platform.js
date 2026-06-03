/** All Talents Agency — shared platform utilities */
export const ASSET_V = '20260608';
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

export function setShortlist(ids) {
  localStorage.setItem(SHORTLIST_KEY, JSON.stringify(ids.slice(0, SHORTLIST_MAX)));
  window.dispatchEvent(new CustomEvent('ata-shortlist-change'));
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

export function paletteSearchRoster(query, roster, limit = 8) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return (roster || []).slice(0, limit);
  return (roster || [])
    .filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q) ||
      (c.region || '').toLowerCase().includes(q)
    )
    .slice(0, limit);
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
  };
  for (const [key, href] of Object.entries(routes)) {
    if (q === key) return { type: 'route', href, label: key };
  }
  const bookMatch = q.match(/^book\s+(.+)$/);
  if (bookMatch) {
    const name = bookMatch[1];
    const c = (roster || []).find(x => x.name.toLowerCase().includes(name));
    if (c) return { type: 'book', href: `booking.html?id=${c.id}`, celeb: c };
  }
  const c = (roster || []).find(x => x.name.toLowerCase().includes(q));
  if (c) return { type: 'dossier', href: `talent.html?id=${c.id}`, celeb: c };
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
  const win = result.recommendation?.winner;
  container.innerHTML = `
    ${win ? `<p class="small" style="margin-bottom:10px"><b>Recommended:</b> ${win.name} — ${result.recommendation.rationale || ''}</p>` : ''}
    <div class="compare-matrix">
      <div class="cm-row cm-head">
        <span>Talent</span><span>Score</span><span>Price floor</span><span>Availability</span><span>Risk</span>
      </div>
      ${rows.map((r, i) => `
        <div class="cm-row">
          <span><b>#${i + 1}</b> ${r.name}</span>
          <span class="cm-score">${r.valueScore}</span>
          <span>${formatPrice(r.startingPrice || 0)}</span>
          <span>${r.availability || '—'}</span>
          <span>${r.riskIndex || '—'}</span>
        </div>
      `).join('')}
      <p class="small muted" style="margin-top:10px">${result.recommendation?.rationale || result.recommendation?.winner?.name || ''}</p>
    </div>`;
}
