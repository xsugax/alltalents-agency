// Auto-detect API endpoint: localhost in dev, Render backend in production
const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4100/api'
  : 'https://ata-h0yo.onrender.com/api';
// Override by setting window.ATA_API_URL before this script loads
const _API = window.ATA_API_URL || API;

const TOKEN_KEY = 'ata_token';
const USER_KEY = 'ata_user';

export const token = () => localStorage.getItem(TOKEN_KEY) || localStorage.getItem('aurelux_token');
export const currentUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY) || localStorage.getItem('aurelux_user');
    return JSON.parse(raw || 'null');
  } catch {
    return null;
  }
};
export const user = currentUser;
export const setAuth = (tokenValue, user) => {
  localStorage.setItem(TOKEN_KEY, tokenValue);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.removeItem('aurelux_token');
  localStorage.removeItem('aurelux_user');
};

window.__ataAuth = { token, currentUser, setAuth };

export function requireAuth(returnPath) {
  if (token()) return true;
  const path = returnPath || (location.pathname.replace(/^\//, '') + location.search);
  localStorage.setItem('ata_return', path);
  location.href = 'login.html';
  return false;
}

export function consumeReturnUrl(defaultPath = 'explorer.html') {
  const r = localStorage.getItem('ata_return');
  if (r) {
    localStorage.removeItem('ata_return');
    location.href = r.startsWith('http') ? r : r;
    return true;
  }
  return false;
}

import {
  ASSET_V,
  formatPrice,
  getShortlist,
  setShortlist,
  hydrateShortlist,
  toggleShortlist,
  getRelatedTalents,
  renderRelatedRail,
  renderShortlistTray,
  bindShortlistTray,
  trackEvent,
  renderCompareMatrix,
  getLocalDemandPulse,
  demandPulseHTML,
  renderDemandPulse,
  getRecentViews,
  paletteSearchRoster,
  parsePaletteIntent,
  recordRecentView,
  searchRoster,
  getSearchSuggestions,
  initSmartSearch,
} from './platform.js';

import {
  PROTOCOL_STEPS,
  renderProtocolSpine,
  renderThreePathBait,
  runAccessPathSimulator,
  renderAccessPathSimulator,
  bindAccessPathSimulator,
  formatAccessBand,
  displayPrice,
  isQualified,
  setQualified,
  getSessionHold,
  setSessionHold,
  clearSessionHold,
  getAccessProgress,
  renderProgressRail,
  renderHoldChipHTML,
  renderEscrowLedger,
  renderRedactedBrief,
  ensureAccessPortalShell,
  openAccessPortal,
  closeAccessPortal,
  openWaitlistReserve,
  triggerWindowHold,
  openQualifyModal,
  bindPathBaitHandlers,
  refreshHoldUI,
  initAccessProtocol,
  initConciergeTriggers,
  ANCHOR_COPY,
  renderBookingDeskSteps,
  BOOKING_DESK_LABELS,
} from './access-protocol.js';

import { getMeetingPlaybook, renderMeetingPlaybookCard } from './meeting-playbooks.js';

let liveRoster = [];

export async function loadRoster() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await request('/celebrities', { signal: ctrl.signal });
    liveRoster = Array.isArray(res?.data) ? res.data : [];
  } catch (err) {
    console.error(err);
    if (!liveRoster.length) liveRoster = [];
  } finally {
    clearTimeout(timer);
  }
  return liveRoster;
}

export function finishBoot() {
  document.documentElement.classList.add('is-hydrated', 'is-loaded');
  const boot = document.getElementById('ataBoot');
  if (!boot || boot.dataset.done === '1') return;
  boot.dataset.done = '1';
  const started = Number(window.__ataBootAt || Date.now());
  const wait = Math.max(0, 900 - (Date.now() - started));
  setTimeout(() => boot.classList.add('ata-boot-done'), wait);
}

export function getRoster() {
  return liveRoster;
}

/** Static roster IDs that map to canonical API ids (e.g. Charlize c167 → API c7). */
const STATIC_API_ID_ALIASES = {
  c167: 'c7',
};

const DEFAULT_SECURITY_TIERS = ['Standard', 'Enhanced', 'Executive', 'Sovereign'];

export function resolveApiCelebrityId(id) {
  return STATIC_API_ID_ALIASES[id] || id;
}

export function bookingSecurityTiers(celeb) {
  const tiers = celeb?.securityTiers;
  return Array.isArray(tiers) && tiers.length ? tiers : DEFAULT_SECURITY_TIERS;
}

export {
  ASSET_V,
  formatPrice,
  getShortlist,
  setShortlist,
  toggleShortlist,
  getRelatedTalents,
  renderRelatedRail,
  renderShortlistTray,
  bindShortlistTray,
  trackEvent,
  renderCompareMatrix,
  getLocalDemandPulse,
  demandPulseHTML,
  renderDemandPulse,
  getRecentViews,
  paletteSearchRoster,
  parsePaletteIntent,
  recordRecentView,
  searchRoster,
  getSearchSuggestions,
  initSmartSearch,
  PROTOCOL_STEPS,
  renderProtocolSpine,
  renderThreePathBait,
  runAccessPathSimulator,
  renderAccessPathSimulator,
  bindAccessPathSimulator,
  formatAccessBand,
  displayPrice,
  isQualified,
  setQualified,
  getSessionHold,
  setSessionHold,
  clearSessionHold,
  getAccessProgress,
  renderProgressRail,
  renderHoldChipHTML,
  renderEscrowLedger,
  renderRedactedBrief,
  openAccessPortal,
  closeAccessPortal,
  openWaitlistReserve,
  triggerWindowHold,
  openQualifyModal,
  bindPathBaitHandlers,
  refreshHoldUI,
  initAccessProtocol,
  initConciergeTriggers,
  ANCHOR_COPY,
  renderBookingDeskSteps,
  BOOKING_DESK_LABELS,
  getMeetingPlaybook,
  renderMeetingPlaybookCard,
  fetchCelebrity,
  fetchCelebrityDossier,
};

export async function request(path, options = {}) {
  const timeoutMs = options.timeoutMs ?? 20000;
  let signal = options.signal;
  let timer;
  if (!signal && timeoutMs) {
    const ctrl = new AbortController();
    signal = ctrl.signal;
    timer = setTimeout(() => ctrl.abort(), timeoutMs);
  }
  const { timeoutMs: _ignored, signal: _callerSignal, ...rest } = options;
  const response = await fetch(`${_API}${path}`, {
    ...rest,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(options.headers || {}),
    },
  }).finally(() => clearTimeout(timer));
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Request failed');
  return payload;
}

function localCelebrity(id, roster = liveRoster) {
  return roster.find((x) => x.id === id) || null;
}

function mergeCelebrity(apiRow, localRow) {
  if (!localRow) return apiRow;
  if (!apiRow) return localRow;
  const merged = { ...apiRow, id: localRow.id, name: localRow.name || apiRow.name };
  const preferLocal = apiRow.name && localRow.name && apiRow.name !== localRow.name;
  const keys = [
    'portrait', 'eliteSignal', 'netWorth', 'agencyRepresentation', 'startingPrice',
    'availability', 'availabilityWindowDays', 'securityTiers', 'category', 'region',
    'demandIndex', 'dynamicPriceRange', 'ndaDefault', 'bookingTiers',
  ];
  for (const key of keys) {
    const localVal = localRow[key];
    const apiVal = apiRow[key];
    if (localVal == null) continue;
    if (preferLocal || apiVal == null || (Array.isArray(apiVal) && !apiVal.length)) {
      merged[key] = localVal;
    }
  }
  if (!merged.securityTiers?.length) merged.securityTiers = localRow.securityTiers || DEFAULT_SECURITY_TIERS;
  return merged;
}

/** API first; static roster + id aliases when API returns 404. */
async function fetchCelebrity(id, roster = liveRoster) {
  const local = localCelebrity(id, roster);
  const tryIds = [id, STATIC_API_ID_ALIASES[id]].filter(Boolean);
  const seen = new Set();
  for (const tid of tryIds) {
    if (seen.has(tid)) continue;
    seen.add(tid);
    try {
      const row = await request('/celebrities/' + tid);
      return mergeCelebrity(row, local);
    } catch {
      /* try next */
    }
  }
  if (local) return local;
  throw new Error('Celebrity not found');
}

function buildLocalDossier(c) {
  const meeting = getMeetingPlaybook(c) || {};
  const idx = Math.max(0, parseInt(String(c.id).replace(/\D/g, ''), 10) - 1);
  const venueOptions = ['Private Estate Gala', 'Flagship Brand Summit', 'Sovereign Corporate Forum', 'Exclusive Cultural Ceremony', 'Invitation-Only Media Event'];
  const leverageMap = {
    low: 'High — Minimal friction, broad campaign compatibility',
    medium: 'Moderate — Strategic alignment required before proposal',
    high: 'Controlled — Executive-only pathway, strict vetting mandatory',
  };
  return {
    celebrity: {
      id: c.id, name: c.name, category: c.category, region: c.region, portrait: c.portrait,
      startingPrice: c.startingPrice, agencyRepresentation: c.agencyRepresentation,
    },
    dossier: {
      meetingHeadline: meeting.headline,
      meetingSteps: meeting.steps,
      classificationLevel: 'PRIVATE — CLIENT EYES ONLY',
      mediaAuthorityScore: Math.min(99, Math.round((c.socialReachMillions / 280) * 100) + 15),
      negotiationLeverage: leverageMap[c.riskIndex] || leverageMap.medium,
      recommendedVenue: venueOptions[idx % venueOptions.length],
      talkingPoints: [
        `Represented exclusively by ${c.agencyRepresentation}. All commercial contact must route through authorized channels.`,
        `Commercial entry threshold: ${formatPrice(c.startingPrice)}. Security default: ${(c.securityTiers || ['Executive']).slice(-1)[0]}.`,
        `Demand index: ${c.demandIndex}% — ${c.demandIndex > 75 ? 'Extreme booking pressure, immediate action advised' : c.demandIndex > 55 ? 'High demand — windows closing rapidly' : 'Moderate demand — opportunity window currently open'}.`,
        `Availability: ${c.availability === 'Open' ? 'Currently accepting qualified outreach' : c.availability === 'Limited' ? 'Limited windows — act within 48 hours of inquiry' : 'Waitlist active — join queue for next opening'}.`,
      ],
      riskBrief: c.riskIndex === 'high'
        ? 'ELEVATED — Executive security protocols required. Full media blackout and thorough vetting enforced.'
        : c.riskIndex === 'medium'
        ? 'MANAGED — NDA activation required. Coordinate all media placement through representation desk.'
        : 'CLEAR — No reputational exposure. Suitable for flagship public campaigns and media-facing events.',
      ndaStatus: c.ndaDefault !== false
        ? 'MANDATORY — NDA is required for all engagements without exception.'
        : 'ADVISORY — NDA strongly recommended depending on event exposure level.',
      optimalLeadTime: c.availability === 'Open' ? '14–21 days via standard pathway' : '30–60 days — limited access windows',
    },
  };
}

async function fetchCelebrityDossier(id, roster = liveRoster) {
  const tryIds = [id, STATIC_API_ID_ALIASES[id]].filter(Boolean);
  const seen = new Set();
  for (const tid of tryIds) {
    if (seen.has(tid)) continue;
    seen.add(tid);
    try {
      return await request('/celebrities/' + tid + '/dossier');
    } catch {
      /* try next */
    }
  }
  const local = localCelebrity(id, roster);
  if (local) return buildLocalDossier(local);
  throw new Error('Celebrity not found');
}

export function nav(active){
  return `<div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div><header class="nav"><div class="nav-inner"><a class="nav-brand" href="index.html" title="All Talents Agency — ATA"><div class="brand-mark brand-mark-ata" aria-hidden="true"><svg class="ata-mark-svg" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="navRecord" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#D4E4F4"/><stop offset="50%" stop-color="#A8BDD9"/><stop offset="100%" stop-color="#6E8EAE"/></linearGradient></defs><rect width="44" height="44" rx="6" fill="#060809"/><rect x="1" y="1" width="42" height="42" rx="5" fill="none" stroke="url(#navRecord)" stroke-width="1"/><text x="22" y="28" font-family="IBM Plex Mono,ui-monospace,monospace" font-size="13" font-weight="700" fill="url(#navRecord)" text-anchor="middle" letter-spacing="-0.5">ATA</text><line x1="10" y1="33" x2="34" y2="33" stroke="url(#navRecord)" stroke-width="0.6" opacity="0.45"/></svg></div><div><div class="brand">All Talents Agency <span class="brand-ata-tag">ATA</span></div><div class="brand-sub">Sovereign Celebrity Representation</div></div></a><div style="display:flex;align-items:center;gap:10px"><span class="desk-status-chip" id="deskStatusChip"><span class="ds-dot"></span><span id="deskStatusText">Live desks</span></span><button class="nav-search-btn" id="navSearchBtn" title="Search talent" aria-label="Search talent"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></button><button class="nav-access-btn" id="navAccessBtn" aria-label="Open navigation" aria-expanded="false"><span class="nab-burger"><span></span><span></span></span><span class="nab-text">ACCESS</span></button></div></div></header>
  <div class="command-palette discover-panel" id="commandPalette" role="dialog" aria-modal="true" aria-label="Discover talent" aria-hidden="true">
    <div class="cp-panel discover-sheet">
      <div class="discover-top">
        <label class="discover-label" for="cpInput">Discover</label>
        <input class="cp-input discover-input" id="cpInput" type="search" placeholder="Name, category, or city" autocomplete="off" spellcheck="false" aria-label="Search the verified roster by name, category, or city">
        <button class="discover-esc" id="cpClose" type="button">Close</button>
      </div>
      <div class="discover-filters" id="discoverFilters">
        <label>Category<select id="discCategory"><option>All</option></select></label>
        <label>Region<select id="discRegion"><option>All</option></select></label>
        <label>Availability<select id="discAvailability"><option>All</option><option>Open</option><option>Limited</option><option>Waitlist</option></select></label>
        <label>Budget<select id="discBudget"><option value="">Any</option><option value="under250">Under $250K</option><option value="mid">$250K–$750K</option><option value="high">$750K–$1.5M</option><option value="ultra">$1.5M+</option></select></label>
      </div>
      <div class="cp-results discover-results" id="cpResults"></div>
    </div>
  </div>
  <div class="nav-overlay" id="navOverlay" role="dialog" aria-modal="true" aria-label="Site navigation">
    <button class="nov-close" id="navOverlayClose" aria-label="Close navigation">&#x2715; CLOSE</button>
    <nav class="nov-menu">
      <a class="nov-link${active==='home'?' nov-active':''}" href="index.html"><span class="nov-num">01</span>Global Roster</a>
      <a class="nov-link${active==='explorer'?' nov-active':''}" href="explorer.html"><span class="nov-num">02</span>Explore Talents</a>
      <a class="nov-link${active==='crowd'?' nov-active':''}" href="crowdbooking.html"><span class="nov-num">03</span>Crowd Access</a>
      <a class="nov-link${active==='booking'?' nov-active':''}" href="booking.html"><span class="nov-num">04</span>Initiate Engagement</a>
      <a class="nov-link${active==='portal'?' nov-active':''}" href="portal.html"><span class="nov-num">05</span>Client Portal</a>
      <a class="nov-link${active==='login'?' nov-active':''}" href="login.html"><span class="nov-num">06</span>Secure Access</a>
    </nav>
    <div class="nov-footer"><span>All Talents Agency</span><span class="nov-footer-sep">·</span><span>Every request becomes a case</span></div>
  </div>`;
}

export function conciergeRail(){
  return `<aside class="concierge-rail">
    <h4>Client Service Concierge</h4>
    <p>Priority desk for high-value inquiries, first-meeting pathways, and executive coordination with representation teams.</p>
    <div class="concierge-actions">
      <a class="primary-action" href="explorer.html">Open Service Desk</a>
      <a href="login.html">Secure Access</a>
      <a href="booking.html">Start Booking Flow</a>
      <a href="portal.html">Client Portal</a>
    </div>
  </aside>`;
}

export function initTheme() {
  document.documentElement.setAttribute('data-theme', 'dark');
  localStorage.setItem('ata_theme', 'dark');
}

// ── CRYPTO PAYMENT WIDGET ────────────────────────────────────────────────────
const CRYPTO_WALLETS = {
  btc:  { name:'Bitcoin',  symbol:'BTC',  icon:'₿',  network:'Bitcoin Network (BTC)',      addr:'bc1qata9xv7k2mnp4z3wl8rdf6sd2xemvs3c8qkm7' },
  eth:  { name:'Ethereum', symbol:'ETH',  icon:'Ξ',  network:'Ethereum Network (ERC-20)',   addr:'0x3A9fC7E8b1D244F0C56A7E2cB9d0143eFa82BD5A' },
  usdt: { name:'Tether',   symbol:'USDT', icon:'₮',  network:'Tron Network (TRC-20)',       addr:'TATALntV5JFV8KdQmP3RnY7xB6wCzPoEHkL' },
  bnb:  { name:'BNB',      symbol:'BNB',  icon:'🟡', network:'BNB Smart Chain (BEP-20)',    addr:'0x3A9fC7E8b1D244F0C56A7E2cB9d0143eFa82BD5A' },
  sol:  { name:'Solana',   symbol:'SOL',  icon:'◎',  network:'Solana Network (SOL)',        addr:'ATAso1Vjk8QPnr4XbmELy7WZC6fT3HDgU9QSt2pR' },
  xrp:  { name:'XRP',      symbol:'XRP',  icon:'✦',  network:'XRP Ledger (XRPL)',           addr:'rATAxK7V9nL3Pm5qW4yBc1zTg8H6oEFdJuS' },
};

// Cosmetic QR grid pattern (11×11)
const QR_P = [1,1,1,1,1,1,1,0,1,0,1, 1,0,0,0,0,0,1,0,0,1,0, 1,0,1,1,1,0,1,0,1,1,1,
              1,0,1,1,1,0,1,0,0,0,1, 1,0,1,1,1,0,1,0,1,0,0, 1,0,0,0,0,0,1,0,0,1,1,
              1,1,1,1,1,1,1,0,1,0,1, 0,0,0,0,0,0,0,0,1,1,0, 1,1,0,1,0,1,1,0,0,1,1,
              0,1,1,0,0,1,0,0,1,0,1, 1,0,1,1,1,1,1,0,1,1,0];

export function buildCryptoPaymentHTML(uid = 'cp') {
  const coins = Object.entries(CRYPTO_WALLETS).map(([key, w]) =>
    `<div class='coin-pill${key==='btc'?' cp-active':''}' data-coin='${key}' data-uid='${uid}'>
      <span class='coin-icon'>${w.icon}</span>
      <span class='coin-name'>${w.symbol}</span>
      <span class='coin-label'>${w.name}</span>
    </div>`).join('');
  const qr = QR_P.map(b => `<div class='qr-cell${b?' qr-b':''}'></div>`).join('');
  return `
    <div class='pay-method-tabs' id='${uid}-tabs'>
      <div class='pay-tab pt-active' data-tab='wire' data-uid='${uid}'>🏦 Wire / Bank</div>
      <div class='pay-tab pt-crypto' data-tab='crypto' data-uid='${uid}'>₿ Cryptocurrency</div>
    </div>
    <div id='${uid}-wire' style='padding:12px 14px;background:rgba(148,180,216,.04);border:1px solid rgba(148,180,216,.15);border-radius:10px;margin-bottom:14px'>
      <p class='small' style='font-weight:700;color:var(--gold);margin-bottom:4px'>Wire Transfer / Bank Escrow</p>
      <p class='small muted' style='font-size:10.5px;line-height:1.6'>Payment details issued after booking confirmation via encrypted portal. SWIFT/IBAN and routing numbers released under NDA. Escrow cleared within 2 banking days.</p>
    </div>
    <div id='${uid}-crypto' class='crypto-section'>
      <div class='coin-grid'>${coins}</div>
      <div class='crypto-wallet-wrap'>
        <div class='cw-network' id='${uid}-network'>Bitcoin Network (BTC)</div>
        <div class='cw-label' style='font-size:10px;color:rgba(229,228,226,.45);margin-bottom:6px'>Send exact amount to this address only — verify network before sending.</div>
        <div class='crypto-addr-row'>
          <div class='crypto-addr' id='${uid}-addr'>bc1qata9xv7k2mnp4z3wl8rdf6sd2xemvs3c8qkm7</div>
          <button class='crypto-copy-btn' id='${uid}-copy'>Copy</button>
        </div>
        <div style='margin-top:14px;display:flex;justify-content:center'>
          <div class='crypto-qr'>${qr}</div>
        </div>
        <p style='text-align:center;font-size:9px;color:rgba(247,147,26,.45);margin-top:4px;letter-spacing:.06em'>SCAN TO VERIFY ADDRESS</p>
      </div>
      <div class='crypto-confirm-note'>⚠ Send only the selected cryptocurrency on the correct network. Wrong coin or network = permanent loss. Transactions are final after 3 on-chain confirmations.</div>
      <div class='buy-crypto-strip'>
        <div class='bcs-label'>Don't have crypto yet? Buy from a trusted agent</div>
        <div class='exchange-grid'>
          <a class='exchange-btn' href='https://www.binance.com/en/buy-sell-crypto' target='_blank' rel='noopener noreferrer'><span class='ex-flag'>🔶</span>Binance</a>
          <a class='exchange-btn' href='https://www.coinbase.com/buy' target='_blank' rel='noopener noreferrer'><span class='ex-flag'>🔵</span>Coinbase</a>
          <a class='exchange-btn' href='https://www.kraken.com/buy-crypto' target='_blank' rel='noopener noreferrer'><span class='ex-flag'>🔷</span>Kraken</a>
          <a class='exchange-btn' href='https://www.bybit.com/en/buy-crypto/' target='_blank' rel='noopener noreferrer'><span class='ex-flag'>⚡</span>Bybit</a>
        </div>
      </div>
    </div>`;
}

export function initCryptoWidget(uid = 'cp', onMethodChange) {
  let activeCoin = 'btc';
  let activeTab  = 'wire';

  const wirePanel   = document.getElementById(`${uid}-wire`);
  const cryptoPanel = document.getElementById(`${uid}-crypto`);
  const addrEl      = document.getElementById(`${uid}-addr`);
  const networkEl   = document.getElementById(`${uid}-network`);
  const copyBtn     = document.getElementById(`${uid}-copy`);

  // Tab switching
  document.querySelectorAll(`#${uid}-tabs .pay-tab`).forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll(`#${uid}-tabs .pay-tab`).forEach(t => t.classList.remove('pt-active'));
      tab.classList.add('pt-active');
      activeTab = tab.dataset.tab;
      if (activeTab === 'wire') {
        wirePanel.style.display = '';
        cryptoPanel.classList.remove('cs-visible');
        onMethodChange?.('wire');
      } else {
        wirePanel.style.display = 'none';
        cryptoPanel.classList.add('cs-visible');
        onMethodChange?.(activeCoin);
      }
    });
  });

  // Coin selection
  document.querySelectorAll(`#${uid}-crypto .coin-pill`).forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll(`#${uid}-crypto .coin-pill`).forEach(p => p.classList.remove('cp-active'));
      pill.classList.add('cp-active');
      activeCoin = pill.dataset.coin;
      const w = CRYPTO_WALLETS[activeCoin];
      networkEl.textContent = w.network;
      addrEl.textContent    = w.addr;
      copyBtn.textContent   = 'Copy';
      copyBtn.classList.remove('copied');
      if (activeTab === 'crypto') onMethodChange?.(activeCoin);
    });
  });

  // Copy address
  copyBtn?.addEventListener('click', async () => {
    const addr = addrEl?.textContent || '';
    try { await navigator.clipboard.writeText(addr); } catch { /* fallback */ }
    copyBtn.textContent = '✓ Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('copied'); }, 2500);
  });

  return { getMethod: () => activeTab === 'wire' ? 'wire' : activeCoin };
}

// ── FULLSCREEN NAV OVERLAY ─────────────────────────────────────────────
export function initNav() {
  mountSmartsupp();
  finishBoot();
  hydrateShortlist();
  const overlay = document.getElementById('navOverlay');
  const openBtn = document.getElementById('navAccessBtn');
  const closeBtn = document.getElementById('navOverlayClose');
  if (!overlay || !openBtn) return;

  function openNav() {
    overlay.classList.add('nov-open');
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    overlay.querySelectorAll('.nov-link').forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-24px)';
      setTimeout(() => {
        el.style.transition = 'opacity .4s ease, transform .4s ease';
        el.style.opacity = '';
        el.style.transform = '';
      }, 80 + i * 70);
    });
  }

  function closeNav() {
    overlay.classList.remove('nov-open');
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', openNav);
  closeBtn?.addEventListener('click', closeNav);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeNav(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      const localSearch = document.getElementById('search');
      if (localSearch) { e.preventDefault(); localSearch.focus(); }
    }
  });
}

export function initCommandPalette(roster = []) {
  const palette = document.getElementById('commandPalette');
  const input = document.getElementById('cpInput');
  const results = document.getElementById('cpResults');
  const searchBtn = document.getElementById('navSearchBtn');
  const closeBtn = document.getElementById('cpClose');
  if (!palette || !input || !results) return;

  const source = () => (roster && roster.length ? roster : liveRoster);
  const catSel = document.getElementById('discCategory');
  const regionSel = document.getElementById('discRegion');
  const availSel = document.getElementById('discAvailability');
  const budgetSel = document.getElementById('discBudget');

  function fillSelect(sel, values) {
    if (!sel || sel.dataset.ready) return;
    const current = sel.value;
    values.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      sel.appendChild(opt);
    });
    sel.value = current;
    sel.dataset.ready = '1';
  }

  function filters() {
    return {
      category: catSel?.value || 'All',
      region: regionSel?.value || 'All',
      availability: availSel?.value || 'All',
      budget: budgetSel?.value || '',
    };
  }

  function budgetOk(price, band) {
    const n = Number(price) || 0;
    if (band === 'under250') return n < 250000;
    if (band === 'mid') return n >= 250000 && n < 750000;
    if (band === 'high') return n >= 750000 && n < 1500000;
    if (band === 'ultra') return n >= 1500000;
    return true;
  }

  function people() {
    const f = filters();
    const q = input.value.trim().toLowerCase();
    return source().filter((c) => {
      if (c.visibility === 'hidden') return false;
      if (f.category !== 'All' && c.category !== f.category) return false;
      if (f.region !== 'All' && c.region !== f.region) return false;
      if (f.availability !== 'All' && c.availability !== f.availability) return false;
      if (!budgetOk(c.startingPrice, f.budget)) return false;
      if (!q) return true;
      const hay = `${c.name} ${c.category} ${c.region} ${c.agencyRepresentation || ''}`.toLowerCase();
      return hay.includes(q) || c.name.toLowerCase().split(' ').some((part) => part.startsWith(q));
    }).slice(0, 12);
  }

  function row(c) {
    const img = c.portrait ? `<img src="${c.portrait}" alt="">` : `<span class="disc-fallback">${(c.name || 'T').slice(0, 1)}</span>`;
    return `<a class="ssp-item disc-row" href="talent.html?id=${encodeURIComponent(c.id)}">${img}<span class="ssp-text"><strong>${c.name}</strong><span class="ssp-meta">${c.category} · ${c.region || '—'} · ${c.availability || ''}</span></span></a>`;
  }

  function render() {
    const list = source();
    fillSelect(catSel, [...new Set(list.map((c) => c.category).filter(Boolean))].sort());
    fillSelect(regionSel, [...new Set(list.map((c) => c.region).filter(Boolean))].sort());
    const matches = people();
    const q = input.value.trim();
    if (!q && filters().category === 'All' && filters().region === 'All' && filters().availability === 'All' && !filters().budget) {
      const cats = [...new Set(list.map((c) => c.category).filter(Boolean))].sort();
      results.innerHTML = `
        <p class="disc-kicker">Browse by category</p>
        <div class="disc-chips">${cats.map((c) => `<button type="button" class="disc-chip" data-cat="${c}">${c}</button>`).join('')}</div>
        <p class="disc-kicker">Browse by occasion</p>
        <div class="disc-chips">
          <a class="disc-chip" href="crowdbooking.html">Crowd Access</a>
          <a class="disc-chip" href="booking.html?pathway=reservation">Reservation</a>
          <a class="disc-chip" href="booking.html?pathway=private">Private engagement</a>
          <a class="disc-chip" href="booking.html?pathway=vacation">Vacation</a>
          <a class="disc-chip" href="booking.html?pathway=full_coverage">Full coverage</a>
          <a class="disc-chip" href="explorer.html#match">Match me</a>
        </div>
        <p class="disc-kicker">Recent dossiers</p>
        ${[...list].sort((a, b) => Number(!!b.featured) - Number(!!a.featured)).slice(0, 4).map(row).join('') || '<p class="disc-empty">No dossiers yet.</p>'}
        <p class="disc-kicker">Upcoming crowd dates</p>
        <div id="discCrowd"><p class="disc-empty">Loading dates…</p></div>`;
      results.querySelectorAll('[data-cat]').forEach((btn) => {
        btn.onclick = () => { catSel.value = btn.dataset.cat; render(); };
      });
      request('/crowd-events').then((res) => {
        const box = document.getElementById('discCrowd');
        if (!box) return;
        const events = (res.data || []).slice(0, 4);
        box.innerHTML = events.length
          ? events.map((ev) => `<a class="disc-row ssp-item" href="crowdbooking.html#calendar"><span class="ssp-text"><strong>${ev.eventTitle}</strong><span class="ssp-meta">${ev.name} · ${ev.city} · ${ev.date} · ${ev.available} left</span></span></a>`).join('')
          : '<p class="disc-empty">No open crowd dates.</p>';
      }).catch(() => {
        const box = document.getElementById('discCrowd');
        if (box) box.innerHTML = '<p class="disc-empty">Crowd dates are unavailable.</p>';
      });
      return;
    }
    if (!matches.length) {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      if (filters().category !== 'All') params.set('category', filters().category);
      if (filters().region !== 'All') params.set('region', filters().region);
      results.innerHTML = `<p class="disc-empty">No roster match${q ? ` for <strong>${q.replace(/</g, '')}</strong>` : ''}.</p><a class="ssp-all" href="explorer.html?${params.toString()}#request">Request this name</a>`;
      return;
    }
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    if (filters().category !== 'All') params.set('category', filters().category);
    if (filters().region !== 'All') params.set('region', filters().region);
    if (filters().availability !== 'All') params.set('availability', filters().availability);
    if (filters().budget) params.set('budget', filters().budget);
    results.innerHTML = matches.map(row).join('') + `<a class="ssp-all" href="explorer.html?${params.toString()}">Open this board in the roster</a>`;
  }

  function openPalette(prefill) {
    palette.classList.add('cp-open');
    palette.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (typeof prefill === 'string') input.value = prefill;
    render();
    setTimeout(() => input.focus(), 30);
  }

  function closePalette() {
    palette.classList.remove('cp-open');
    palette.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  window.__ataOpenDiscover = openPalette;
  searchBtn?.addEventListener('click', () => openPalette(''));
  closeBtn?.addEventListener('click', closePalette);
  palette.addEventListener('click', (e) => { if (e.target === palette) closePalette(); });
  input.addEventListener('input', render);
  [catSel, regionSel, availSel, budgetSel].forEach((el) => el?.addEventListener('change', render));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePalette();
    if (e.key === 'Enter') {
      const first = results.querySelector('a.disc-row, a.ssp-item');
      if (first) { e.preventDefault(); window.location.href = first.getAttribute('href'); }
    }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (palette.classList.contains('cp-open')) closePalette();
      else openPalette('');
    }
  });
}

export function renderPathwayChooser(c) {
  const id = c?.id ? encodeURIComponent(c.id) : '';
  const waitlist = c?.visibility === 'waitlist' || c?.availability === 'Waitlist';
  const cards = [
    ['Crowd Access', 'Share a verified appearance.', id ? `crowdbooking.html?celeb=${id}` : 'crowdbooking.html', true],
    ['Reservation', 'Request a date. Not a confirmed booking.', `booking.html?pathway=reservation${id ? `&id=${id}` : ''}`, true],
    ['Private Engagement', 'Gala, brand, dinner, or performance.', `booking.html?pathway=private${id ? `&id=${id}` : ''}`, !waitlist],
    ['Vacation', 'A destination weekend published by the desk.', `booking.html?pathway=vacation${id ? `&id=${id}` : ''}`, !waitlist],
    ['Full Coverage', 'Exclusive buyout: talent, travel, security, production.', `booking.html?pathway=full_coverage${id ? `&id=${id}` : ''}`, !waitlist],
  ];
  return `<div class="path-chooser">${cards.map(([title, copy, href, open]) => `
    <a class="path-card${open ? '' : ' path-card-locked'}" href="${open ? href : `booking.html?pathway=reservation${id ? `&id=${id}` : ''}`}">
      <strong>${title}</strong>
      <span>${open ? copy : 'Waitlist — reservation only.'}</span>
    </a>`).join('')}</div>`;
}

export function mountSmartsupp() {
  const key = window.ATA_SMARTSUPP_KEY || '97229f7ac536a4dc96013560ce8188410b721c28';
  if (!key || document.getElementById('smartsupp-loader')) return;
  window._smartsupp = window._smartsupp || {};
  window._smartsupp.key = key;
  const s = document.createElement('script');
  s.id = 'smartsupp-loader';
  s.src = 'https://www.smartsuppchat.com/loader.js?' + key;
  s.async = true;
  document.head.appendChild(s);
}

export function setCategoryTint(category) {
  if (!category) return;
  document.body.setAttribute('data-category', category);
}

export function initScrollMotion() {
  if (window.__ataScrollMotion) return;
  window.__ataScrollMotion = true;
  document.documentElement.classList.add('is-loaded');

  const bar = document.getElementById('scrollProgress');
  const update = () => {
    if (!bar) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? `${Math.min(100, (window.scrollY / max) * 100)}%` : '0%';
  };
  window.addEventListener('scroll', update, { passive: true });
  update();

  document.querySelectorAll('[data-parallax]').forEach((el) => {
    const rate = Number(el.dataset.parallax) || 0.025;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const shift = (window.innerHeight / 2 - rect.top) * rate;
      el.style.transform = `translate3d(0,${shift.toFixed(2)}px,0)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  });

  document.querySelectorAll('.scroll-stay').forEach((el) => {
    const parent = el.parentElement;
    if (!parent) return;
    parent.style.position = 'relative';
    const io = new IntersectionObserver(([entry]) => {
      el.classList.toggle('scroll-stay-active', entry.intersectionRatio > 0.35);
    }, { threshold: [0, 0.35, 0.6] });
    io.observe(el);
  });
}

export function initScrollReveal() {
  initScrollMotion();
  document.querySelectorAll('.reveal-on-scroll.persist-visible').forEach(el => el.classList.add('revealed'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      if (e.target.classList.contains('persist-visible')) {
        e.target.classList.add('revealed');
        io.unobserve(e.target);
        return;
      }
      const delay = Number(e.target.dataset.revealDelay) || 0;
      setTimeout(() => {
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      }, delay);
    });
  }, { threshold: 0.04, rootMargin: '0px 0px -20px 0px' });
  document.querySelectorAll('.reveal-on-scroll').forEach(el => {
    if (el.classList.contains('persist-visible')) el.classList.add('revealed');
    else io.observe(el);
  });
}

export function initDynamicTheme() {
  const h = new Date().getHours();
  const period = h >= 22 || h < 6 ? 'night' : h < 10 ? 'morning' : h < 18 ? 'day' : 'evening';
  document.documentElement.setAttribute('data-time-period', period);
  const chip = document.getElementById('deskStatusText');
  if (chip) {
    const labels = {
      night: 'After-hours desk · UTC',
      morning: 'Morning desks opening',
      day: 'Live desks open',
      evening: 'Event windows active',
    };
    chip.textContent = labels[period] || 'Live desks';
  }
}

export function initFlipFilter(containerSel, itemSel) {
  return function flip(filterFn) {
    const container = document.querySelector(containerSel);
    if (!container) return;
    const items = [...container.querySelectorAll(itemSel)];
    const firsts = new Map(items.map(el => [el, el.getBoundingClientRect()]));
    items.forEach(el => { el.style.display = filterFn(el) ? '' : 'none'; });
    items.forEach(el => {
      if (el.style.display === 'none') return;
      const first = firsts.get(el);
      const last = el.getBoundingClientRect();
      if (!first) return;
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (Math.abs(dx) + Math.abs(dy) < 1) return;
      el.animate(
        [{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'translate(0,0)' }],
        { duration: 380, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'none' }
      );
    });
  };
}

