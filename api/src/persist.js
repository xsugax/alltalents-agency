import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, '..', 'data', 'store.json');

const DEFAULT = { bookings: [], messages: [], crowdBookings: [], shortlists: {} };

export function loadStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
      return { ...DEFAULT, ...raw };
    }
  } catch { /* fresh */ }
  return { ...DEFAULT };
}

export function saveStore(store) {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch (e) {
    console.warn('[persist] save failed:', e.message);
  }
}

export function mergePersisted(db, store) {
  if (store.bookings?.length) db.bookings = store.bookings;
  if (store.messages?.length) db.messages = store.messages;
  if (store.crowdBookings?.length) db.crowdBookings = store.crowdBookings;
  return store.shortlists || {};
}

export function snapshotDb(db, shortlists) {
  saveStore({
    bookings: db.bookings,
    messages: db.messages,
    crowdBookings: db.crowdBookings,
    shortlists,
  });
}
