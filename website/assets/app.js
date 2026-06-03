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
  getPrestigeTickerEvents,
  ANCHOR_COPY,
} from './access-protocol.js';

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
  getPrestigeTickerEvents,
  ANCHOR_COPY,
};

export async function request(path, options = {}) {
  const response = await fetch(`${_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Request failed');
  return payload;
}

export function nav(active){
  return `<div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div><header class="nav"><div class="nav-inner"><a class="nav-brand" href="index.html" title="All Talents Agency — ATA"><div class="brand-mark brand-mark-ata" aria-hidden="true"><svg class="ata-mark-svg" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="navBrass" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#E8D5A3"/><stop offset="50%" stop-color="#C9A962"/><stop offset="100%" stop-color="#9A7840"/></linearGradient></defs><rect width="44" height="44" rx="6" fill="#060809"/><rect x="1" y="1" width="42" height="42" rx="5" fill="none" stroke="url(#navBrass)" stroke-width="1"/><text x="22" y="28" font-family="IBM Plex Mono,ui-monospace,monospace" font-size="13" font-weight="700" fill="url(#navBrass)" text-anchor="middle" letter-spacing="-0.5">ATA</text><line x1="10" y1="33" x2="34" y2="33" stroke="url(#navBrass)" stroke-width="0.6" opacity="0.45"/></svg></div><div><div class="brand">All Talents Agency <span class="brand-ata-tag">ATA</span></div><div class="brand-sub">Sovereign Celebrity Representation</div></div></a><div style="display:flex;align-items:center;gap:10px"><span class="desk-status-chip" id="deskStatusChip"><span class="ds-dot"></span><span id="deskStatusText">Live desks</span></span><button class="nav-search-btn" id="navSearchBtn" title="Command palette (Ctrl+K)" aria-label="Command palette"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></button><button class="nav-access-btn" id="navAccessBtn" aria-label="Open navigation" aria-expanded="false"><span class="nab-burger"><span></span><span></span></span><span class="nab-text">ACCESS</span></button></div></div></header>
  <div class="command-palette" id="commandPalette" role="dialog" aria-modal="true" aria-label="Command palette" aria-hidden="true">
    <div class="cp-panel">
      <div class="cp-header">
        <span class="cp-kbd">⌘K</span>
        <input class="cp-input" id="cpInput" placeholder="Search talent, routes, or type book Beyonce…" autocomplete="off" spellcheck="false">
        <button class="cp-kbd" id="cpClose" type="button" style="cursor:pointer;background:transparent">ESC</button>
      </div>
      <div class="cp-section" id="cpRoutes">
        <div class="cp-section-label">Quick routes</div>
        <a class="cp-item" data-cp-href="explorer.html"><span class="cp-item-icon">02</span><span>Explore Talents</span></a>
        <a class="cp-item" data-cp-href="booking.html"><span class="cp-item-icon">04</span><span>Initiate Engagement</span></a>
        <a class="cp-item" data-cp-href="crowdbooking.html"><span class="cp-item-icon">03</span><span>Crowd Access</span></a>
        <a class="cp-item" data-cp-href="portal.html"><span class="cp-item-icon">05</span><span>Client Portal</span></a>
      </div>
      <div class="cp-section" id="cpRecentSection" style="display:none">
        <div class="cp-section-label">Recent</div>
        <div id="cpRecentList"></div>
      </div>
      <div class="cp-section">
        <div class="cp-section-label">Roster matches</div>
        <div class="cp-results" id="cpResults"><div class="cp-empty">Type to search ${active === 'home' ? '166+' : ''} verified talents</div></div>
      </div>
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
    <div class="nov-footer"><span>All Talents Agency</span><span class="nov-footer-sep">·</span><span>Sovereign · NDA-protected · Escrow-secured</span></div>
  </div>
  <div class="ticker-outer"><div class="ticker-track" id="tickerTrack"></div></div>`;
}

const TICKER_EVENTS = [
  { name: 'Beyoncé', event: 'Booking Confirmed', change: '+$4.2M', positive: true },
  { name: 'Taylor Swift', event: 'Window Extended', change: 'Open', positive: true },
  { name: 'Cristiano Ronaldo', event: 'New Access Inquiry', change: '+$2.1M', positive: true },
  { name: 'Rihanna', event: 'Limited Slots', change: '3 remaining', positive: false },
  { name: 'Drake', event: 'Availability Confirmed', change: 'Q3 2026', positive: true },
  { name: 'LeBron James', event: 'Waitlist Active', change: 'High Demand', positive: false },
  { name: 'The Weeknd', event: 'Rate Updated', change: '+$800K', positive: true },
  { name: 'Lionel Messi', event: 'Booking Confirmed', change: '+$3.8M', positive: true },
  { name: 'Kim Kardashian', event: 'Window Opening', change: 'Nov 2026', positive: true },
  { name: 'Dwayne Johnson', event: 'New Inquiry', change: '+$5.0M', positive: true },
];

function renderTickerItems(events) {
  const el = document.getElementById('tickerTrack');
  if (!el) return;
  const items = events.map(e =>
    `<span class="tick-item ${e.positive ? 'tick-up' : 'tick-down'}">${e.name} <b>· ${e.event}</b> ${e.change}</span><span class="tick-sep">◆</span>`
  ).join('');
  el.innerHTML = items + items;
}

export async function loadTicker() {
  const prestige = getPrestigeTickerEvents();
  try {
    const data = await fetch(`${_API}/intelligence/ticker`).then(r => r.json());
    if (data?.events?.length) {
      const blended = [
        ...prestige,
        ...data.events.slice(0, 18).map(e => ({
          name: e.name,
          event: e.event || e.label,
          change: e.change || '',
          positive: e.positive !== false,
        })),
      ];
      renderTickerItems(blended);
      return;
    }
  } catch { /* fallback */ }
  renderTickerItems([...prestige, ...TICKER_EVENTS]);
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
  const recentSection = document.getElementById('cpRecentSection');
  const recentList = document.getElementById('cpRecentList');
  const searchBtn = document.getElementById('navSearchBtn');
  const closeBtn = document.getElementById('cpClose');
  if (!palette || !input || !results) return;

  let activeIdx = -1;
  let currentItems = [];

  function renderRecent() {
    const recent = getRecentViews();
    if (!recent.length || !recentSection || !recentList) return;
    recentSection.style.display = '';
    recentList.innerHTML = recent.map(r => {
      const c = roster.find(x => x.id === r.id);
      const name = c?.name || r.name || r.id;
      return `<a class="cp-item" data-cp-href="talent.html?id=${r.id}"><span class="cp-item-icon">↺</span><span>${name}</span><span class="cp-item-meta">${r.id}</span></a>`;
    }).join('');
    recentList.querySelectorAll('[data-cp-href]').forEach(el => {
      el.addEventListener('click', (e) => { e.preventDefault(); go(el.dataset.cpHref); });
    });
  }

  function renderResults(q) {
    const intent = parsePaletteIntent(q, roster);
    const matches = paletteSearchRoster(q, roster, 8);
    currentItems = [];
    let html = '';
    if (intent && intent.type === 'route') {
      html += `<a class="cp-item cp-active" data-cp-href="${intent.href}"><span class="cp-item-icon">→</span><span>Go to ${intent.label}</span></a>`;
      currentItems.push(intent.href);
    } else if (intent && (intent.type === 'dossier' || intent.type === 'book' || intent.type === 'path' || intent.type === 'hold')) {
      const icons = { book: 'B', dossier: 'D', path: 'P', hold: 'H' };
      const labels = { book: 'Book', dossier: 'Open dossier', path: 'Access path', hold: 'Hold window' };
      const holdAttrs = intent.type === 'hold' && intent.celeb
        ? ` data-cp-action="hold" data-cp-id="${intent.celeb.id}" data-cp-name="${(intent.celeb.name || '').replace(/"/g, '&quot;')}"`
        : '';
      const pathAttrs = intent.type === 'path' ? ' data-cp-action="path"' : '';
      html += `<a class="cp-item cp-active"${holdAttrs}${pathAttrs} data-cp-href="${intent.href}"><span class="cp-item-icon">${icons[intent.type] || '→'}</span><span>${labels[intent.type] || intent.type}${intent.celeb ? ': ' + intent.celeb.name : ''}</span><span class="cp-item-meta">${intent.celeb ? formatPrice(intent.celeb.startingPrice) : ''}</span></a>`;
      currentItems.push(intent.type === 'hold' ? 'hold' : intent.href);
    } else if (intent && intent.type === 'qualify') {
      html += `<a class="cp-item cp-active" data-cp-action="qualify"><span class="cp-item-icon">Q</span><span>Start client qualification</span></a>`;
      currentItems.push('qualify');
    } else if (intent && intent.type === 'search') {
      html += `<a class="cp-item cp-active" data-cp-href="${intent.href}"><span class="cp-item-icon">⌕</span><span>Search roster for "${q.trim()}"</span></a>`;
      currentItems.push(intent.href);
    }
    matches.forEach((c, i) => {
      const href = `talent.html?id=${c.id}`;
      html += `<a class="cp-item${!html && i === 0 ? ' cp-active' : ''}" data-cp-href="${href}" data-cp-book="booking.html?id=${c.id}"><span class="cp-item-icon">${(c.name[0] || 'T').toUpperCase()}</span><span>${c.name}</span><span class="cp-item-meta">${c.category} · ${formatPrice(c.startingPrice)}</span></a>`;
      if (!currentItems.length) currentItems.push(href);
      currentItems.push(href);
    });
    if (!html) {
      results.innerHTML = `<div class="cp-empty">${q.trim() ? 'No matches — try a route name or celebrity' : 'Type to search verified talents'}</div>`;
      return;
    }
    results.innerHTML = html;
    activeIdx = 0;
    results.querySelectorAll('.cp-item').forEach((el, idx) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (el.dataset.cpAction === 'qualify') {
          closePalette();
          openQualifyModal('');
          return;
        }
        if (el.dataset.cpAction === 'hold') {
          closePalette();
          triggerWindowHold(el.dataset.cpId, el.dataset.cpName);
          return;
        }
        if (el.dataset.cpAction === 'path') {
          closePalette();
          const href = el.dataset.cpHref || '';
          if (href.includes('#')) {
            const hash = href.split('#')[1];
            document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
          go(href);
          return;
        }
        if (e.shiftKey && el.dataset.cpBook) go(el.dataset.cpBook);
        else go(el.dataset.cpHref);
      });
      if (idx === 0) el.classList.add('cp-active');
    });
  }

  function go(href) {
    if (!href) return;
    closePalette();
    window.location.href = href;
  }

  function openPalette() {
    palette.classList.add('cp-open');
    palette.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderRecent();
    input.value = '';
    renderResults('');
    setTimeout(() => input.focus(), 40);
  }

  function closePalette() {
    palette.classList.remove('cp-open');
    palette.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeIdx = -1;
  }

  searchBtn?.addEventListener('click', openPalette);
  closeBtn?.addEventListener('click', closePalette);
  palette.addEventListener('click', (e) => { if (e.target === palette) closePalette(); });

  input.addEventListener('input', () => renderResults(input.value));
  input.addEventListener('keydown', (e) => {
    const items = [...results.querySelectorAll('.cp-item')];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, items.length - 1);
      items.forEach((el, i) => el.classList.toggle('cp-active', i === activeIdx));
      items[activeIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      items.forEach((el, i) => el.classList.toggle('cp-active', i === activeIdx));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const active = items[activeIdx] || items[0];
      if (active?.dataset.cpAction === 'qualify') {
        closePalette();
        openQualifyModal('');
        return;
      }
      if (active?.dataset.cpAction === 'hold') {
        closePalette();
        triggerWindowHold(active.dataset.cpId, active.dataset.cpName);
        return;
      }
      if (active?.dataset.cpAction === 'path') {
        closePalette();
        const href = active.dataset.cpHref || '';
        if (href.includes('#')) {
          document.getElementById(href.split('#')[1])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else go(href);
        return;
      }
      if (active) go(active.dataset.cpHref);
      else {
        const intent = parsePaletteIntent(input.value, roster);
        if (intent) go(intent.href);
      }
    } else if (e.key === 'Escape') {
      closePalette();
    }
  });

  document.querySelectorAll('#cpRoutes [data-cp-href]').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); go(el.dataset.cpHref); });
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (palette.classList.contains('cp-open')) closePalette();
      else openPalette();
    }
  });
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
    const rate = Number(el.dataset.parallax) || 0.06;
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
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const delay = Number(e.target.dataset.revealDelay) || 0;
      setTimeout(() => {
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      }, delay);
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -32px 0px' });
  document.querySelectorAll('.reveal-on-scroll').forEach(el => io.observe(el));
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

