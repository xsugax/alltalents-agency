import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { connect, exec, query, dbMode } from './db.js';
import { CROWD_EVENTS } from './data.js';
import { filterCelebritiesBySearch } from './celebrity-search.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PATHWAYS = ['crowd', 'reservation', 'private', 'vacation', 'full_coverage', 'match', 'unlisted'];
export const STATUSES = ['Received', 'In review', 'Terms offered', 'Confirmed', 'Declined', 'Cancelled'];
export const VISIBILITY = ['public', 'hidden', 'waitlist'];

const HIDDEN_NAMES = new Set([
  'mia khalifa', 'lana rhoades', 'riley reid', 'brandi love', 'eva elfie',
]);

const FEATURED_NAMES = [
  'Charlize Theron', 'Salma Hayek', 'Johnny Depp', 'Zendaya', 'Taylor Swift', 'Chris Evans', 'Jennifer Aniston',
];

const OFF_ROSTER = ['beyonce', 'cristiano ronaldo'];

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** In-memory view kept in sync with Postgres for existing handlers. */
export const db = {
  users: [],
  celebrities: [],
  bookings: [],
  crowdBookings: [],
  messages: [],
};

let emit = () => {};
export function onAdminEvent(fn) { emit = fn; }

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  password_hash text NOT NULL,
  suspended boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS categories (
  name text PRIMARY KEY,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS talents (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  region text,
  availability text,
  visibility text NOT NULL DEFAULT 'public',
  starting_price integer NOT NULL DEFAULT 0,
  portrait text,
  featured boolean NOT NULL DEFAULT false,
  featured_order integer,
  profile jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS experiences (
  id text PRIMARY KEY,
  talent_id text NOT NULL,
  pathway text NOT NULL,
  title text NOT NULL,
  summary text,
  location text,
  price_from integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS crowd_events (
  id text PRIMARY KEY,
  talent_id text,
  talent_name text,
  title text NOT NULL,
  event_type text,
  city text,
  event_date text,
  slots integer NOT NULL,
  claimed integer NOT NULL DEFAULT 0,
  price_per_slot integer NOT NULL,
  includes jsonb NOT NULL DEFAULT '[]',
  published boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS cases (
  id text PRIMARY KEY,
  pathway text NOT NULL,
  status text NOT NULL,
  user_id text,
  client_name text,
  client_email text,
  talent_id text,
  talent_name text,
  event_type text,
  event_date text,
  location text,
  budget_band text,
  quote integer,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS case_events (
  id text PRIMARY KEY,
  case_id text NOT NULL,
  status text NOT NULL,
  actor text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS shortlists (
  user_id text PRIMARY KEY,
  talent_ids jsonb NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS content_blocks (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY,
  actor text,
  action text NOT NULL,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS messages (
  id text PRIMARY KEY,
  from_name text,
  to_user_id text,
  body text,
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

function talentFromRow(row) {
  const profile = parseJson(row.profile, {});
  return {
    ...profile,
    id: row.id,
    name: row.name,
    category: row.category,
    region: row.region,
    availability: row.availability,
    visibility: row.visibility,
    startingPrice: row.starting_price,
    portrait: row.portrait || profile.portrait,
    featured: row.featured,
    featuredOrder: row.featured_order,
  };
}

function caseToBooking(row) {
  const details = parseJson(row.details, {});
  return {
    id: row.id,
    pathway: row.pathway,
    status: row.status,
    userId: row.user_id,
    userName: row.client_name,
    userEmail: row.client_email,
    celebrityId: row.talent_id,
    celebrityName: row.talent_name,
    eventType: row.event_type,
    date: row.event_date,
    location: row.location,
    budgetBand: row.budget_band,
    contractId: details.contractId || row.id.slice(0, 8).toUpperCase(),
    pricing: { finalQuote: row.quote || 0, escrow: 0, escrowPercent: 0 },
    details,
    createdAt: row.created_at,
  };
}

async function reload() {
  const users = await query('SELECT * FROM users ORDER BY email');
  db.users = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    suspended: !!u.suspended,
    passwordHash: u.password_hash,
  }));

  const publishedCats = new Set(
    (await query('SELECT name FROM categories WHERE published = true')).map((r) => r.name),
  );
  const talentRows = await query('SELECT * FROM talents ORDER BY featured_order NULLS LAST, name');
  const all = talentRows.map(talentFromRow);
  db.celebrities = all.filter((t) => t.visibility !== 'hidden' && publishedCats.has(t.category));

  const caseRows = await query('SELECT * FROM cases ORDER BY created_at DESC');
  const bookings = caseRows.map(caseToBooking);
  db.bookings = bookings.filter((b) => b.pathway !== 'crowd');
  db.crowdBookings = bookings.filter((b) => b.pathway === 'crowd').map((b) => ({
    ...b,
    eventId: b.details.eventId,
    eventTitle: b.eventType,
    celebName: b.celebrityName,
    celebId: b.celebrityId,
    city: b.location,
    slotCode: b.details.slotCode,
    totalPrice: b.pricing.finalQuote,
    paymentStatus: b.status,
    nextPayment: b.pricing.finalQuote,
  }));

  const msgs = await query('SELECT * FROM messages ORDER BY created_at');
  db.messages = msgs.map((m) => ({
    id: m.id,
    from: m.from_name,
    toUserId: m.to_user_id,
    body: m.body,
    timestamp: m.created_at,
  }));
}

async function seed() {
  const { CELEBRITIES } = await import('../../website/assets/celebrities-data.js');
  const users = [
    ['u1', 'client@alltalents.agency', 'Aria Sterling', 'client', 'Client@123'],
    ['u2', 'manager@alltalents.agency', 'Marcus Vale', 'manager', 'Manager@123'],
    ['u3', 'admin@alltalents.agency', 'Helena Noir', 'admin', 'Admin@123'],
  ];
  for (const [id, email, name, role, password] of users) {
    await query(
      `INSERT INTO users (id, email, name, role, password_hash) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO NOTHING`,
      [id, email, name, role, bcrypt.hashSync(password, 10)],
    );
  }

  const categories = [...new Set(CELEBRITIES.map((c) => c.category))];
  for (let i = 0; i < categories.length; i++) {
    await query(
      `INSERT INTO categories (name, published, sort_order) VALUES ($1, true, $2) ON CONFLICT (name) DO NOTHING`,
      [categories[i], i],
    );
  }

  const featuredSet = new Map(FEATURED_NAMES.map((n, i) => [n.toLowerCase(), i]));
  for (const celeb of CELEBRITIES) {
    const hidden = HIDDEN_NAMES.has(String(celeb.name).toLowerCase());
    const visibility = hidden ? 'hidden' : (celeb.availability === 'Waitlist' ? 'waitlist' : 'public');
    const featuredOrder = featuredSet.get(String(celeb.name).toLowerCase());
    const featured = featuredOrder != null;
    await query(
      `INSERT INTO talents
        (id, name, category, region, availability, visibility, starting_price, portrait, featured, featured_order, profile)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [
        celeb.id, celeb.name, celeb.category, celeb.region, celeb.availability, visibility,
        celeb.startingPrice || 0, celeb.portrait || '', featured, featured ? featuredOrder : null,
        JSON.stringify({ ...celeb, visibility }),
      ],
    );

    const experiences = [
      {
        pathway: 'private',
        title: `Private engagement with ${celeb.name}`,
        summary: 'Gala, brand, dinner, performance, or meet-and-greet coordinated through the representation desk.',
        location: celeb.region,
        price: celeb.startingPrice,
      },
      {
        pathway: 'vacation',
        title: `${celeb.name} destination weekend`,
        summary: 'A hosted destination appearance — villa, yacht, or festival — published by the desk.',
        location: celeb.region,
        price: Math.round((celeb.startingPrice || 0) * 1.35),
      },
      {
        pathway: 'full_coverage',
        title: `${celeb.name} exclusive buyout`,
        summary: 'One client. Talent, travel, security, and production held for a single engagement.',
        location: 'Client site',
        price: Math.round((celeb.startingPrice || 0) * 2.1),
      },
      {
        pathway: 'reservation',
        title: `Date window for ${celeb.name}`,
        summary: 'Request a date. This is a reservation, not a confirmed booking.',
        location: celeb.region,
        price: celeb.startingPrice,
      },
    ];
    for (const exp of experiences) {
      await query(
        `INSERT INTO experiences (id, talent_id, pathway, title, summary, location, price_from, published)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
        [uuid(), celeb.id, exp.pathway, exp.title, exp.summary, exp.location, exp.price || 0],
      );
    }
  }

  const byName = new Map(CELEBRITIES.map((c) => [c.name.toLowerCase().normalize('NFD').replace(/\p{M}/gu, ''), c]));
  for (const ev of CROWD_EVENTS) {
    const key = String(ev.name || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    const talent = byName.get(key) || CELEBRITIES.find((c) => c.id === ev.celebId);
    await query(
      `INSERT INTO crowd_events
        (id, talent_id, talent_name, title, event_type, city, event_date, slots, claimed, price_per_slot, includes, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,true)
       ON CONFLICT (id) DO NOTHING`,
      [
        ev.id, talent?.id || ev.celebId, talent?.name || ev.name, ev.eventTitle, ev.eventType,
        ev.city, ev.date, ev.slots, ev.claimed || 0, ev.pricePerSlot, JSON.stringify(ev.includes || []),
      ],
    );
  }

  await query(
    `INSERT INTO content_blocks (key, value) VALUES ('home', $1::jsonb)
     ON CONFLICT (key) DO NOTHING`,
    [JSON.stringify({
      headline: 'The authorized way to meet them.',
      sub: 'Verified roster. Five ways to request access. Every request becomes a case the desk can track.',
    })],
  );

  await query(
    `INSERT INTO messages (id, from_name, to_user_id, body) VALUES ($1,$2,$3,$4)`,
    ['m1', 'Representation Desk', 'u1', 'Welcome to All Talents Agency. Your client line is active. Live chat stays on Smartsupp.'],
  );
}

function crowdSlotPrice(starting) {
  const figure = Number(starting) || 0;
  const share = Math.round((figure * 0.004) / 100) * 100;
  return Math.min(25000, Math.max(2500, share || 2500));
}

function crowdCity(region) {
  const cities = {
    'North America': 'Los Angeles',
    Europe: 'London',
    'Latin America': 'Mexico City',
    Asia: 'Singapore',
    Africa: 'Cape Town',
    'Middle East': 'Dubai',
  };
  return cities[region] || region || 'Client city';
}

export async function ensureCrowdCoverage() {
  const talents = await query(
    `SELECT id, name, category, region, starting_price FROM talents WHERE visibility <> 'hidden' ORDER BY name`,
  );
  const existing = await query(`SELECT talent_id FROM crowd_events WHERE talent_id IS NOT NULL`);
  const covered = new Set(existing.map((row) => row.talent_id));
  let added = 0;
  for (let i = 0; i < talents.length; i++) {
    const talent = talents[i];
    if (covered.has(talent.id)) continue;
    const when = new Date();
    when.setUTCDate(when.getUTCDate() + 21 + (i % 180));
    const date = when.toISOString().slice(0, 10);
    await query(
      `INSERT INTO crowd_events
        (id, talent_id, talent_name, title, event_type, city, event_date, slots, claimed, price_per_slot, includes, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,20,0,$8,$9::jsonb,true)
       ON CONFLICT (id) DO NOTHING`,
      [
        `ce_${talent.id}`,
        talent.id,
        talent.name,
        `${talent.name} shared appearance`,
        talent.category || 'Appearance',
        crowdCity(talent.region),
        date,
        crowdSlotPrice(talent.starting_price),
        JSON.stringify(['Shared verified appearance', 'Published slot figure', 'The desk confirms the place']),
      ],
    );
    added += 1;
  }
  if (added) console.log(`[ATA] crowd dates added for ${added} talents`);
}

function plainName(name) {
  return String(name || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

async function insertTalentRecord(celeb) {
  const hidden = HIDDEN_NAMES.has(plainName(celeb.name));
  const visibility = hidden ? 'hidden' : (celeb.availability === 'Waitlist' ? 'waitlist' : 'public');
  const featuredOrder = FEATURED_NAMES.findIndex((n) => plainName(n) === plainName(celeb.name));
  const featured = featuredOrder >= 0;
  await query(
    `INSERT INTO talents
      (id, name, category, region, availability, visibility, starting_price, portrait, featured, featured_order, profile)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [
      celeb.id, celeb.name, celeb.category, celeb.region, celeb.availability, visibility,
      celeb.startingPrice || 0, celeb.portrait || '', featured, featured ? featuredOrder : null,
      JSON.stringify(celeb),
    ],
  );
  const experiences = [
    { pathway: 'private', title: `Private time with ${celeb.name}`, summary: celeb.eliteSignal || '', location: celeb.region, price: celeb.startingPrice },
    { pathway: 'vacation', title: `Travel with ${celeb.name}`, summary: 'A hosted trip arranged through the desk.', location: celeb.region, price: Math.round((celeb.startingPrice || 0) * 1.8) },
    { pathway: 'full_coverage', title: `Full coverage with ${celeb.name}`, summary: 'The desk stays with the engagement from first brief to the day itself.', location: celeb.region, price: Math.round((celeb.startingPrice || 0) * 2.4) },
  ];
  for (const exp of experiences) {
    await query(
      `INSERT INTO experiences (id, talent_id, pathway, title, summary, location, price_from, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
      [uuid(), celeb.id, exp.pathway, exp.title, exp.summary, exp.location, exp.price || 0],
    );
  }
}

/** Hides names taken off the roster and inserts anyone added after the first seed. */
async function applyRosterEdit() {
  const { CELEBRITIES } = await import('../../website/assets/celebrities-data.js');
  await query(
    `UPDATE talents SET visibility = 'hidden', featured = false, featured_order = NULL
     WHERE lower(translate(name, 'éÉàÀ', 'eEaA')) = ANY($1::text[])`,
    [OFF_ROSTER],
  );
  await query(
    `UPDATE crowd_events SET published = false
     WHERE lower(translate(talent_name, 'éÉàÀ', 'eEaA')) = ANY($1::text[])
        OR talent_id IN (SELECT id FROM talents WHERE visibility = 'hidden')`,
    [OFF_ROSTER],
  );

  const rows = await query('SELECT lower(name) AS name FROM talents');
  const have = new Set(rows.map((row) => plainName(row.name)));
  for (const celeb of CELEBRITIES) {
    if (have.has(plainName(celeb.name))) continue;
    await insertTalentRecord(celeb);
  }

  await query(`UPDATE talents SET featured = false, featured_order = NULL WHERE visibility <> 'hidden'`);
  for (let i = 0; i < FEATURED_NAMES.length; i++) {
    await query(
      `UPDATE talents SET featured = true, featured_order = $2
       WHERE lower(name) = lower($1) AND visibility <> 'hidden'`,
      [FEATURED_NAMES[i], i],
    );
  }
}

export async function initDb() {
  await connect();
  await exec(SCHEMA);
  const [{ n }] = await query('SELECT count(*)::int AS n FROM talents');
  if (!n) await seed();
  await applyRosterEdit();
  await ensureCrowdCoverage();
  await reload();
  console.log(`[ATA] database ready (${dbMode()}) — ${db.celebrities.length} public talents`);
}

export async function audit(actor, action, referenceId) {
  await query(
    'INSERT INTO audit_logs (id, actor, action, reference_id) VALUES ($1,$2,$3,$4)',
    [uuid(), actor || 'system', action, referenceId || null],
  );
  emit('AUDIT', { action, referenceId, actor });
}

export async function listAudit(limit = 40) {
  return query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1', [limit]);
}

function publishedCategorySet(rows) {
  return new Set(rows.filter((r) => r.published).map((r) => r.name));
}

export async function listCategories() {
  return query('SELECT * FROM categories ORDER BY sort_order, name');
}

export async function setCategoryPublished(name, published, actor) {
  const rows = await query('UPDATE categories SET published = $2 WHERE name = $1 RETURNING *', [name, !!published]);
  if (!rows.length) throw new HttpError(404, 'Category not found');
  await audit(actor, 'CATEGORY_UPDATED', name);
  await reload();
  return rows[0];
}

export async function getTalent(id, includeHidden = false) {
  const rows = await query('SELECT * FROM talents WHERE id = $1', [id]);
  if (!rows.length) return null;
  const talent = talentFromRow(rows[0]);
  if (!includeHidden && talent.visibility === 'hidden') return null;
  if (!includeHidden) {
    const cats = await listCategories();
    if (!publishedCategorySet(cats).has(talent.category)) return null;
  }
  return talent;
}

export async function listTalentsAdmin() {
  const rows = await query('SELECT * FROM talents ORDER BY name');
  return rows.map(talentFromRow);
}

export async function updateTalent(id, patch, actor) {
  const current = await getTalent(id, true);
  if (!current) throw new HttpError(404, 'Talent not found');
  const visibility = VISIBILITY.includes(patch.visibility) ? patch.visibility : current.visibility;
  const availability = patch.availability || current.availability;
  const startingPrice = patch.startingPrice != null ? Number(patch.startingPrice) : current.startingPrice;
  const category = patch.category || current.category;
  const featured = patch.featured != null ? !!patch.featured : current.featured;
  const featuredOrder = patch.featuredOrder != null && patch.featuredOrder !== '' ? Number(patch.featuredOrder) : current.featuredOrder;
  const portrait = patch.portrait || current.portrait;
  const name = patch.name || current.name;
  const region = patch.region || current.region;
  const profile = {
    ...current,
    name, category, region, availability, visibility, startingPrice, portrait, featured,
    eliteSignal: patch.eliteSignal || current.eliteSignal,
  };
  await query(
    `UPDATE talents SET name=$2, category=$3, region=$4, availability=$5, visibility=$6,
      starting_price=$7, portrait=$8, featured=$9, featured_order=$10, profile=$11::jsonb WHERE id=$1`,
    [id, name, category, region, availability, visibility, startingPrice, portrait, featured, featuredOrder, JSON.stringify(profile)],
  );
  await audit(actor, 'TALENT_UPDATED', id);
  await reload();
  return getTalent(id, true);
}

export async function listExperiences({ talentId, pathway, includeUnpublished = false } = {}) {
  const clauses = [];
  const params = [];
  if (talentId) { params.push(talentId); clauses.push(`talent_id = $${params.length}`); }
  if (pathway) { params.push(pathway); clauses.push(`pathway = $${params.length}`); }
  if (!includeUnpublished) clauses.push('published = true');
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return query(`SELECT * FROM experiences ${where} ORDER BY price_from`, params);
}

export async function upsertExperience(input, actor) {
  const id = input.id || uuid();
  const existing = await query('SELECT id FROM experiences WHERE id = $1', [id]);
  if (!existing.length) {
    if (!input.talentId || !input.pathway || !input.title) throw new HttpError(400, 'Talent, pathway, and title are required');
    await query(
      `INSERT INTO experiences (id, talent_id, pathway, title, summary, location, price_from, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, input.talentId, input.pathway, input.title, input.summary || '', input.location || '', Number(input.priceFrom) || 0, input.published !== false],
    );
  } else {
    await query(
      `UPDATE experiences SET title=$2, summary=$3, location=$4, price_from=$5, published=$6, pathway=$7 WHERE id=$1`,
      [id, input.title, input.summary || '', input.location || '', Number(input.priceFrom) || 0, input.published !== false, input.pathway],
    );
  }
  await audit(actor, 'EXPERIENCE_SAVED', id);
  const rows = await query('SELECT * FROM experiences WHERE id = $1', [id]);
  return rows[0];
}

function crowdShape(row) {
  const includes = parseJson(row.includes, []);
  const available = Math.max(0, row.slots - row.claimed);
  return {
    id: row.id,
    celebId: row.talent_id,
    name: row.talent_name,
    eventTitle: row.title,
    eventType: row.event_type,
    city: row.city,
    date: row.event_date,
    slots: row.slots,
    claimed: row.claimed,
    available,
    soldPct: row.slots ? Math.round((row.claimed / row.slots) * 100) : 0,
    pricePerSlot: row.price_per_slot,
    includes,
    published: row.published,
    installments: [
      { label: '3-Pay Plan', months: 3, monthly: Math.round(row.price_per_slot / 3) },
      { label: '6-Pay Plan', months: 6, monthly: Math.round(row.price_per_slot / 6) },
    ],
  };
}

export async function listCrowd({ includeUnpublished = false } = {}) {
  const rows = await query(
    `SELECT * FROM crowd_events ${includeUnpublished ? '' : 'WHERE published = true'} ORDER BY event_date`,
  );
  return rows.map(crowdShape);
}

export async function getCrowd(id) {
  const rows = await query('SELECT * FROM crowd_events WHERE id = $1', [id]);
  return rows[0] ? crowdShape(rows[0]) : null;
}

export async function upsertCrowd(input, actor) {
  const id = input.id || `ce_${uuid().slice(0, 8)}`;
  const existing = await query('SELECT id FROM crowd_events WHERE id = $1', [id]);
  if (!existing.length) {
    await query(
      `INSERT INTO crowd_events (id, talent_id, talent_name, title, event_type, city, event_date, slots, claimed, price_per_slot, includes, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,$9,$10::jsonb,$11)`,
      [id, input.talentId || null, input.talentName || '', input.title, input.eventType || '', input.city || '', input.date || '', Number(input.slots) || 0, Number(input.pricePerSlot) || 0, JSON.stringify(input.includes || []), input.published !== false],
    );
  } else {
    await query(
      `UPDATE crowd_events SET title=$2, event_type=$3, city=$4, event_date=$5, slots=$6, price_per_slot=$7, published=$8, talent_name=$9 WHERE id=$1`,
      [id, input.title, input.eventType || '', input.city || '', input.date || '', Number(input.slots) || 0, Number(input.pricePerSlot) || 0, input.published !== false, input.talentName || ''],
    );
  }
  await audit(actor, 'CROWD_SAVED', id);
  return getCrowd(id);
}

function budgetCeiling(band) {
  const map = { under250: 250000, mid: 750000, high: 1500000, ultra: Infinity };
  return map[band] ?? null;
}

export async function discover(filters = {}) {
  let people = [...db.celebrities];
  if (filters.category && filters.category !== 'All') people = people.filter((c) => c.category === filters.category);
  if (filters.region && filters.region !== 'All') people = people.filter((c) => c.region === filters.region);
  if (filters.availability && filters.availability !== 'All') people = people.filter((c) => c.availability === filters.availability);
  const ceiling = budgetCeiling(filters.budget);
  if (ceiling) people = people.filter((c) => (c.startingPrice || 0) <= ceiling);
  if (filters.maxPrice) people = people.filter((c) => (c.startingPrice || 0) <= Number(filters.maxPrice));
  if (filters.minPrice) people = people.filter((c) => (c.startingPrice || 0) >= Number(filters.minPrice));
  if (filters.q) people = filterCelebritiesBySearch(people, filters.q);

  const categories = [...new Set(db.celebrities.map((c) => c.category))].sort();
  const cities = [...new Set(db.celebrities.map((c) => c.region).filter(Boolean))].sort();
  let experiences = [];
  if (filters.occasion) {
    const pathway = filters.occasion === 'vacation' ? 'vacation'
      : filters.occasion === 'full_coverage' ? 'full_coverage'
        : filters.occasion === 'crowd' ? null
          : 'private';
    if (pathway) {
      const ids = new Set(people.map((p) => p.id));
      const rows = await listExperiences({ pathway });
      experiences = rows.filter((e) => ids.has(e.talent_id)).slice(0, 8);
    }
  }
  const crowd = (await listCrowd()).filter((e) => e.available > 0).slice(0, 6);
  return {
    people: people.slice(0, 24),
    total: people.length,
    categories,
    cities,
    experiences,
    crowd,
  };
}

export async function counts() {
  const [{ talents }] = await query(`SELECT count(*)::int AS talents FROM talents t JOIN categories c ON c.name = t.category WHERE t.visibility <> 'hidden' AND c.published = true`);
  const [{ open_talents }] = await query(`SELECT count(*)::int AS open_talents FROM talents WHERE visibility = 'public' AND availability = 'Open'`);
  const [{ waitlist }] = await query(`SELECT count(*)::int AS waitlist FROM talents WHERE visibility = 'waitlist'`);
  const [{ crowd }] = await query(`SELECT count(*)::int AS crowd FROM crowd_events WHERE published = true AND claimed < slots`);
  const [{ open_cases }] = await query(`SELECT count(*)::int AS open_cases FROM cases WHERE status IN ('Received','In review','Terms offered')`);
  const [{ confirmed }] = await query(`SELECT count(*)::int AS confirmed FROM cases WHERE status = 'Confirmed'`);
  const [{ pipeline }] = await query(`SELECT coalesce(sum(quote),0)::int AS pipeline FROM cases WHERE status NOT IN ('Declined','Cancelled')`);
  const avgRow = await query(`SELECT coalesce(round(avg(starting_price)),0)::int AS avg FROM talents WHERE visibility <> 'hidden'`);
  return {
    publicTalents: talents,
    openTalents: open_talents,
    waitlistTalents: waitlist,
    openCrowdEvents: crowd,
    openCases: open_cases,
    confirmedCases: confirmed,
    quotedPipeline: pipeline,
    averageOpening: avgRow[0]?.avg || 0,
  };
}

async function quoteFor(talent, pathway, experienceId) {
  if (experienceId) {
    const rows = await query('SELECT * FROM experiences WHERE id = $1 AND published = true', [experienceId]);
    if (rows[0]) return rows[0].price_from;
  }
  if (!talent) return null;
  const rows = await listExperiences({ talentId: talent.id, pathway });
  if (rows[0]) return rows[0].price_from;
  return talent.startingPrice || null;
}

export async function createCase(input, actorUser) {
  const pathway = input.pathway;
  if (!PATHWAYS.includes(pathway)) throw new HttpError(400, 'Choose a booking pathway');
  const clientName = String(input.clientName || actorUser?.name || '').trim();
  const clientEmail = String(input.clientEmail || actorUser?.email || '').trim().toLowerCase();
  if (!clientName || !clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    throw new HttpError(400, 'A name and valid email are required');
  }
  const needsTalent = !['match', 'unlisted'].includes(pathway);
  let talent = null;
  let crowd = null;
  if (pathway === 'crowd') {
    const eventId = Array.isArray(input.eventId) ? input.eventId[0] : input.eventId;
    crowd = await getCrowd(eventId);
    if (!crowd || crowd.published === false) throw new HttpError(404, 'Crowd event not found');
    if (crowd.available < 1) throw new HttpError(409, 'This event is fully claimed');
    input.talentId = input.talentId || crowd.celebId || null;
  }
  if (input.talentId) {
    talent = await getTalent(input.talentId, true);
    if (!talent || talent.visibility === 'hidden') throw new HttpError(404, 'Talent is not available');
    const cats = await listCategories();
    if (!publishedCategorySet(cats).has(talent.category)) throw new HttpError(404, 'Talent is not available');
  } else if (needsTalent && pathway !== 'crowd') {
    throw new HttpError(400, 'Choose a talent');
  }
  if (talent?.visibility === 'waitlist' && pathway !== 'reservation' && pathway !== 'crowd') {
    throw new HttpError(409, 'This talent is on the waitlist. Submit a reservation request.');
  }

  if (pathway === 'crowd') {
    const updated = await query(
      'UPDATE crowd_events SET claimed = claimed + 1 WHERE id = $1 AND claimed < slots RETURNING id',
      [crowd.id],
    );
    if (!updated.length) throw new HttpError(409, 'This event is fully claimed');
  }

  const quote = pathway === 'crowd' ? crowd.pricePerSlot : await quoteFor(talent, pathway, input.experienceId);
  const id = uuid();
  const slotCode = pathway === 'crowd' ? `CROWD-${String(crowd.id).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}` : null;
  const details = {
    contractId: `ATA-${Math.floor(100000 + Math.random() * 900000)}`,
    experienceId: input.experienceId || null,
    eventId: crowd?.id || null,
    slotCode,
    settlementNote: String(input.settlementNote || '').slice(0, 500),
    securityLevel: String(input.securityLevel || '').slice(0, 80),
    rider: String(input.rider || input.message || '').slice(0, 2000),
    occasion: String(input.occasion || input.eventType || '').slice(0, 80),
    organization: String(input.organization || '').slice(0, 160),
    alternateDate: String(input.alternateDate || '').slice(0, 40),
    arrival: String(input.arrival || '').slice(0, 40),
    departure: String(input.departure || '').slice(0, 40),
    partySize: String(input.partySize || '').slice(0, 20),
    coverage: Array.isArray(input.coverage) ? input.coverage.map((item) => String(item).slice(0, 40)).slice(0, 8) : [],
    experienceTitle: String(input.experienceTitle || '').slice(0, 160),
  };
  await query(
    `INSERT INTO cases
      (id, pathway, status, user_id, client_name, client_email, talent_id, talent_name, event_type, event_date, location, budget_band, quote, details)
     VALUES ($1,$2,'Received',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)`,
    [
      id, pathway, actorUser?.id || null, clientName, clientEmail,
      talent?.id || null, talent?.name || input.talentName || null,
      input.eventType || crowd?.eventTitle || pathway,
      input.date || crowd?.date || null,
      input.location || crowd?.city || null,
      input.budgetBand || null,
      quote,
      JSON.stringify(details),
    ],
  );
  await query(
    'INSERT INTO case_events (id, case_id, status, actor, note) VALUES ($1,$2,$3,$4,$5)',
    [uuid(), id, 'Received', actorUser?.email || clientEmail, 'Case opened from the public site'],
  );
  await audit(actorUser?.email || clientEmail, 'CASE_OPENED', id);
  await reload();
  const created = (await query('SELECT * FROM cases WHERE id = $1', [id]))[0];
  const booking = caseToBooking(created);
  emit('CASE_OPENED', { id, pathway, talent: booking.celebrityName });
  return booking;
}

export async function listCases({ userId, email } = {}) {
  if (userId || email) {
    const rows = await query(
      `SELECT * FROM cases WHERE user_id = $1 OR lower(client_email) = lower($2) ORDER BY created_at DESC`,
      [userId || '', email || ''],
    );
    return rows.map(caseToBooking);
  }
  const rows = await query('SELECT * FROM cases ORDER BY created_at DESC');
  return rows.map(caseToBooking);
}

export async function updateCaseStatus(id, status, actor) {
  if (!STATUSES.includes(status)) throw new HttpError(400, 'Invalid status');
  const rows = await query(
    `UPDATE cases SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, status],
  );
  if (!rows.length) throw new HttpError(404, 'Case not found');
  await query(
    'INSERT INTO case_events (id, case_id, status, actor) VALUES ($1,$2,$3,$4)',
    [uuid(), id, status, actor || 'admin'],
  );
  await audit(actor, 'CASE_STATUS', id);
  await reload();
  emit('CASE_STATUS', { id, status, actor });
  return caseToBooking(rows[0]);
}

export async function cancelCase(id, actor) {
  return updateCaseStatus(id, 'Cancelled', actor);
}

export async function getShortlist(userId) {
  const rows = await query('SELECT talent_ids FROM shortlists WHERE user_id = $1', [userId]);
  return parseJson(rows[0]?.talent_ids, []);
}

export async function setShortlist(userId, ids) {
  const clean = (ids || []).slice(0, 5);
  await query(
    `INSERT INTO shortlists (user_id, talent_ids) VALUES ($1, $2::jsonb)
     ON CONFLICT (user_id) DO UPDATE SET talent_ids = EXCLUDED.talent_ids`,
    [userId, JSON.stringify(clean)],
  );
  return clean;
}

export async function addMessage(entry) {
  await query(
    'INSERT INTO messages (id, from_name, to_user_id, body) VALUES ($1,$2,$3,$4)',
    [entry.id, entry.from, entry.toUserId, entry.body],
  );
  await reload();
}

export async function getContent(key) {
  const rows = await query('SELECT value FROM content_blocks WHERE key = $1', [key]);
  return parseJson(rows[0]?.value, null);
}

export async function setContent(key, value, actor) {
  await query(
    `INSERT INTO content_blocks (key, value) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, JSON.stringify(value)],
  );
  await audit(actor, 'CONTENT_UPDATED', key);
  return value;
}

export async function featuredTalents() {
  const rows = await query(
    `SELECT * FROM talents WHERE featured = true AND visibility <> 'hidden' ORDER BY featured_order NULLS LAST, name LIMIT 8`,
  );
  if (rows.length) return rows.map(talentFromRow);
  return db.celebrities.slice(0, 6);
}

export function writeSitemap(talents) {
  const file = path.join(__dirname, '..', '..', 'website', 'sitemap.xml');
  if (!fs.existsSync(path.dirname(file))) return;
  const urls = [
    'https://alltalentsagency.com/',
    'https://alltalentsagency.com/explorer.html',
    'https://alltalentsagency.com/crowdbooking.html',
    'https://alltalentsagency.com/talent.html',
    ...talents.filter((t) => t.visibility !== 'hidden').map((t) => `https://alltalentsagency.com/talent.html?id=${t.id}`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((loc) => `  <url><loc>${loc}</loc></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(file, xml);
}
