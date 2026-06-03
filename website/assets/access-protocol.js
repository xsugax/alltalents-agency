/** Access Protocol — Phase C shared conversion layer */
import { formatPrice, trackEvent, getRecentViews, getShortlist } from './platform.js';

const QUALIFIED_KEY = 'ata_qualified';
const HOLD_KEY = 'ata_session_hold';
const HOLD_TTL_MS = 15 * 60 * 1000;
const ANCHOR_COPY = 'The authorized way to meet them — not the internet\'s guesswork.';

export const PROTOCOL_STEPS = [
  { id: 'discover', label: 'Discover', hint: 'Browse verified roster & dossiers' },
  { id: 'qualify', label: 'Qualify', hint: 'Confidential budget band & intent' },
  { id: 'hold', label: 'Hold Window', hint: '72h priority slot — not a booking yet' },
  { id: 'escrow', label: 'Escrow', hint: '30% locks representation review' },
  { id: 'desk', label: 'Desk', hint: 'Live representation coordination' },
  { id: 'meeting', label: 'Meeting', hint: 'Authorized proximity event' },
];

const VENUES = [
  { icon: '', name: 'Monaco Yacht', loc: 'Port Hercule, Monaco' },
  { icon: '', name: 'NYC Penthouse', loc: 'Midtown Manhattan, NY' },
  { icon: '', name: 'Dubai Palace', loc: 'Palm Jumeirah, Dubai' },
  { icon: '', name: 'London Estate', loc: 'Mayfair, London' },
  { icon: '', name: 'Paris Riviera', loc: 'Champs-Élysées, Paris' },
];

const PRESTIGE_TICKER = [
  { name: 'Private mandate', event: 'Music · closed in 11 days', change: 'Sealed', positive: true },
  { name: 'Window hold', event: 'Film · Geneva', change: 'Confirmed', positive: true },
  { name: 'Crowd access', event: 'Sports · Dubai', change: '12 seats left', positive: false },
];

function apiBase() {
  return window.ATA_API_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:4100/api'
      : 'https://ata-h0yo.onrender.com/api'
  );
}

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('ata_token') || localStorage.getItem('aurelux_token');
  const response = await fetch(`${apiBase()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Request failed');
  return payload;
}

export function formatAccessBand(startingPrice) {
  const p = startingPrice || 0;
  if (!p) return 'Access band · qualify for terms';
  const low = Math.round(p * 0.85);
  const high = Math.round(p * 1.4);
  return `${formatPrice(low)}–${formatPrice(high)}`;
}

export function displayPrice(startingPrice, opts = {}) {
  if (isQualified() || opts.forceFull) {
    return `From ${formatPrice(startingPrice)}`;
  }
  return `${formatAccessBand(startingPrice)} · qualify for terms`;
}

export function isQualified() {
  try {
    return !!JSON.parse(sessionStorage.getItem(QUALIFIED_KEY) || 'null');
  } catch {
    return false;
  }
}

export function setQualified(payload) {
  sessionStorage.setItem(QUALIFIED_KEY, JSON.stringify({ ...payload, t: Date.now() }));
  window.dispatchEvent(new CustomEvent('ata-qualified'));
}

export function getSessionHold() {
  try {
    const h = JSON.parse(sessionStorage.getItem(HOLD_KEY) || 'null');
    if (!h || Date.now() > h.expiresAt) {
      sessionStorage.removeItem(HOLD_KEY);
      return null;
    }
    return h;
  } catch {
    return null;
  }
}

export function setSessionHold(id, name) {
  const ref = `ATA-${Math.floor(100000 + Math.random() * 900000)}`;
  const hold = { id, name, ref, expiresAt: Date.now() + HOLD_TTL_MS, createdAt: Date.now() };
  sessionStorage.setItem(HOLD_KEY, JSON.stringify(hold));
  trackEvent('window_hold', { id, name, ref });
  window.dispatchEvent(new CustomEvent('ata-hold-change'));
  return hold;
}

export function clearSessionHold() {
  sessionStorage.removeItem(HOLD_KEY);
  window.dispatchEvent(new CustomEvent('ata-hold-change'));
}

export function getAccessProgress() {
  const events = JSON.parse(sessionStorage.getItem('ata_events') || '[]');
  const names = events.map(e => e.name);
  let step = 0;
  if (names.some(n => n.includes('view') || n.includes('dossier') || n.includes('home'))) step = 1;
  if (isQualified() || getShortlist().length) step = Math.max(step, 2);
  if (getSessionHold()) step = Math.max(step, 3);
  if (names.some(n => n.includes('booking'))) step = Math.max(step, 4);
  const recent = getRecentViews();
  const lastName = recent[0]?.name || '';
  return { step, lastName, recent };
}

export function renderProtocolSpine(activeStep) {
  const step = typeof activeStep === 'number' ? activeStep : getAccessProgress().step;
  return `
    <section class="protocol-spine section reveal-on-scroll">
      <p class="eyebrow">Sovereign Access Protocol</p>
      <p class="protocol-anchor small muted">${ANCHOR_COPY}</p>
      <div class="protocol-steps">
        ${PROTOCOL_STEPS.map((s, i) => {
          const idx = i + 1;
          const done = step > idx;
          const active = step === idx;
          return `<div class="protocol-step${done ? ' ps-done' : ''}${active ? ' ps-active' : ''}">
            <span class="ps-num">${done ? '✓' : String(idx).padStart(2, '0')}</span>
            <span class="ps-label">${s.label}</span>
            <span class="ps-hint">${s.hint}</span>
          </div>`;
        }).join('')}
      </div>
    </section>`;
}

export function renderThreePathBait(celeb, crowdMinPrice = 1800) {
  if (!celeb) return '';
  const crowdFmt = crowdMinPrice >= 1000 ? `$${Math.round(crowdMinPrice / 1000)}K` : `$${crowdMinPrice}`;
  return `
    <div class="path-bait-grid">
      <a class="path-bait-card" href="crowdbooking.html?celeb=${celeb.id}">
        <span class="pbc-tier">Crowd</span>
        <strong>Same room · shared moment</strong>
        <span class="pbc-price num-mono">From ${crowdFmt}</span>
      </a>
      <button type="button" class="path-bait-card path-bait-window" data-hold-id="${celeb.id}" data-hold-name="${celeb.name.replace(/"/g, '&quot;')}">
        <span class="pbc-tier">Window</span>
        <strong>72h priority access</strong>
        <span class="pbc-price">Hold window →</span>
      </button>
      <a class="path-bait-card path-bait-mandate" href="booking.html?id=${celeb.id}">
        <span class="pbc-tier">Mandate</span>
        <strong>Full private desk</strong>
        <span class="pbc-price num-mono">${displayPrice(celeb.startingPrice)}</span>
      </a>
    </div>
    <p class="path-bait-tagline small muted">Three verified paths to meet <strong>${celeb.name}</strong> — crowd seat to private mandate.</p>`;
}

export function runAccessPathSimulator(celeb, occasion, budgetBand, roster = []) {
  const price = celeb?.startingPrice || 500000;
  const bands = [50000, 500000, 2000000, 8000000];
  const budget = bands[budgetBand] ?? bands[1];
  let tier = 'Window';
  let tierHref = `booking.html?id=${celeb?.id || ''}`;
  if (budget < price * 0.15) {
    tier = 'Crowd';
    tierHref = `crowdbooking.html?celeb=${celeb?.id || ''}`;
  } else if (budget >= price * 1.2) {
    tier = 'Mandate';
    tierHref = `booking.html?id=${celeb?.id || ''}`;
  }
  const cat = celeb?.category;
  const matches = (roster || [])
    .filter(c => c.id !== celeb?.id)
    .filter(c => !cat || c.category === cat || budget >= (c.startingPrice || 0) * 0.5)
    .sort((a, b) => (b.demandIndex || 0) - (a.demandIndex || 0))
    .slice(0, 3);
  const ledger = [
    { label: 'Representation review', value: 'Included in escrow' },
    { label: 'Window reservation', value: '72h priority hold' },
    { label: 'Talent guarantee', value: 'Authorized channel only' },
    { label: 'NDA / compliance', value: 'Standard sovereign pack' },
    { label: 'Logistics coordination', value: 'Desk-managed' },
  ];
  return { tier, tierHref, occasion, matches, ledger, budget };
}

export function renderAccessPathSimulator(celeb, roster = []) {
  return `
    <section class="access-sim section reveal-on-scroll" id="accessPathSim">
      <p class="eyebrow">Access Path Simulator</p>
      <h3 style="margin:6px 0 14px">Find your authorized route</h3>
      <div class="access-sim-controls">
        <label class="small muted">Occasion
          <select id="simOccasion">
            <option value="gala">Gala / corporate</option>
            <option value="brand">Brand campaign</option>
            <option value="dinner">Private dinner</option>
            <option value="fan">Fan experience</option>
          </select>
        </label>
        <label class="small muted">Budget band
          <input type="range" id="simBudget" min="0" max="3" value="1" step="1">
          <span id="simBudgetLabel" class="num-mono">$500K tier</span>
        </label>
      </div>
      <div id="simOutput" class="access-sim-output"></div>
    </section>`;
}

export function bindAccessPathSimulator(celeb, roster = []) {
  const out = document.getElementById('simOutput');
  const occasionEl = document.getElementById('simOccasion');
  const budgetEl = document.getElementById('simBudget');
  const budgetLabel = document.getElementById('simBudgetLabel');
  if (!out || !occasionEl || !budgetEl) return;
  const labels = ['$50K tier', '$500K tier', '$2M tier', '$8M+ tier'];
  const render = () => {
    const band = Number(budgetEl.value);
    if (budgetLabel) budgetLabel.textContent = labels[band] || labels[1];
    const r = runAccessPathSimulator(celeb, occasionEl.value, band, roster);
    out.innerHTML = `
      <div class="sim-result">
        <p class="eyebrow">Recommended path</p>
        <h4 class="sim-tier">${r.tier}</h4>
        <div class="escrow-ledger compact">
          ${r.ledger.map(l => `<div class="el-row"><span>${l.label}</span><span class="muted">${l.value}</span></div>`).join('')}
        </div>
        ${r.matches.length ? `<p class="small muted" style="margin-top:12px">Also aligned:</p>
          <div class="sim-matches">${r.matches.map(m => `<a href="talent.html?id=${m.id}" class="sim-match">${m.name}</a>`).join('')}</div>` : ''}
        <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
          <a href="${r.tierHref}"><button class="primary" type="button" style="width:auto">Proceed via ${r.tier} →</button></a>
          <button type="button" class="secondary sim-hold-btn" style="width:auto" data-hold-id="${celeb?.id}" data-hold-name="${(celeb?.name || '').replace(/"/g, '&quot;')}">Hold window</button>
        </div>
      </div>`;
    out.querySelector('.sim-hold-btn')?.addEventListener('click', () => triggerWindowHold(celeb?.id, celeb?.name));
  };
  occasionEl.addEventListener('change', render);
  budgetEl.addEventListener('input', render);
  render();
}

export function renderEscrowLedger({ quote = 0, escrowPct = 30 }) {
  const escrow = Math.round(quote * (escrowPct / 100));
  return `
    <div class="escrow-ledger">
      <div class="el-row"><span>Representation review</span><span class="num-mono">${formatPrice(escrow)}</span></div>
      <div class="el-row"><span>Window reservation</span><span class="muted">Included</span></div>
      <div class="el-row"><span>NDA / compliance</span><span class="muted">Included</span></div>
      <div class="el-row"><span>Logistics coordination</span><span class="muted">Included</span></div>
      <div class="escrow-bar" style="margin-top:12px"><div class="escrow-fill" style="width:${escrowPct}%"></div></div>
      <p class="small muted" style="margin-top:8px">${escrowPct}% escrow reserve · representation review within 24h</p>
    </div>`;
}

export function renderRedactedBrief(dossier, celeb, opts = {}) {
  if (!dossier) return '<p class="muted">Brief unavailable — proceed via booking desk.</p>';
  const qualified = opts.qualified ?? isQualified();
  const tps = dossier.talkingPoints || [];
  const visible = tps.slice(0, 2);
  const hidden = tps.slice(2);
  return `
    <span class="dossier-classified">${dossier.classificationLevel || 'PRIVATE — CLIENT EYES ONLY'}</span>
    <div class="dossier-meta-grid">
      <div class="dossier-meta-item"><div class="dmk">Media authority</div><div class="dmv">${dossier.mediaAuthorityScore}/99</div></div>
      <div class="dossier-meta-item"><div class="dmk">Lead time</div><div class="dmv">${dossier.optimalLeadTime}</div></div>
      ${qualified ? `
        <div class="dossier-meta-item"><div class="dmk">Venue</div><div class="dmv">${dossier.recommendedVenue}</div></div>
        <div class="dossier-meta-item"><div class="dmk">NDA</div><div class="dmv">${dossier.ndaStatus}</div></div>` : `
        <div class="dossier-meta-item redacted-block"><div class="dmk">Venue</div><div class="dmv redacted-blur">Classified</div></div>
        <div class="dossier-meta-item redacted-block"><div class="dmk">NDA</div><div class="dmv redacted-blur">Classified</div></div>`}
    </div>
    <div class="dossier-section" style="margin-top:14px">
      <h5>Strategic talking points</h5>
      <ul class="dossier-tp">${visible.map(p => `<li>${p}</li>`).join('')}</ul>
      ${hidden.length ? `<div class="redacted-block${qualified ? '' : ' is-locked'}">
        <ul class="dossier-tp redacted-blur">${hidden.map(p => `<li>${p}</li>`).join('')}</ul>
        ${!qualified ? `<button type="button" class="secondary unlock-brief-btn" style="width:auto;margin-top:10px" data-unlock-celeb="${(celeb?.name || '').replace(/"/g, '&quot;')}">Unlock full brief →</button>` : ''}
      </div>` : ''}
    </div>
    ${qualified ? `<p class="small muted" style="margin-top:10px">${dossier.riskBrief}</p>` : `<p class="small muted redacted-blur" style="margin-top:10px">Risk brief · qualification required</p>`}`;
}

export function renderProgressRail() {
  const { step, lastName } = getAccessProgress();
  const hold = getSessionHold();
  const parts = [];
  if (lastName) parts.push(`Viewed <strong>${lastName}</strong>`);
  if (isQualified()) parts.push('Qualified');
  if (hold) parts.push(`Hold <span class="num-mono">${hold.ref}</span>`);
  const next = PROTOCOL_STEPS[Math.min(step, PROTOCOL_STEPS.length - 1)];
  return `
    <div id="accessProgressRail" class="progress-rail${parts.length ? ' pr-visible' : ''}">
      <span class="pr-label">Your access path</span>
      <span class="pr-trail">${parts.join(' → ') || 'Start with any verified profile'}</span>
      <span class="pr-next muted">${parts.length ? `Next: ${next?.label}` : ''}</span>
    </div>`;
}

export function renderHoldChipHTML() {
  const hold = getSessionHold();
  if (!hold) return '';
  const rem = Math.max(0, hold.expiresAt - Date.now());
  const m = Math.floor(rem / 60000);
  const s = Math.floor((rem % 60000) / 1000);
  return `<span class="hold-chip" id="navHoldChip"><span class="hc-ref num-mono">${hold.ref}</span><span class="hc-time">${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}</span></span>`;
}

function genDates() {
  const arr = [];
  const d = new Date();
  d.setDate(d.getDate() + 4);
  for (let i = 0; i < 5; i++) {
    arr.push({
      day: d.getDate(),
      month: d.toLocaleString('en-GB', { month: 'short' }),
      status: i === 1 ? 'limited' : 'open',
      label: i === 1 ? 'Limited' : 'Open',
    });
    d.setDate(d.getDate() + (i === 2 ? 2 : 1));
  }
  return arr;
}

export function ensureAccessPortalShell() {
  if (document.getElementById('accessPortal')) return;
  const shell = document.createElement('div');
  shell.innerHTML = `
    <div id="accessPortal" class="access-portal-back">
      <div class="ap-glow-bg"></div>
      <div class="ap-inner">
        <div class="ap-portrait-col" id="apPortraitCol"><img class="ap-portrait-img" id="apPortraitImg" alt=""></div>
        <div class="ap-content-col" id="apContentCol"></div>
      </div>
      <button class="ap-close-btn" id="apClose" type="button">Close</button>
    </div>`;
  document.body.appendChild(shell.firstElementChild);
  const portal = document.getElementById('accessPortal');
  document.getElementById('apClose')?.addEventListener('click', () => closeAccessPortal());
  portal?.addEventListener('click', (e) => { if (e.target === portal) closeAccessPortal(); });
}

export function closeAccessPortal() {
  document.getElementById('accessPortal')?.classList.remove('ap-open');
  document.body.style.overflow = '';
}

export function openAccessPortal(c) {
  if (!c) return;
  ensureAccessPortalShell();
  const portal = document.getElementById('accessPortal');
  if (portal && !portal.dataset.wired) {
    portal.dataset.wired = '1';
    document.getElementById('apClose')?.addEventListener('click', () => closeAccessPortal());
    portal.addEventListener('click', (e) => { if (e.target === portal) closeAccessPortal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAccessPortal(); });
  }
  const dates = genDates();
  const venueHtml = VENUES.map((v, i) =>
    `<div class="ap-venue" data-vi="${i}"><div class="ap-venue-icon">${v.icon}</div><div class="ap-venue-name">${v.name}</div><div class="ap-venue-loc">${v.loc}</div></div>`
  ).join('');
  const dateHtml = dates.map((d, i) =>
    `<div class="ap-day" data-di="${i}"><div class="ap-day-num">${d.day}</div><div class="ap-day-month">${d.month}</div><div class="ap-day-status ds-${d.status}">${d.label}</div></div>`
  ).join('');
  const brief = [
    { label: 'Est. Net Worth', value: c.netWorth || '—' },
    { label: 'Brand Value', value: c.brandValue || '—' },
    { label: 'Global Reach', value: `${c.socialReachMillions}M` },
    { label: 'Availability', value: c.availability },
  ];
  const briefHtml = brief.map(b =>
    `<div class="ap-brief-cell"><div class="ap-bc-label">${b.label}</div><div class="ap-bc-value">${b.value}</div></div>`
  ).join('');
  document.getElementById('apPortraitImg').src = c.portrait;
  document.getElementById('apPortraitImg').alt = c.name;
  document.getElementById('apContentCol').innerHTML = `
    <div class="ap-stamp"><div class="ap-stamp-dot"></div>All Talents Agency · Sovereign Private Access</div>
    <h1 class="ap-celeb-name">${c.name}</h1>
    <p class="ap-celeb-meta">${c.category} · ${c.region} · ${c.agencyRepresentation}</p>
    <p style="font-size:12.5px;line-height:1.6;color:rgba(255,255,255,.72);font-style:italic;margin:0 0 18px;padding:12px 14px;border-left:2px solid var(--accent);background:rgba(201,169,98,.08);border-radius:0 8px 8px 0">"${c.eliteSignal || ''}"</p>
    <div class="ap-live-status"><div class="ap-live-dot"></div>Direct meeting access LIVE — closes in 72h</div>
    <div class="ap-brief-row">${briefHtml}</div>
    <div class="ap-divider"></div>
    <p class="ap-section-label">Select Your Private Venue</p>
    <div class="ap-venues">${venueHtml}</div>
    <p class="ap-section-label">Choose Exclusive Window</p>
    <div class="ap-dates">${dateHtml}</div>
    <button class="ap-confirm-btn" id="apConfirmBtn">Initiate Private Access Protocol</button>
    <p class="ap-price-note">${displayPrice(c.startingPrice)} · NDA standard · Escrow protected</p>`;
  portal.querySelectorAll('.ap-venue').forEach(el => {
    el.onclick = () => {
      portal.querySelectorAll('.ap-venue').forEach(v => v.classList.remove('av-sel'));
      el.classList.add('av-sel');
    };
  });
  portal.querySelectorAll('.ap-day').forEach(el => {
    el.onclick = () => {
      portal.querySelectorAll('.ap-day').forEach(d => d.classList.remove('ad-sel'));
      el.classList.add('ad-sel');
    };
  });
  document.getElementById('apConfirmBtn').onclick = () => {
    const vEl = portal.querySelector('.ap-venue.av-sel');
    const dEl = portal.querySelector('.ap-day.ad-sel');
    const vi = vEl ? Number(vEl.dataset.vi) : 0;
    const di = dEl ? Number(dEl.dataset.di) : 0;
    const venue = encodeURIComponent(VENUES[vi]?.name || 'TBD');
    const d = new Date();
    d.setDate(d.getDate() + 4 + di);
    window.location.href = `booking.html?id=${c.id}&venue=${venue}&date=${d.toISOString().slice(0, 10)}&intent=meet`;
  };
  portal.classList.add('ap-open');
  document.body.style.overflow = 'hidden';
}

let wlBackEl = null;
export async function openWaitlistReserve(id, name, sessionRef) {
  if (!wlBackEl) {
    wlBackEl = document.createElement('div');
    wlBackEl.className = 'wl-modal-back';
    wlBackEl.style.display = 'none';
    document.body.appendChild(wlBackEl);
    wlBackEl.addEventListener('click', (e) => { if (e.target === wlBackEl) wlBackEl.style.display = 'none'; });
  }
  wlBackEl.innerHTML = `<div class="wl-modal"><p class="eyebrow">Window Hold · Sealed</p><h3 style="margin:8px 0">${name}</h3><div id="wlContent"><p class="small muted">Processing…</p></div></div>`;
  wlBackEl.style.display = 'flex';
  const token = localStorage.getItem('ata_token') || localStorage.getItem('aurelux_token');
  if (!token) {
    document.getElementById('wlContent').innerHTML = `
      <p class="small">Session hold ${sessionRef || ''} active. Login to seal for 48h.</p>
      <a href="login.html?return=${encodeURIComponent(location.pathname.replace(/^\//, '') + location.search)}"><button class="primary" style="width:auto;margin-top:12px">Secure login →</button></a>`;
    return;
  }
  try {
    const r = await apiRequest('/waitlist/reserve', { method: 'POST', body: JSON.stringify({ celebrityId: id }) });
    const exp = new Date(r.expiresAt);
    document.getElementById('wlContent').innerHTML = `
      ${sessionRef ? `<p class="small muted">Session: <span class="num-mono">${sessionRef}</span></p>` : ''}
      <div class="wl-code">${r.reservationCode}</div>
      <p class="wl-expiry">Valid until ${exp.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
      <p class="small muted">${r.message}</p>
      <button class="wl-close" type="button" id="wlCloseBtn">Close</button>`;
    document.getElementById('wlCloseBtn')?.addEventListener('click', () => { wlBackEl.style.display = 'none'; });
  } catch (err) {
    document.getElementById('wlContent').innerHTML = `<p class="small muted">${err.message}</p>`;
  }
}

export function triggerWindowHold(id, name) {
  if (!id) return;
  const hold = setSessionHold(id, name);
  refreshHoldUI();
  const token = localStorage.getItem('ata_token');
  if (token) openWaitlistReserve(id, name, hold.ref);
  else {
    openQualifyModal(name, () => openWaitlistReserve(id, name, hold.ref));
  }
}

let qualifyBack = null;
export function openQualifyModal(celebName = '', onSuccess) {
  if (!qualifyBack) {
    qualifyBack = document.createElement('div');
    qualifyBack.className = 'qualify-modal-back';
    document.body.appendChild(qualifyBack);
    qualifyBack.addEventListener('click', (e) => { if (e.target === qualifyBack) qualifyBack.classList.remove('qm-open'); });
  }
  qualifyBack.innerHTML = `
    <div class="qualify-modal">
      <p class="eyebrow">Client qualification</p>
      <h3 style="margin:6px 0 14px">Unlock terms & full brief</h3>
      <form id="qualifyForm" class="qualify-form">
        <input id="qfName" placeholder="Full name" required>
        <input id="qfEmail" type="email" placeholder="Email" required>
        <input id="qfOrg" placeholder="Organization">
        <input id="qfCeleb" value="${celebName.replace(/"/g, '&quot;')}" placeholder="Target talent">
        <select id="qfIntent"><option value="meet">Private meeting</option><option value="brand">Brand campaign</option><option value="event">Corporate event</option></select>
        <button type="submit" class="primary">Submit qualification →</button>
      </form>
      <button type="button" class="secondary qm-close" style="width:auto;margin-top:10px">Cancel</button>
    </div>`;
  qualifyBack.classList.add('qm-open');
  qualifyBack.querySelector('.qm-close')?.addEventListener('click', () => qualifyBack.classList.remove('qm-open'));
  qualifyBack.querySelector('#qualifyForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('qfName').value.trim(),
      email: document.getElementById('qfEmail').value.trim(),
      celebrity: document.getElementById('qfCeleb').value.trim() || celebName,
      eventType: document.getElementById('qfIntent').value,
      message: 'Qualification request via Access Protocol',
    };
    try {
      await apiRequest('/inquiry', { method: 'POST', body: JSON.stringify(payload) });
      setQualified(payload);
      qualifyBack.classList.remove('qm-open');
      window.dispatchEvent(new CustomEvent('ata-qualified'));
      onSuccess?.();
    } catch (err) {
      alert(err.message);
    }
  });
}

export function bindPathBaitHandlers(root = document) {
  root.querySelectorAll('[data-hold-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      triggerWindowHold(btn.dataset.holdId, btn.dataset.holdName);
    });
  });
  root.querySelectorAll('.path-bait-window').forEach(btn => {
    btn.addEventListener('click', () => triggerWindowHold(btn.dataset.holdId, btn.dataset.holdName));
  });
  root.querySelectorAll('.unlock-brief-btn').forEach(btn => {
    btn.addEventListener('click', () => openQualifyModal(btn.dataset.unlockCeleb || ''));
  });
}

export function refreshHoldUI() {
  const chipHost = document.querySelector('.nav-inner > div');
  const existing = document.getElementById('navHoldChip');
  if (existing) existing.remove();
  const html = renderHoldChipHTML();
  if (html && chipHost) {
    chipHost.insertAdjacentHTML('afterbegin', html);
    startHoldCountdown();
  }
  const rail = document.getElementById('accessProgressRail');
  if (rail) rail.outerHTML = renderProgressRail();
}

let holdTimer = null;
function startHoldCountdown() {
  if (holdTimer) clearInterval(holdTimer);
  holdTimer = setInterval(() => {
    const hold = getSessionHold();
    if (!hold) {
      clearInterval(holdTimer);
      document.getElementById('navHoldChip')?.remove();
      return;
    }
    const el = document.querySelector('#navHoldChip .hc-time');
    if (el) {
      const rem = Math.max(0, hold.expiresAt - Date.now());
      const m = Math.floor(rem / 60000);
      const s = Math.floor((rem % 60000) / 1000);
      el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }, 1000);
}

export function initAccessProtocol(opts = {}) {
  ensureAccessPortalShell();
  if (!document.getElementById('accessProgressRail')) {
    const tray = document.getElementById('engagementTray');
    if (tray) tray.insertAdjacentHTML('beforebegin', renderProgressRail());
    else document.body.insertAdjacentHTML('beforeend', renderProgressRail());
  }
  refreshHoldUI();
  bindPathBaitHandlers();
  window.addEventListener('ata-hold-change', refreshHoldUI);
  window.addEventListener('ata-qualified', () => {
    refreshHoldUI();
    opts.onQualified?.();
  });
  const params = new URLSearchParams(location.search);
  if (params.get('hold') === '1' && getSessionHold()) {
    const h = getSessionHold();
    openWaitlistReserve(h.id, h.name, h.ref);
  }
}

const conciergeFired = new Set();
export function initConciergeTriggers(opts = {}) {
  const panel = document.getElementById('floatMsgPanel');
  const thread = document.getElementById('chatThread') || document.getElementById('homeChatThread');
  if (!panel) return;
  const fire = (key, msg) => {
    if (conciergeFired.has(key)) return;
    conciergeFired.add(key);
    panel.classList.add('open');
    if (thread && opts.addBubble) {
      opts.addBubble(thread, 'desk', msg);
    }
  };
  if (opts.dwellMs && opts.celebName) {
    setTimeout(() => fire('dwell', `Most qualified clients for ${opts.celebName} start with a 72h window hold. Want the protocol?`), opts.dwellMs);
  }
  if (getRecentViews().length >= 2) {
    setTimeout(() => fire('second-view', 'You are comparing profiles — qualification unlocks full briefs and exact terms.'), 3000);
  }
  document.querySelectorAll('.redacted-block.is-locked, .unlock-brief-btn').forEach(el => {
    el.addEventListener('click', () => {
      fire('price-blur', 'Qualification is confidential — unlock terms and the full strategic brief in under 60 seconds.');
    }, { once: true });
  });
}

export function getPrestigeTickerEvents() {
  return PRESTIGE_TICKER;
}

export { ANCHOR_COPY };
