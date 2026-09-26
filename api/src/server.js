import 'dotenv/config';
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { db, initDb, discover, createCase, listCases, getShortlist, setShortlist, addMessage, listCrowd, getCrowd, counts, featuredTalents, getContent, writeSitemap, listTalentsAdmin, HttpError, onAdminEvent } from "./store.js";
import { filterCelebritiesBySearch } from "./celebrity-search.js";
import { getMeetingPlaybookForCelebrity } from "./meeting-playbooks.js";
import adminRouter, { emitAdminEvent } from "./admin-routes.js";

const app = express();
const PORT = process.env.PORT || 4100;
const DEV_JWT = "dev-only-ata-jwt-secret-not-for-production";
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : DEV_JWT);
if (!JWT_SECRET || JWT_SECRET.length < 24) {
  console.error("[ATA] JWT_SECRET is required in production (24+ characters).");
  process.exit(1);
}
if (JWT_SECRET === DEV_JWT) {
  console.warn("[ATA] using development JWT secret. Set JWT_SECRET before deploy.");
}

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

const hits = new Map();
const rateLimit = (req, res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || "local";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  if (recent.length >= 30) return res.status(429).json({ error: "Too many requests. Wait a minute and try again." });
  recent.push(now);
  hits.set(ip, recent);
  next();
};

const auth = (req, res, next) => {
  const header = req.headers.authorization || "";
  let token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token && String(req.path || "").endsWith("/events") && req.query?.token) token = String(req.query.token);
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.users.find((u) => u.id === payload.sub);
    if (!user || user.suspended) return res.status(401).json({ error: "Invalid token" });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const optionalAuth = (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = db.users.find((u) => u.id === payload.sub) || null;
  } catch { req.user = null; }
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
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

app.get("/api/auth/me", auth, (req, res) => {
  const { passwordHash, ...safe } = req.user;
  return res.json({ user: safe });
});

app.get("/api/celebrities", (req, res) => {
  let data = [...db.celebrities];
  const q = req.query || {};
  if (q.search) data = filterCelebritiesBySearch(data, q.search);
  if (q.category && q.category !== "All") data = data.filter((c) => c.category === q.category);
  if (q.region && q.region !== "All") data = data.filter((c) => c.region === q.region);
  if (q.availability && q.availability !== "All") data = data.filter((c) => c.availability === q.availability);
  if (q.budget) {
    const bands = {
      under250: (n) => n < 250000,
      mid: (n) => n >= 250000 && n < 750000,
      high: (n) => n >= 750000 && n < 1500000,
      ultra: (n) => n >= 1500000,
    };
    const band = bands[q.budget];
    if (band) data = data.filter((c) => band(c.startingPrice || 0));
  }
  if (q.minPrice) data = data.filter((c) => c.startingPrice >= Number(q.minPrice));
  if (q.maxPrice) data = data.filter((c) => c.startingPrice <= Number(q.maxPrice));
  return res.json({ total: data.length, data });
});

app.get("/api/discover", async (req, res, next) => {
  try { return res.json(await discover(req.query || {})); }
  catch (err) { next(err); }
});

app.get("/api/celebrities/featured", async (_req, res, next) => {
  try {
    const metrics = await counts();
    const home = await getContent("home");
    return res.json({
      data: await featuredTalents(),
      home,
      metrics: {
        verifiedCelebrities: metrics.publicTalents,
        openTalents: metrics.openTalents,
        openCases: metrics.openCases,
        openCrowdEvents: metrics.openCrowdEvents,
        averageOpening: metrics.averageOpening,
      },
    });
  } catch (err) { next(err); }
});

app.get("/api/portfolio/summary", auth, adminOnly, async (_req, res, next) => {
  try {
    const metrics = await counts();
    const talents = await listTalentsAdmin();
    const cats = [...new Set(talents.map((c) => c.category))];
    const categoryBreakdown = cats.map((cat) => {
      const group = talents.filter((c) => c.category === cat && c.visibility !== "hidden");
      const quotes = db.bookings.filter((b) => group.some((g) => g.id === b.celebrityId));
      const sum = quotes.reduce((s, b) => s + (b.pricing?.finalQuote || 0), 0);
      return {
        category: cat,
        celebs: group.length,
        avgDealSize: quotes.length ? Math.round(sum / quotes.length) : 0,
        annualVolume: sum,
        shareOfPortfolio: talents.length ? Math.round((group.length / talents.length) * 100) : 0,
      };
    });
    return res.json({
      agencyName: "All Talents Agency",
      totalManagedPortfolio: metrics.quotedPipeline,
      ytdRevenue: metrics.quotedPipeline,
      activeContracts: metrics.openCases,
      escrowHeld: 0,
      totalRoster: metrics.publicTalents,
      avgDealSize: metrics.averageOpening,
      categoryBreakdown,
      revenueTimeline: [],
      topEarners: (await featuredTalents()).map((c) => ({
        id: c.id, name: c.name, category: c.category, region: c.region, annualRevenue: c.startingPrice,
      })),
    });
  } catch (err) { next(err); }
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
  const available = days >= 0 && c.availability !== "Waitlist";
  return res.json({
    celebrityId: c.id,
    celebrityName: c.name,
    date,
    available,
    reason: available
      ? "Open on the published roster. A reservation is still a request, not a confirmed date."
      : "This talent is not open for a new date.",
  });
});

app.get("/api/intelligence/market-pulse", async (_req, res, next) => {
  try {
    const metrics = await counts();
    const top = [...db.celebrities].slice(0, 5).map((c) => ({
      id: c.id, name: c.name, category: c.category, region: c.region, availability: c.availability,
    }));
    return res.json({
      timestamp: new Date().toISOString(),
      metrics: {
        publicTalents: metrics.publicTalents,
        openTalents: metrics.openTalents,
        averageOpening: metrics.averageOpening,
        waitlistTalents: metrics.waitlistTalents,
        openCases: metrics.openCases,
        openCrowdEvents: metrics.openCrowdEvents,
      },
      top,
    });
  } catch (err) { next(err); }
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
  return res.json({
    id: c.id,
    availability: c.availability,
    visibility: c.visibility,
    heatLevel: "none",
    urgencyMessage: c.visibility === "waitlist"
      ? "Waitlist. A reservation request is the open path."
      : `${c.availability} on the published roster.`,
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

app.post("/api/waitlist/reserve", auth, async (req, res, next) => {
  try {
    const booking = await createCase({
      pathway: "reservation",
      talentId: req.body?.celebrityId,
      clientName: req.user.name,
      clientEmail: req.user.email,
      eventType: "Reservation",
      date: req.body?.date,
      location: req.body?.location,
      budgetBand: req.body?.budgetBand,
    }, req.user);
    return res.status(201).json({
      reservationCode: booking.contractId,
      caseId: booking.id,
      celebrity: { id: booking.celebrityId, name: booking.celebrityName },
      status: booking.status,
      message: `Reservation request for ${booking.celebrityName} is with the desk.`,
    });
  } catch (err) { next(err); }
});

app.get("/api/intelligence/ticker", (_req, res) => {
  const events = db.bookings.slice(0, 8).map((b) => ({
    id: b.id,
    name: b.celebrityName || "Unassigned",
    event: b.pathway,
    change: b.status,
    positive: b.status !== "Declined" && b.status !== "Cancelled",
  }));
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

  const meeting = getMeetingPlaybookForCelebrity(c);
  return res.json({
    celebrity: { id: c.id, name: c.name, category: c.category, region: c.region, portrait: c.portrait },
    dossier: {
      meetingHeadline: meeting.meetingHeadline,
      meetingSteps: meeting.meetingSteps,
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
    .map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      region: c.region,
      startingPrice: c.startingPrice,
      availability: c.availability,
    }));

  if (!compared.length) return res.status(404).json({ error: "No valid celebrities found" });
  return res.json({ compared });
});

app.post("/api/messages/send", auth, async (req, res, next) => {
  const { celebrityId, body, priority = "Priority" } = req.body || {};
  if (rejectUnsafeFields(res, [celebrityId, body, priority])) return;
  if (!isValidCelebrityId(celebrityId)) return res.status(400).json({ error: "Invalid celebrity id format" });
  const c = db.celebrities.find((x) => x.id === celebrityId);
  if (!c) return res.status(404).json({ error: "Celebrity not found" });
  try {
    await createCase({
      pathway: "private",
      talentId: c.id,
      clientName: req.user.name,
      clientEmail: req.user.email,
      eventType: "Desk note",
      message: body,
    }, req.user);
    const ack = {
      id: uuid(),
      from: "Representation Desk",
      toUserId: req.user.id,
      body: `Request received for ${c.name}. The desk will reply in your case, not in this chat.`,
      timestamp: new Date().toISOString(),
    };
    await addMessage({ id: uuid(), from: sanitizeText(req.user.name), toUserId: "u3", body: sanitizeText(body) });
    await addMessage({ ...ack, body: sanitizeText(ack.body) });
    return res.status(201).json({ ok: true, acknowledgement: ack });
  } catch (err) { next(err); }
});

app.post("/api/cases", rateLimit, optionalAuth, async (req, res, next) => {
  const body = req.body || {};
  const fields = [body.clientName, body.clientEmail, body.talentId, body.eventType, body.date, body.location, body.message, body.settlementNote, body.talentName];
  if (rejectUnsafeFields(res, fields)) return;
  try {
    const booking = await createCase({
      ...body,
      clientName: sanitizeText(body.clientName),
      clientEmail: String(body.clientEmail || "").trim(),
      eventType: sanitizeText(body.eventType),
      location: sanitizeText(body.location),
      message: sanitizeText(body.message || body.rider),
      settlementNote: sanitizeText(body.settlementNote),
      talentName: sanitizeText(body.talentName),
    }, req.user || null);
    return res.status(201).json({ booking, case: booking });
  } catch (err) { next(err); }
});

app.get("/api/cases/mine", auth, async (req, res, next) => {
  try { return res.json({ data: await listCases({ userId: req.user.id, email: req.user.email }) }); }
  catch (err) { next(err); }
});

app.get("/api/experiences", async (req, res, next) => {
  try {
    const { listExperiences } = await import("./store.js");
    const data = await listExperiences({ talentId: req.query.talentId, pathway: req.query.pathway });
    return res.json({ data });
  } catch (err) { next(err); }
});

app.post("/api/bookings/initiate", auth, async (req, res, next) => {
  const { celebrityId, eventType, date, location, securityLevel, riderRequirements, pathway = "private" } = req.body || {};
  if (rejectUnsafeFields(res, [celebrityId, eventType, date, location, securityLevel, riderRequirements])) return;
  try {
    const booking = await createCase({
      pathway: ["private", "vacation", "full_coverage", "reservation"].includes(pathway) ? pathway : "private",
      talentId: celebrityId,
      clientName: req.user.name,
      clientEmail: req.user.email,
      eventType, date, location, securityLevel,
      rider: riderRequirements,
      experienceId: req.body?.experienceId,
      budgetBand: req.body?.budgetBand,
      settlementNote: req.body?.settlementNote,
    }, req.user);
    return res.status(201).json({ booking });
  } catch (err) { next(err); }
});

app.get("/api/shortlist", auth, async (req, res, next) => {
  try { return res.json({ ids: await getShortlist(req.user.id) }); }
  catch (err) { next(err); }
});

app.post("/api/shortlist", auth, async (req, res, next) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ error: "ids array required" });
  try {
    const clean = ids.filter((id) => isValidCelebrityId(id)).slice(0, 5);
    return res.json({ ids: await setShortlist(req.user.id, clean) });
  } catch (err) { next(err); }
});

app.post("/api/events", (req, res) => {
  const { name, detail } = req.body || {};
  if (name) console.log(`[ATA event] ${name}`, detail || "");
  return res.json({ ok: true });
});

app.get("/api/portal/overview", auth, async (req, res, next) => {
  try {
    const bookings = await listCases({ userId: req.user.id, email: req.user.email });
    const messages = db.messages.filter((m) => m.toUserId === req.user.id);
    const crowdSlots = bookings.filter((b) => b.pathway === "crowd");
    return res.json({
      membershipTier: req.user.role === "admin" ? "Desk" : "Client",
      bookings: bookings.filter((b) => b.pathway !== "crowd"),
      crowdSlots,
      contracts: bookings.map((b) => ({ id: b.contractId, title: `${b.celebrityName || "Request"} · ${b.pathway}`, signed: b.status === "Confirmed", status: b.status })),
      payments: [],
      messages,
    });
  } catch (err) { next(err); }
});

app.get("/api/crowd-events", async (_req, res, next) => {
  try {
    const data = await listCrowd();
    return res.json({ total: data.length, data });
  } catch (err) { next(err); }
});

app.get("/api/crowd-events/:id", async (req, res, next) => {
  try {
    const ev = await getCrowd(req.params.id);
    if (!ev || ev.published === false) return res.status(404).json({ error: "Event not found" });
    return res.json(ev);
  } catch (err) { next(err); }
});

app.post("/api/crowd-events/:id/join", rateLimit, optionalAuth, async (req, res, next) => {
  const { clientName, clientEmail, plan } = req.body || {};
  if (rejectUnsafeFields(res, [clientName, clientEmail, plan])) return;
  try {
    const booking = await createCase({
      pathway: "crowd",
      eventId: req.params.id,
      clientName: clientName || req.user?.name,
      clientEmail: clientEmail || req.user?.email,
      budgetBand: plan || "full",
      settlementNote: "Settlement is arranged with the desk. This request does not charge a card.",
    }, req.user || null);
    return res.status(201).json({
      booking,
      message: `Request received for ${booking.eventType}. Your reference is ${booking.details?.slotCode || booking.contractId}.`,
    });
  } catch (err) { next(err); }
});

app.post("/api/inquiry", rateLimit, optionalAuth, async (req, res, next) => {
  const { name, email, celebrity, eventType, date, message } = req.body || {};
  if (rejectUnsafeFields(res, [name, email, celebrity, eventType, date, message])) return;
  try {
    const booking = await createCase({
      pathway: "unlisted",
      talentName: celebrity,
      clientName: name,
      clientEmail: email,
      eventType,
      date,
      message,
    }, req.user || null);
    return res.json({
      success: true,
      id: booking.id,
      message: `Your request for ${celebrity} is case ${booking.contractId}. The desk will follow up by email.`,
    });
  } catch (err) { next(err); }
});

app.use("/api/admin", auth, adminOnly, adminRouter);

app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.status && err.message) return res.status(err.status).json({ error: err.message });
  console.error("[ATA API Error]", err.message);
  res.status(500).json({ error: "An unexpected error occurred. Please try again." });
});

onAdminEvent((type, payload = {}) => {
  if (type === "CASE_OPENED") emitAdminEvent("NEW_BOOKING", { celebrity: payload.talent });
  else if (type === "CASE_STATUS") emitAdminEvent(payload.status === "Cancelled" ? "BOOKING_CANCELLED" : "BOOKING_STATUS_UPDATED", { stage: payload.status });
  else emitAdminEvent(type, payload);
});

if (!process.env.VERCEL) {
  initDb().then(async () => {
    const talents = await listTalentsAdmin();
    writeSitemap(talents);
    app.listen(PORT, () => {
      console.log(`[ATA] Services API online — port ${PORT}`);
    });
  }).catch((err) => {
    console.error("[ATA] database failed", err);
    process.exit(1);
  });
}

export default app;
