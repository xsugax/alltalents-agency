/** All Talents Agency — shared platform utilities */
export const ASSET_V = '20260606';
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
  } catch { /* ignore */ }
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
