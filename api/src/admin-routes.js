import express from 'express';
import { v4 as uuid } from 'uuid';
import {
  db, listCases, updateCaseStatus, cancelCase, listTalentsAdmin, updateTalent,
  listCategories, setCategoryPublished, listExperiences, upsertExperience,
  listCrowd, upsertCrowd, getContent, setContent, listAudit, counts, STATUSES,
} from './store.js';

const router = express.Router();
const sseClients = new Set();

export function emitAdminEvent(type, payload) {
  const data = JSON.stringify({ type, payload, at: new Date().toISOString() });
  for (const res of sseClients) {
    try { res.write(`data: ${data}\n\n`); } catch { sseClients.delete(res); }
  }
}

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', at: new Date().toISOString() })}\n\n`);
  sseClients.add(res);
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { clearInterval(heartbeat); }
  }, 20000);
  req.on('close', () => { sseClients.delete(res); clearInterval(heartbeat); });
});

router.get('/dashboard', async (_req, res, next) => {
  try {
    const metrics = await counts();
    const auditLogs = await listAudit(25);
    return res.json({ kpis: metrics, auditLogs });
  } catch (err) { next(err); }
});

router.get('/bookings', async (_req, res, next) => {
  try {
    const data = await listCases();
    return res.json({ data, total: data.length });
  } catch (err) { next(err); }
});

router.patch('/bookings/:id/status', async (req, res, next) => {
  try {
    const booking = await updateCaseStatus(req.params.id, req.body?.status || req.body?.stage, req.user.email);
    return res.json({ booking });
  } catch (err) { next(err); }
});

router.delete('/bookings/:id', async (req, res, next) => {
  try {
    await cancelCase(req.params.id, req.user.email);
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get('/talents', async (_req, res, next) => {
  try {
    const data = await listTalentsAdmin();
    return res.json({ data, total: data.length });
  } catch (err) { next(err); }
});

router.patch('/talents/:id', async (req, res, next) => {
  try {
    const talent = await updateTalent(req.params.id, req.body || {}, req.user.email);
    return res.json({ talent });
  } catch (err) { next(err); }
});

router.get('/categories', async (_req, res, next) => {
  try { return res.json({ data: await listCategories() }); }
  catch (err) { next(err); }
});

router.patch('/categories/:name', async (req, res, next) => {
  try {
    const row = await setCategoryPublished(decodeURIComponent(req.params.name), req.body?.published, req.user.email);
    return res.json({ category: row });
  } catch (err) { next(err); }
});

router.get('/experiences', async (req, res, next) => {
  try {
    const data = await listExperiences({
      talentId: req.query.talentId,
      pathway: req.query.pathway,
      includeUnpublished: true,
    });
    return res.json({ data: data.slice(0, 200), total: data.length });
  } catch (err) { next(err); }
});

router.post('/experiences', async (req, res, next) => {
  try { return res.status(201).json({ experience: await upsertExperience(req.body || {}, req.user.email) }); }
  catch (err) { next(err); }
});

router.get('/crowd-events', async (_req, res, next) => {
  try { return res.json({ data: await listCrowd({ includeUnpublished: true }) }); }
  catch (err) { next(err); }
});

router.post('/crowd-events', async (req, res, next) => {
  try { return res.status(201).json({ event: await upsertCrowd(req.body || {}, req.user.email) }); }
  catch (err) { next(err); }
});

router.get('/content', async (_req, res, next) => {
  try { return res.json({ home: await getContent('home') }); }
  catch (err) { next(err); }
});

router.put('/content/home', async (req, res, next) => {
  try { return res.json({ home: await setContent('home', req.body || {}, req.user.email) }); }
  catch (err) { next(err); }
});

router.get('/audit', async (_req, res, next) => {
  try { return res.json({ data: await listAudit(50) }); }
  catch (err) { next(err); }
});

router.get('/meta', (_req, res) => res.json({ statuses: STATUSES, users: db.users.map(({ passwordHash, ...u }) => u) }));

export default router;
