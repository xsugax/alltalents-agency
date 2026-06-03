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
export const setAuth = (tokenValue, user) => {
  localStorage.setItem(TOKEN_KEY, tokenValue);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.removeItem('aurelux_token');
  localStorage.removeItem('aurelux_user');
};
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('aurelux_token');
  localStorage.removeItem('aurelux_user');
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
  return `<header class="glass nav"><a class="brand-wrap" href="index.html"><div class="brand-mark">AT</div><div><div class="brand">All Talents Agency</div><div class="small muted brand-sub">Sovereign Celebrity Representation</div></div></a><nav class="menu">
  <a class="${active==='home'?'active':''}" href="index.html">Home</a>
  <a class="${active==='explorer'?'active':''}" href="explorer.html">Explorer</a>
  <a class="${active==='crowd'?'active':''}" href="crowdbooking.html">Crowd Access</a>
  <a class="${active==='booking'?'active':''}" href="booking.html">Booking</a>
  <a class="${active==='portal'?'active':''}" href="portal.html">Portal</a>
  <a class="${active==='login'?'active':''}" href="login.html">Login</a>
  </nav></header>
  <div class="ticker-outer"><div class="ticker-track" id="tickerTrack"><span class="tick-item muted">Loading market intelligence...</span></div></div>`;
}

export async function loadTicker() {
  try {
    const { events } = await request('/intelligence/ticker');
    const el = document.getElementById('tickerTrack');
    if (!el || !events?.length) return;
    const items = events.map(e =>
      `<span class="tick-item ${e.positive ? 'tick-up' : 'tick-down'}">${e.name} <b>· ${e.event}</b> ${e.change}</span><span class="tick-sep">◆</span>`
    ).join('');
    el.innerHTML = items + items; // duplicate for seamless loop
  } catch { /* silent fail */ }
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

