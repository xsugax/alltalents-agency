/** API parity with website smart roster search */
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

export function filterCelebritiesBySearch(data, search, minScore = 26) {
  const q = String(search || '').trim();
  if (!q) return data;
  return data
    .map(celeb => ({ celeb, score: scoreCelebrityMatch(celeb, q) }))
    .filter(x => x.score >= minScore)
    .sort((a, b) => b.score - a.score || a.celeb.name.localeCompare(b.celeb.name))
    .map(x => x.celeb);
}
