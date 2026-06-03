import 'dotenv/config';
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { db, CROWD_EVENTS, inquiries } from "./data.js";
import { loadStore, mergePersisted, snapshotDb } from "./persist.js";

const userShortlists = mergePersisted(db, loadStore());

const app = express();
const PORT = process.env.PORT || 4100;
const JWT_SECRET = process.env.JWT_SECRET || "xK9#mP2$vL7nQ4@rT8wY1&zA3eFhJcBu";

app.disable("x-powered-by");
app.use((_req, res, next) => { res.setHeader("Server", "ATA/2.1"); next(); });

const ALLOWED_ORIGINS = [
  'http://localhost:5600',
  'http://127.0.0.1:5600',
  /^https:\/\/.*\.vercel\.app$/,
  'https://alltalentsagency.com',
  'https://www.alltalentsagency.com',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // server-to-server / curl
    const ok = ALLOWED_ORIGINS.some(o => typeof o === 'string' ? origin.startsWith(o) : o.test(origin));
    if (ok) return cb(null, true);
    return cb(null, false); // silently reject — don't reveal the list
  },
  credentials: true,
}));
app.use(express.json({ limit: "100kb" }));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});

const BLOCKED_PATTERN = /(https?:\/\/|javascript:|vbscript:|data:text\/html|<script|<iframe|onerror\s*=|onload\s*=)/i;

const isUnsafeInput = (value) => BLOCKED_PATTERN.test(String(value || ""));

const sanitizeText = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .trim();

const rejectUnsafeFields = (res, fields) => {
  if (fields.some((field) => isUnsafeInput(field))) {
    res.status(400).json({ error: "Unsafe link or script content detected" });
    return true;
  }
  return false;
};

const isValidCelebrityId = (id) => /^c\d+$/i.test(String(id || ""));

const auth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: "Invalid token" });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "All Talents Agency API" }));

const LEGACY_EMAIL_ALIASES = {
  "client@aurelux.com": "client@alltalents.agency",
  "manager@aurelux.com": "manager@alltalents.agency",
  "admin@aurelux.com": "admin@alltalents.agency",
};

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const normalized = String(email || "").toLowerCase();
  const resolved = LEGACY_EMAIL_ALIASES[normalized] || normalized;
  const user = db.users.find((u) => u.email.toLowerCase() === resolved);
  if (!user || !bcrypt.compareSync(password || "", user.passwordHash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get("/api/celebrities", (req, res) => {
  let data = [...db.celebrities];
  const q = req.query || {};
  if (q.search) data = data.filter((c) => c.name.toLowerCase().includes(String(q.search).toLowerCase()));
  if (q.category && q.category !== "All") data = data.filter((c) => c.category === q.category);
  if (q.region && q.region !== "All") data = data.filter((c) => c.region === q.region);
  if (q.availability && q.availability !== "All") data = data.filter((c) => c.availability === q.availability);
  if (q.minPrice) data = data.filter((c) => c.startingPrice >= Number(q.minPrice));
  if (q.maxPrice) data = data.filter((c) => c.startingPrice <= Number(q.maxPrice));
  return res.json({ total: data.length, data });
});

app.get("/api/celebrities/featured", (_req, res) => {
  res.json({
    data: db.celebrities.slice(0, 6),
    metrics: {
      totalGlobalBookings: 18427,
      managedPortfolioValue: 218500000000,
      activeNegotiations: 347,
      verifiedCelebrities: db.celebrities.length,
    },
  });
});

app.get("/api/portfolio/summary", auth, (_req, res) => {
  // Calibrated to real-world agency revenue distribution for a $57.2B YTD portfolio
  const CATEGORY_WEIGHTS = {
    Film:       { share: 0.31, avgDeal: 8_200_000 },
    Music:      { share: 0.29, avgDeal: 9_500_000 },
    Sports:     { share: 0.20, avgDeal: 7_100_000 },
    Business:   { share: 0.09, avgDeal: 14_200_000 },
    Fashion:    { share: 0.06, avgDeal: 3_800_000 },
    Influencer: { share: 0.05, avgDeal: 2_400_000 },
  };
  const YTD = 57_200_000_000;
  const cats = Object.keys(CATEGORY_WEIGHTS);
  const categoryBreakdown = cats.map((cat) => {
    const group = db.celebrities.filter((c) => c.category === cat);
    const w = CATEGORY_WEIGHTS[cat];
    const annualVolume = Math.round(YTD * w.share);
    return {
      category: cat,
      celebs: group.length,
      avgDealSize: w.avgDeal,
      annualVolume,
      shareOfPortfolio: Math.round(w.share * 100),
    };
  });

  return res.json({
    agencyName: "All Talents Agency",
    totalManagedPortfolio: 218_500_000_000,
    ytdRevenue: YTD,
    prevYearRevenue: 47_350_000_000,
    yoyGrowth: 20.8,
    activeContracts: db.bookings.length + 347,
    escrowHeld: Math.round(db.bookings.reduce((s, b) => s + b.pricing.escrow, 0) + 7_840_000_000),
    totalRoster: db.celebrities.length,
    avgDealSize: 3_100_000,
    portfolioYield: 12.4,
    categoryBreakdown,
    revenueTimeline: [
      { year: 2018, revenue: 8_200_000_000 },
      { year: 2019, revenue: 12_700_000_000 },
      { year: 2020, revenue: 9_400_000_000 },
      { year: 2021, revenue: 18_900_000_000 },
      { year: 2022, revenue: 26_450_000_000 },
      { year: 2023, revenue: 38_200_000_000 },
      { year: 2024, revenue: 47_350_000_000 },
      { year: 2025, revenue: 57_200_000_000 },
    ],
    topEarners: db.celebrities.slice(0, 6).map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      region: c.region,
      annualRevenue: c.startingPrice * 12,
    })),
  });
});

function scoreRelated(target, c) {
  let score = 0;
  if (c.category === target.category) score += 40;
  if (c.region === target.region) score += 20;
  const price = target.startingPrice || 0;
  const p = c.startingPrice || 0;
  if (price && Math.abs(p - price) / price <= 0.3) score += 25;
  score += (c.demandIndex || 0) * 0.15;
  return score;
}

app.get("/api/celebrities/:id/related", (req, res) => {
  if (!isValidCelebrityId(req.params.id)) return res.status(400).json({ error: "Invalid celebrity id" });
  const target = db.celebrities.find((x) => x.id === req.params.id);
  if (!target) return res.status(404).json({ error: "Celebrity not found" });
  const limit = Math.min(12, Math.max(1, Number(req.query.limit) || 8));
  const data = db.celebrities
    .filter((c) => c.id !== target.id)
    .map((c) => ({ c, score: scoreRelated(target, c) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);
  return res.json({ targetId: target.id, data });
});

app.get("/api/celebrities/:id", (req, res) => {
  const c = db.celebrities.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Celebrity not found" });
  return res.json(c);
});

app.get("/api/celebrities/:id/availability", (req, res) => {
  const c = db.celebrities.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Celebrity not found" });
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: "date query required" });
  const target = new Date(String(date));
  if (Number.isNaN(target.getTime())) return res.status(400).json({ error: "Invalid date" });
  const now = new Date();
  const days = Math.ceil((target.getTime() - now.getTime()) / 86400000);
  const available = days >= 0 && days <= c.availabilityWindowDays && c.availability !== "Waitlist";
  return res.json({ celebrityId: c.id, celebrityName: c.name, date, available, reason: available ? "Available" : "Unavailable for selected date" });
});

app.get("/api/intelligence/market-pulse", (_req, res) => {
  const sorted = [...db.celebrities].sort((a, b) => b.demandIndex - a.demandIndex);
  const top = sorted.slice(0, 5).map((c) => ({
    id: c.id,
    name: c.name,
    demandIndex: c.demandIndex,
    category: c.category,
    region: c.region,
  }));

  const avgDemand = Math.round(db.celebrities.reduce((sum, c) => sum + c.demandIndex, 0) / db.celebrities.length);
  const avgPrice = Math.round(db.celebrities.reduce((sum, c) => sum + c.startingPrice, 0) / db.celebrities.length);

  return res.json({
    timestamp: new Date().toISOString(),
    metrics: {
      demandHeat: avgDemand,
      averageEntryQuote: avgPrice,
      activeRoster: db.celebrities.length,
      topWaitlistPressure: sorted.filter((c) => c.availability === "Waitlist").length,
    },
    top,
  });
});

app.post("/api/intelligence/blueprint", auth, (req, res) => {
  const {
    celebrityId,
    objective = "Brand Elevation",
    audienceType = "Executive Guests",
    region = "Global",
    budget = 250000,
    timelineDays = 30,
  } = req.body || {};

  if (rejectUnsafeFields(res, [celebrityId, objective, audienceType, region, budget, timelineDays])) return;
  if (!isValidCelebrityId(celebrityId)) return res.status(400).json({ error: "Invalid celebrity id format" });

  const c = db.celebrities.find((x) => x.id === celebrityId);
  if (!c) return res.status(404).json({ error: "Celebrity not found" });

  const budgetNum = Number(budget) || 0;
  const timelineNum = Number(timelineDays) || 30;
  const pressureScore = Math.max(1, Math.min(100, Math.round((c.demandIndex * 0.55) + (timelineNum < 14 ? 30 : 10))));
  const fitScore = Math.max(1, Math.min(100, Math.round((c.popularityScore * 0.6) + (c.riskIndex === "low" ? 28 : c.riskIndex === "medium" ? 18 : 10))));
  const budgetAlignment = Math.max(1, Math.min(100, Math.round((budgetNum / c.startingPrice) * 65)));

  const recommendation = budgetNum < c.startingPrice
    ? "Budget below entry threshold. Consider phased campaign with virtual appearance tier."
    : timelineNum <= 10
      ? "High urgency path recommended: activate executive security and rapid contract lane."
      : "Standard premium path recommended with full compliance and media-control layers.";

  return res.json({
    blueprintId: `BLP-${Math.floor(Math.random() * 900000 + 100000)}`,
    celebrity: { id: c.id, name: c.name },
    strategy: {
      objective: sanitizeText(objective),
      audienceType: sanitizeText(audienceType),
      region: sanitizeText(region),
      timelineDays: timelineNum,
      recommendation,
    },
    scores: {
      fitScore,
      pressureScore,
      budgetAlignment,
      exclusivityIndex: Math.round((fitScore * 0.45) + (pressureScore * 0.35) + (budgetAlignment * 0.2)),
    },
    executionPlan: [
      "Representation pre-qualification call",
      "NDA and legal route confirmation",
      "Security and logistics approval",
      "Commercial finalization and escrow readiness",
    ],
  });
});

app.get("/api/intelligence/pressure/:id", (req, res) => {
  if (!isValidCelebrityId(req.params.id)) return res.status(400).json({ error: "Invalid celebrity id format" });
  const c = db.celebrities.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Celebrity not found" });

  const idx = parseInt(req.params.id.replace(/\D/g, "")) - 1;
  const viewers = 2 + ((idx * 7 + Date.now() % 11) % 9);
  const minutesAgo = 3 + ((idx * 3 + Date.now() % 7) % 54);
  const slotsLeft = c.availability === "Open" ? (4 + (idx % 5)) : c.availability === "Limited" ? (1 + (idx % 2)) : 0;
  const heatLevel = slotsLeft === 0 ? "critical" : slotsLeft <= 2 ? "high" : viewers >= 8 ? "elevated" : "normal";

  return res.json({
    id: c.id,
    viewers,
    lastInquiryMinutesAgo: minutesAgo,
    slotsLeft,
    heatLevel,
    urgencyMessage: heatLevel === "critical"
      ? "Waitlist only — all availability consumed."
      : heatLevel === "high"
      ? `Only ${slotsLeft} window${slotsLeft === 1 ? "" : "s"} remaining. Act before closing.`
      : heatLevel === "elevated"
      ? `${viewers} clients screening this profile right now.`
      : "Opportunity window is accessible.",
  });
});

app.get("/api/portal/standing", auth, (req, res) => {
  const userId = req.user.id;
  const myBookings = db.bookings.filter((b) => b.userId === userId).length;
  const myMessages = db.messages.filter((m) => m.toUserId === userId).length;
  const roleBonus = req.user.role === "admin" ? 30 : req.user.role === "manager" ? 20 : 0;
  const rawScore = Math.min(99, 42 + (myBookings * 14) + (myMessages * 3) + roleBonus);
  const tier = rawScore >= 85 ? "Sovereign" : rawScore >= 70 ? "Black Card" : rawScore >= 55 ? "Elite" : "Qualified";
  const privileges = tier === "Sovereign"
    ? ["Priority slot access", "Dedicated relationship manager", "Direct rep hotline", "Confidential briefing room", "First-look new roster additions"]
    : tier === "Black Card"
    ? ["Early window access", "Senior manager assignment", "Priority message routing", "Quarterly strategy brief"]
    : tier === "Elite"
    ? ["Standard window access", "Dedicated support queue", "Monthly talent updates"]
    : ["Standard inquiry access", "Queue-based support"];

  return res.json({
    clientName: req.user.name,
    score: rawScore,
    tier,
    breakdown: { baseScore: 42, bookingContribution: myBookings * 14, messageContribution: myMessages * 3, roleBonus },
    privileges,
    nextTierThreshold: tier === "Sovereign" ? null : tier === "Black Card" ? 85 : tier === "Elite" ? 70 : 55,
    nextTier: tier === "Sovereign" ? null : tier === "Black Card" ? "Sovereign" : tier === "Elite" ? "Black Card" : "Elite",
  });
});

app.post("/api/waitlist/reserve", auth, (req, res) => {
  const { celebrityId } = req.body || {};
  if (!isValidCelebrityId(celebrityId)) return res.status(400).json({ error: "Invalid celebrity id format" });
  const c = db.celebrities.find((x) => x.id === celebrityId);
  if (!c) return res.status(404).json({ error: "Celebrity not found" });
  const reservationCode = `WL-${String(req.user.id).toUpperCase()}-${Math.floor(Math.random() * 900000 + 100000)}`;
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  return res.status(201).json({
    reservationCode,
    celebrity: { id: c.id, name: c.name },
    clientName: req.user.name,
    expiresAt,
    message: `Your waitlist position for ${c.name} is reserved. A representative will contact you within 48 hours of slot availability. Your code: ${reservationCode}.`,
    terms: "Reservation is non-transferable and expires in 48 hours if not converted to a booking inquiry.",
  });
});

app.get("/api/intelligence/ticker", (_req, res) => {
  const types = ["Demand Surge", "Waitlist Entered", "New Inquiry", "Availability Opening", "Price Adjustment", "Rep Confirmation"];
  const positiveMap = [true, true, true, false, true, true];
  const events = db.celebrities.slice(0, 22).map((c, i) => {
    const delta = 2 + ((i * 3 + 7) % 19);
    const positive = positiveMap[i % positiveMap.length];
    return {
      id: c.id,
      name: c.name,
      event: types[i % types.length],
      change: `${positive ? "+" : "-"}${delta}%`,
      positive,
    };
  });
  return res.json({ events, timestamp: new Date().toISOString() });
});

app.get("/api/celebrities/:id/dossier", (req, res) => {
  if (!isValidCelebrityId(req.params.id)) return res.status(400).json({ error: "Invalid celebrity id format" });
  const c = db.celebrities.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Celebrity not found" });

  const mediaScore = Math.min(99, Math.round((c.socialReachMillions / 280) * 100) + 15);
  const leverageMap = {
    low: "High — Minimal friction, broad campaign compatibility",
    medium: "Moderate — Strategic alignment required before proposal",
    high: "Controlled — Executive-only pathway, strict vetting mandatory",
  };
  const venueOptions = ["Private Estate Gala", "Flagship Brand Summit", "Sovereign Corporate Forum", "Exclusive Cultural Ceremony", "Invitation-Only Media Event"];
  const idx = parseInt(c.id.replace(/\D/g, "")) - 1;

  return res.json({
    celebrity: { id: c.id, name: c.name, category: c.category, region: c.region, portrait: c.portrait },
    dossier: {
      classificationLevel: "PRIVATE — CLIENT EYES ONLY",
      mediaAuthorityScore: mediaScore,
      negotiationLeverage: leverageMap[c.riskIndex] || leverageMap.medium,
      recommendedVenue: venueOptions[idx % venueOptions.length],
      talkingPoints: [
        `Represented exclusively by ${c.agencyRepresentation}. All commercial contact must route through authorized channels.`,
        `Commercial entry threshold: $${c.startingPrice.toLocaleString()}. Security default: ${c.securityTiers.slice(-1)[0]}.`,
        `Demand index: ${c.demandIndex}% — ${c.demandIndex > 75 ? "Extreme booking pressure, immediate action advised" : c.demandIndex > 55 ? "High demand — windows closing rapidly" : "Moderate demand — opportunity window currently open"}.`,
        `Availability: ${c.availability === "Open" ? "Currently accepting qualified outreach" : c.availability === "Limited" ? "Limited windows — act within 48 hours of inquiry" : "Waitlist active — join queue for next opening"}.`,
      ],
      riskBrief: c.riskIndex === "low"
        ? "CLEAR — No reputational exposure. Suitable for flagship public campaigns and media-facing events."
        : c.riskIndex === "medium"
        ? "MANAGED — NDA activation required. Coordinate all media placement through representation desk."
        : "ELEVATED — Executive security protocols required. Full media blackout and thorough vetting enforced.",
      ndaStatus: c.ndaDefault
        ? "MANDATORY — NDA is required for all engagements without exception."
        : "ADVISORY — NDA strongly recommended depending on event exposure level.",
      optimalLeadTime: c.availability === "Open" ? "14–21 days via standard pathway" : "30–60 days — limited access windows",
    },
  });
});

app.post("/api/intelligence/compare", (req, res) => {
  const { celebrityIds = [] } = req.body || {};
  if (!Array.isArray(celebrityIds)) return res.status(400).json({ error: "celebrityIds must be an array" });
  const uniqueIds = Array.from(new Set(celebrityIds)).slice(0, 5);
  if (rejectUnsafeFields(res, uniqueIds)) return;
  if (uniqueIds.some((id) => !/^c\d+$/i.test(String(id)))) {
    return res.status(400).json({ error: "Invalid celebrity id format" });
  }
  if (!uniqueIds.length) return res.status(400).json({ error: "celebrityIds required" });

  const compared = uniqueIds
    .map((id) => db.celebrities.find((c) => c.id === id))
    .filter(Boolean)
    .map((c) => {
      const valueScore = Math.round((c.popularityScore * 0.4) + ((100 - Math.min(100, c.startingPrice / 20000)) * 0.2) + ((c.riskIndex === "low" ? 90 : c.riskIndex === "medium" ? 65 : 40) * 0.4));
      return {
        id: c.id,
        name: c.name,
        startingPrice: c.startingPrice,
        demandIndex: c.demandIndex,
        availability: c.availability,
        riskIndex: c.riskIndex,
        valueScore,
      };
    })
    .sort((a, b) => b.valueScore - a.valueScore);

  if (!compared.length) return res.status(404).json({ error: "No valid celebrities found" });

  return res.json({
    compared,
    recommendation: {
      winner: compared[0],
      rationale: `${compared[0].name} currently provides the best value-to-risk profile with strong demand support.`,
    },
  });
});

app.post("/api/messages/send", auth, (req, res) => {
  const { celebrityId, body, priority = "Priority" } = req.body || {};
  if (rejectUnsafeFields(res, [celebrityId, body, priority])) return;
  if (!isValidCelebrityId(celebrityId)) return res.status(400).json({ error: "Invalid celebrity id format" });
  const c = db.celebrities.find((x) => x.id === celebrityId);
  if (!c) return res.status(404).json({ error: "Celebrity not found" });
  const ack = {
    id: uuid(),
    from: "Representation Desk",
    toUserId: req.user.id,
    body: `Message received for ${c.name}. Priority: ${priority}.`,
    timestamp: new Date().toISOString(),
  };
  db.messages.push(
    {
      id: uuid(),
      from: sanitizeText(req.user.name),
      toUserId: "u2",
      body: sanitizeText(body),
      timestamp: new Date().toISOString(),
    },
    {
      ...ack,
      body: sanitizeText(ack.body),
    }
  );
  snapshotDb(db, userShortlists);
  return res.status(201).json({ ok: true, acknowledgement: ack });
});

const VALID_PAYMENT_METHODS = ["wire", "btc", "eth", "usdt", "bnb", "sol", "xrp"];

app.post("/api/bookings/initiate", auth, (req, res) => {
  const { celebrityId, eventType, date, location, ndaRequired, securityLevel, riderRequirements, pricingAdjustmentPercent = 0, paymentMethod = "wire", cryptoCurrency } = req.body || {};
  if (rejectUnsafeFields(res, [celebrityId, eventType, date, location, securityLevel, riderRequirements])) return;
  if (!isValidCelebrityId(celebrityId)) return res.status(400).json({ error: "Invalid celebrity id format" });
  const c = db.celebrities.find((x) => x.id === celebrityId);
  if (!c) return res.status(404).json({ error: "Celebrity not found" });
  const finalQuote = Math.round(c.startingPrice * (1 + Number(pricingAdjustmentPercent) / 100));
  const safePayMethod = VALID_PAYMENT_METHODS.includes(String(paymentMethod).toLowerCase()) ? String(paymentMethod).toLowerCase() : "wire";
  const booking = {
    id: uuid(),
    userId: req.user.id,
    celebrityId,
    celebrityName: c.name,
    eventType: sanitizeText(eventType),
    date: sanitizeText(date),
    location: sanitizeText(location),
    ndaRequired: !!ndaRequired,
    securityLevel: sanitizeText(securityLevel),
    riderRequirements: sanitizeText(riderRequirements),
    contractId: `CTR-${Math.floor(Math.random() * 900000 + 100000)}`,
    status: "Inquiry Received",
    paymentMethod: safePayMethod,
    cryptoCurrency: safePayMethod !== "wire" ? safePayMethod.toUpperCase() : null,
    pricing: { finalQuote, escrow: Math.round(finalQuote * 0.3), escrowPercent: 30 },
  };
  db.bookings.push(booking);
  snapshotDb(db, userShortlists);
  return res.status(201).json({ booking });
});

app.get("/api/shortlist", auth, (req, res) => {
  const ids = userShortlists[req.user.id] || [];
  return res.json({ ids });
});

app.post("/api/shortlist", auth, (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ error: "ids array required" });
  userShortlists[req.user.id] = ids.filter((id) => isValidCelebrityId(id)).slice(0, 5);
  snapshotDb(db, userShortlists);
  return res.json({ ids: userShortlists[req.user.id] });
});

app.post("/api/events", (req, res) => {
  const { name, detail } = req.body || {};
  if (name) console.log(`[ATA event] ${name}`, detail || "");
  return res.json({ ok: true });
});

app.get("/api/portal/overview", auth, (req, res) => {
  const bookings = db.bookings.filter((b) => b.userId === req.user.id);
  const messages = db.messages.filter((m) => m.toUserId === req.user.id);
  const crowdSlots = db.crowdBookings.filter((b) => b.userId === req.user.id);
  return res.json({
    membershipTier: req.user.role === "admin" ? "Founders Office" : "Black Card",
    bookings,
    crowdSlots,
    contracts: bookings.map((b) => ({ id: b.contractId, title: `${b.celebrityName} Sovereign Contract`, signed: false })),
    payments: [
      ...bookings.map((b) => ({ bookingId: b.id, amount: b.pricing.escrow, status: "Pending Escrow", type: "private" })),
      ...crowdSlots.map((b) => ({ bookingId: b.id, amount: b.nextPayment, status: b.paymentStatus, type: "crowd" })),
    ],
    messages,
  });
});

// ── CROWD BOOKING ENDPOINTS ───────────────────────────────────────────────────
app.get("/api/crowd-events", (_req, res) => {
  const live = CROWD_EVENTS.map(ev => {
    const celeb = db.celebrities.find(c => c.id === ev.celebId);
    const saved = db.crowdBookings.filter(b => b.eventId === ev.id);
    const claimed = ev.claimed + saved.length;
    return { ...ev, claimed, available: ev.slots - claimed, soldPct: Math.round((claimed / ev.slots) * 100), category: celeb?.category || "Other" };
  });
  return res.json({ total: live.length, data: live });
});

app.get("/api/crowd-events/:id", (req, res) => {
  const ev = CROWD_EVENTS.find(e => e.id === req.params.id);
  if (!ev) return res.status(404).json({ error: "Event not found" });
  const saved = db.crowdBookings.filter(b => b.eventId === ev.id);
  const claimed = ev.claimed + saved.length;
  return res.json({ ...ev, claimed, available: ev.slots - claimed, soldPct: Math.round((claimed / ev.slots) * 100) });
});

app.post("/api/crowd-events/:id/join", auth, (req, res) => {
  const ev = CROWD_EVENTS.find(e => e.id === req.params.id);
  if (!ev) return res.status(404).json({ error: "Event not found" });
  const alreadyClaimed = ev.claimed + db.crowdBookings.filter(b => b.eventId === ev.id).length;
  if (alreadyClaimed >= ev.slots) return res.status(409).json({ error: "Event fully claimed" });
  const { plan = "full", paymentMethod = "wire" } = req.body || {};
  const safePayMethod = VALID_PAYMENT_METHODS.includes(String(paymentMethod).toLowerCase()) ? String(paymentMethod).toLowerCase() : "wire";
  const chosen = plan !== "full" ? ev.installments.find(i => i.label.toLowerCase().includes(plan.replace("-", " "))) : null;
  const nextPayment = chosen ? chosen.monthly : ev.pricePerSlot;
  const totalMonths  = chosen ? chosen.months : 1;
  const booking = {
    id:           uuid(),
    userId:       req.user.id,
    userName:     req.user.name,
    eventId:      ev.id,
    eventTitle:   ev.eventTitle,
    celebName:    ev.name,
    celebId:      ev.celebId,
    eventType:    ev.eventType,
    city:         ev.city,
    date:         ev.date,
    totalPrice:   ev.pricePerSlot,
    plan:         plan,
    totalMonths,
    nextPayment,
    paidMonths:   0,
    paymentStatus:"Awaiting First Payment",
    slotCode:     `CROWD-${ev.id.toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
    paymentMethod: safePayMethod,
    cryptoCurrency: safePayMethod !== "wire" ? safePayMethod.toUpperCase() : null,
    bookedAt:     new Date().toISOString(),
  };
  db.crowdBookings.push(booking);
  snapshotDb(db, userShortlists);
  return res.status(201).json({ booking, message: `Slot secured for ${ev.eventTitle}. ${totalMonths === 1 ? "Full payment of $" + ev.pricePerSlot.toLocaleString() : "First installment of $" + nextPayment.toLocaleString() + "/mo due now."} NDA and escrow terms apply.` });
});

// ── Celebrity Inquiry (no auth required — public form) ──────────────────────
app.post("/api/inquiry", (req, res) => {
  const { name, email, celebrity, eventType, date, message } = req.body || {};
  if (!name || !email || !celebrity) {
    return res.status(400).json({ error: "Name, email and celebrity name are required." });
  }
  const entry = {
    id: `inq_${Date.now()}`,
    name: String(name).slice(0, 120),
    email: String(email).slice(0, 120),
    celebrity: String(celebrity).slice(0, 120),
    eventType: String(eventType || '').slice(0, 80),
    date: String(date || '').slice(0, 20),
    message: String(message || '').slice(0, 2000),
    submittedAt: new Date().toISOString(),
    status: "pending",
  };
  inquiries.push(entry);
  console.log(`[ATA] Celebrity inquiry received — ${entry.celebrity} (from: ${entry.email})`);
  res.json({
    success: true,
    id: entry.id,
    message: `Your inquiry for ${entry.celebrity} has been received. Our concierge team will respond within 48 hours under full NDA.`,
  });
});

// Global error handler — never expose stack traces to clients
app.use((err, _req, res, _next) => {
  console.error('[ATA API Error]', err.message);
  res.status(500).json({ error: "An unexpected error occurred. Please try again." });
});

// In development run standalone; in Vercel export the handler
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[ATA] Services API online — port ${PORT}`);
  });
}

export default app;
