/** Fetch portrait thumbnails via Wikipedia REST API (avoids commons 429). */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'website', 'assets', 'portraits');

const TARGETS = [
  { id: 'c241', title: 'Colin_Farrell' },
  { id: 'c242', title: 'Ryan_Gosling' },
  { id: 'c243', title: 'Anne_Hathaway' },
];

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ATA-Portrait-Bot/1.0 (contact@alltalents.agency)' } }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, { headers: { 'User-Agent': 'ATA-Portrait-Bot/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    });
    req.on('error', reject);
  });
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const { id, title } of TARGETS) {
    const dest = path.join(OUT, `${id}.jpg`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 8000) {
      console.log(`✓ ${id} (cached)`);
      continue;
    }
    try {
      const summary = await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      const thumb = summary.thumbnail?.source;
      if (!thumb) throw new Error('No thumbnail');
      await download(thumb, dest);
      console.log(`✓ ${id} ← ${title} (${fs.statSync(dest).size} bytes)`);
    } catch (e) {
      console.log(`✗ ${id} — ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}

run().catch(console.error);
