/** Per-talent meeting playbooks — stable variants by id, category, agency */

const NAMED_OVERRIDES = {
  'Colin Farrell': {
    headline: 'European prestige screening corridor',
    steps: [
      'Submit gala or premiere intent with guest tier through CAA.',
      'Receive controlled-media brief — no paparazzi-facing events without approval.',
      'Lock a 21-day introduction window once NDA and venue class confirm.',
      'Meet at a private screening, festival side-room, or brand-owned Dublin/London suite.',
    ],
    venues: [
      { name: 'Dublin Private Screening', loc: 'Docklands, Ireland' },
      { name: 'Cannes Side Salon', loc: 'Croisette, France' },
      { name: 'LA Prestige Lounge', loc: 'West Hollywood, CA' },
    ],
    leadTime: '21 days via CAA',
    firstMove: 'Frame as prestige film or charity gala — controlled exposure only.',
    messageMeet: (n) => `I'd like to explore a private introduction to ${n} for a prestige gala — happy to share guest profile, media posture, and dates for CAA review.`,
    messageRep: (n) => `Requesting a callback on a curated ${n} engagement — budget confirmed, NDA ready within the week.`,
  },
  'Ryan Gosling': {
    headline: 'Flagship brand summit lane',
    steps: [
      'Share campaign scope and audience demographics with CAA.',
      'Align on Barbie/La La Land-tier creative fit or arthouse screening angle.',
      'Hold priority window while representation confirms rider and escrow band.',
      'Meet at a sealed brand summit, private screening, or executive dinner.',
    ],
    venues: [
      { name: 'NYC Brand Summit', loc: 'Hudson Yards, NY' },
      { name: 'LA Screening Room', loc: 'Culver City, CA' },
      { name: 'Toronto Festival Suite', loc: 'TIFF district, ON' },
    ],
    leadTime: '21 days via CAA',
    firstMove: 'Confirm brand alignment and creative brief before first outreach.',
    messageMeet: (n) => `Seeking a confidential path to meet ${n} for a flagship brand summit — we can meet escrow and share creative brief on request.`,
    messageRep: (n) => `Priority engagement request for ${n} — timeline, venue class, and budget confirmed.`,
  },
  'Anne Hathaway': {
    headline: 'Luxury gala & Versace alignment track',
    steps: [
      'Route through CAA with female-executive audience brief and gala classification.',
      'Versace-tier dress code and media embargo terms issued with NDA pack.',
      'Reserve a limited window — limited availability on luxury calendar.',
      'Meet at a Versace gala, charity premiere, or private rooftop dinner.',
    ],
    venues: [
      { name: 'Milan Fashion Week Suite', loc: 'Quadrilatero, Italy' },
      { name: 'NYC Charity Gala', loc: 'Manhattan, NY' },
      { name: 'London Premiere Lounge', loc: 'Leicester Square, UK' },
    ],
    leadTime: '21 days via CAA',
    firstMove: 'Lead with luxury gala or female-executive summit framing.',
    messageMeet: (n) => `We'd like to explore meeting ${n} at a luxury gala — audience profile and budget band ready for CAA review.`,
    messageRep: (n) => `Representative outreach for ${n}: corporate gala scope, confirmed budget, request for rider overview.`,
  },
  'Keanu Reeves': {
    headline: 'Tech summit & zero-controversy corridor',
    steps: [
      'Submit tech summit or private dinner intent — substance over spectacle.',
      'CAA reviews guest list for discretion; no sensational media angles.',
      'Lock 21-day window with standard NDA and escrow confirmation.',
      'Meet at a tech keynote side-room, private dinner, or charity motorcycle gala.',
    ],
    venues: [
      { name: 'SF Tech Summit Suite', loc: 'SoMa, San Francisco' },
      { name: 'Toronto Private Dinner', loc: 'Yorkville, ON' },
      { name: 'LA Charity Gala', loc: 'Downtown LA, CA' },
    ],
    leadTime: '21 days via CAA',
    firstMove: 'Emphasize discretion, cause alignment, and zero tabloid exposure.',
    messageMeet: (n) => `Requesting a discreet introduction to ${n} for a tech summit dinner — full NDA and guest profile available immediately.`,
    messageRep: (n) => `Callback request for ${n} — private dinner, confirmed budget, no media exposure.`,
  },
  'Charlize Theron': {
    headline: 'UN-aligned private dinner track',
    steps: [
      'Share your event intent and guest profile with our CAA liaison.',
      'Receive a tailored brief — humanitarian or brand summit framing only.',
      'Lock a 72-hour introduction window once terms are confirmed.',
      'Meet at an estate screening, private dinner, or Geneva summit side-room.',
    ],
    venues: [
      { name: 'Geneva Summit Suite', loc: 'Palais des Nations vicinity' },
      { name: 'Cape Town Estate', loc: 'Atlantic Seaboard, South Africa' },
      { name: 'LA Screening Room', loc: 'West Hollywood, CA' },
    ],
    leadTime: '21 days via CAA',
    firstMove: 'Outline cause alignment and audience tier — she accepts substance-led requests only.',
    messageMeet: (n) => `I'd like to explore a private introduction to ${n} — happy to share our event framing, guest profile, and preferred timing for a CAA-routed dinner or summit appearance.`,
    messageRep: (n) => `Requesting a callback regarding a curated engagement with ${n} — we have budget confirmed and can move on venue and NDA within the week.`,
  },
  Beyonce: {
    headline: 'Platinum live-performance corridor',
    steps: [
      'Submit intent and escrow band — Renaissance-tier productions only.',
      'Management reviews creative fit and security footprint.',
      'Hold a priority window while representation finalizes rider and NDA stack.',
      'Appear at a sealed private performance or brand-owned arena night.',
    ],
    venues: [
      { name: 'Houston Private Arena', loc: 'NRG campus — closed set' },
      { name: 'NYC Rooftop Stage', loc: 'Hudson Yards, NY' },
      { name: 'Dubai Opera Private', loc: 'Downtown Dubai' },
    ],
    leadTime: '45–60 days',
    firstMove: 'Confirm production budget and six-week logistics lead before inquiry.',
    messageMeet: (n) => `We're exploring a private appearance with ${n} and can commit to full production escrow — please advise on qualification and the next management review date.`,
    messageRep: (n) => `Representative outreach for ${n}: corporate gala scope, confirmed budget band, and request for rider overview.`,
  },
  'Taylor Swift': {
    headline: 'Eras-tier private access lane',
    steps: [
      'Qualify budget band — Eras-scale escrow required upfront.',
      'UTA desk reviews guest list and media blackout terms.',
      'Reserve a limited window; no public calendar visibility.',
      'Meet backstage at a sealed venue or brand-owned listening session.',
    ],
    venues: [
      { name: 'Nashville Writer Room', loc: 'Music Row, TN' },
      { name: 'London O2 Private', loc: 'Peninsula, London' },
      { name: 'Tokyo Dome Suite', loc: 'Bunkyo, Tokyo' },
    ],
    leadTime: '60 days minimum',
    firstMove: 'Provide event classification and media-rights posture in your first message.',
    messageMeet: (n) => `Seeking a confidential path to meet ${n} — we can meet escrow and NDA requirements; please share the qualification checklist.`,
    messageRep: (n) => `Priority engagement request for ${n} — timeline, venue class, and budget confirmed on our side.`,
  },
  RM: {
    headline: 'HYBE leadership introduction track',
    steps: [
      'Route inquiry through HYBE America with fan-safe venue certification.',
      'UN or cultural summit framing strengthens approval odds.',
      'Hold a 45-day lead window for security and credentialing.',
      'Meet at a fan-safe private suite or diplomatic reception.',
    ],
    venues: [
      { name: 'Seoul HYBE Lounge', loc: 'Yongsan, Seoul' },
      { name: 'UN Side Reception', loc: 'New York, NY' },
      { name: 'London Private Suite', loc: 'Mayfair, London' },
    ],
    leadTime: '45 days via HYBE',
    firstMove: 'Confirm fan-safety protocols and diplomatic or cultural event angle.',
    messageMeet: (n) => `Requesting a HYBE-routed introduction to ${n} — we can provide audience brief, security plan, and preferred dates.`,
    messageRep: (n) => `Callback request for ${n} — corporate cultural event, full compliance pack ready.`,
  },
  Jungkook: {
    headline: 'HYBE solo artist — fan-safe corridor',
    steps: [
      'Submit through HYBE America with 45-day advance minimum.',
      'Provide audience demographics and venue certification docs.',
      'Lock window after golden-album-tier vetting.',
      'Meet at a certified private suite or label listening room.',
    ],
    venues: [
      { name: 'Seoul Listening Room', loc: 'HYBE, Seoul' },
      { name: 'LA Fan-Safe Suite', loc: 'Koreatown, CA' },
      { name: 'Paris Fashion Week Side', loc: '8th Arr., Paris' },
    ],
    leadTime: '45 days',
    firstMove: 'Share venue safety certification and guest list screening plan.',
    messageMeet: (n) => `We'd like to explore meeting ${n} via HYBE — fan-safe venue secured, dates flexible within your lead window.`,
    messageRep: (n) => `Engagement inquiry for ${n} — brand day or private dinner, budget and security brief attached.`,
  },
};

const CATEGORY_VENUES = {
  Film: [
    { name: 'Private Estate Screening', loc: 'Beverly Hills, CA' },
    { name: 'Cannes Villa Reception', loc: 'La Croisette, France' },
    { name: 'London Mayfair Club', loc: 'Mayfair, London' },
  ],
  Music: [
    { name: 'Studio Listening Session', loc: 'Abbey Road vicinity, London' },
    { name: 'Vegas Residency Suite', loc: 'The Strip, NV' },
    { name: 'Nashville Writer Room', loc: 'Music Row, TN' },
  ],
  Sports: [
    { name: 'Paddock Hospitality', loc: 'Monaco GP circuit' },
    { name: 'Stadium VIP Box', loc: 'Major venue TBC' },
    { name: 'Dubai Sports Lounge', loc: 'Downtown Dubai' },
  ],
  Business: [
    { name: 'Davos Side Room', loc: 'Grisons, Switzerland' },
    { name: 'SF Private Boardroom', loc: 'SoMa, CA' },
    { name: 'Singapore Summit', loc: 'Marina Bay' },
  ],
  Influencer: [
    { name: 'Creator House', loc: 'Los Angeles, CA' },
    { name: 'Brand Day Set', loc: 'Client location' },
    { name: 'Podcast Studio Private', loc: 'Brooklyn, NY' },
  ],
  Comedy: [
    { name: 'Green Room Private', loc: 'Comedy Cellar, NY' },
    { name: 'Arena Backstage', loc: 'Tour city TBC' },
    { name: 'Corporate Roast Night', loc: 'Client venue' },
  ],
};

const STEP_VARIANTS = [
  [
    'Tell us your occasion and who will be in the room.',
    'Your ATA rep aligns the brief with their agency desk.',
    'Reserve a priority window — not a confirmed booking yet.',
    'Meet at the venue that fits their category and comfort level.',
  ],
  [
    'Open with budget band and event type — we route to the right desk.',
    'Receive a tailored brief within 24 hours of qualification.',
    'Hold a 72-hour slot while representation reviews fit.',
    'Confirm date, venue, and NDA before travel logistics.',
  ],
  [
    'Share guest profile and media posture in your first note.',
    'Agency reviews alignment — typically 2–5 business days.',
    'Lock escrow and window reservation together.',
    'Proximity event coordinated by your dedicated rep.',
  ],
  [
    'Describe the moment you want — dinner, keynote, or private meet.',
    'We match you to their representation channel only.',
    'Priority window secures your place ahead of public waitlists.',
    'Introduction happens on their terms, at a vetted venue.',
  ],
];

const HEADLINE_VARIANTS = {
  Film: ['Private screening & dinner track', 'Red-carpet-adjacent introduction', 'Estate reception pathway'],
  Music: ['Backstage & listening-room lane', 'Residency-side introduction', 'Label-routed private session'],
  Sports: ['Paddock & hospitality suite track', 'VIP box introduction pathway', 'Championship-week proximity'],
  Business: ['Summit side-room introduction', 'Boardroom keynote track', 'Founder dinner pathway'],
  Influencer: ['Brand-day & creator-house lane', 'Campaign collaboration intro', 'Private fan-safe meet'],
  Comedy: ['Green-room introduction track', 'Corporate set pathway', 'Backstage meet & greet lane'],
};

function hashId(id) {
  const n = parseInt(String(id || '').replace(/\D/g, ''), 10) || 1;
  return n;
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

export function getMeetingPlaybook(celeb) {
  if (!celeb) {
    return {
      headline: 'Introduction pathway',
      steps: STEP_VARIANTS[0],
      venues: CATEGORY_VENUES.Film,
      leadTime: '14–21 days',
      firstMove: 'Share your event intent to begin.',
      messageStarter: 'I would like to explore a private introduction — please advise on next steps.',
      portalCta: 'Request introduction',
      portalStatus: 'Introduction windows available for qualified clients',
    };
  }

  const override = NAMED_OVERRIDES[celeb.name];
  if (override) {
    const first = celeb.name.split(' ')[0];
    return {
      headline: override.headline,
      steps: override.steps,
      venues: override.venues,
      leadTime: override.leadTime,
      firstMove: override.firstMove,
      messageStarter: override.messageMeet(celeb.name),
      messageRep: override.messageRep(celeb.name),
      portalCta: 'Request introduction',
      portalStatus: getSessionStatus(celeb),
    };
  }

  const seed = hashId(celeb.id);
  const cat = celeb.category || 'Film';
  const headlines = HEADLINE_VARIANTS[cat] || HEADLINE_VARIANTS.Film;
  const avail = celeb.availability || 'Open';
  const leadTime = avail === 'Waitlist'
    ? '30–60 days'
    : avail === 'Limited'
      ? '21–30 days'
      : '14–21 days';

  const agency = celeb.agencyRepresentation || 'their representation';
  const steps = STEP_VARIANTS[seed % STEP_VARIANTS.length].map((s, i) => {
    if (i === 1) return s.replace('agency desk', `${agency} desk`).replace('Agency', agency);
    return s;
  });

  const first = celeb.name.split(' ')[0];
  const variant = seed % 3;

  return {
    headline: `${first}: ${pick(headlines, seed)}`,
    steps,
    venues: (CATEGORY_VENUES[cat] || CATEGORY_VENUES.Film).map((v, i) => ({
      ...v,
      name: i === seed % 3 ? v.name : v.name,
    })),
    leadTime: `${leadTime} via ${agency}`,
    firstMove: `Confirm occasion type and guest tier — ${first}'s team reviews ${avail.toLowerCase()} requests first.`,
    messageStarter: variant === 0
      ? `I'd like to explore meeting ${celeb.name} — we have dates in mind and can share budget range and guest profile on request.`
      : variant === 1
        ? `Requesting an introduction to ${celeb.name} for a private ${cat.toLowerCase()} engagement — happy to move quickly on NDA and escrow.`
        : `We're interested in a curated moment with ${celeb.name} — please advise lead time and the first step through ${agency}.`,
    messageRep: `Representative message for ${celeb.name}: we'd like to discuss fit, timing, and terms for an upcoming event.`,
    portalCta: 'Request introduction',
    portalStatus: getSessionStatus(celeb),
  };
}

function getSessionStatus(celeb) {
  const avail = celeb.availability || 'Open';
  if (avail === 'Waitlist') return 'Waitlist — qualified clients notified first';
  if (avail === 'Limited') return 'Limited windows — respond within 48h of inquiry';
  return 'Open for qualified introductions';
}

export function renderMeetingPlaybookCard(celeb) {
  const pb = getMeetingPlaybook(celeb);
  const first = celeb.name.split(' ')[0];
  return `
    <article class="card stack meeting-playbook-card">
      <p class="eyebrow">How meetings with ${first} work</p>
      <h3 style="margin:4px 0 12px;font-size:17px">${pb.headline}</h3>
      <ol class="playbook-steps">
        ${pb.steps.map(s => `<li>${s}</li>`).join('')}
      </ol>
      <p class="small muted" style="margin-top:12px"><strong>Lead time:</strong> ${pb.leadTime}</p>
      <p class="small muted"><strong>First move:</strong> ${pb.firstMove}</p>
    </article>`;
}
