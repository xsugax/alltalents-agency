/**
 * Download all roster portraits into website/assets/portraits/
 * Run: node scripts/fetch-all-portraits.js
 */
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORTRAITS_DIR = path.join(ROOT, 'website', 'assets', 'portraits');
const DATA_SCRIPT = path.join(ROOT, 'scripts', 'update-data-portraits.js');
const CELEB_DATA = path.join(ROOT, 'website', 'assets', 'celebrities-data.js');

const UA = 'CelebBookingApp/1.0 (https://alltalentsagency.com)';

/** Wikipedia titles for IDs not in PORTRAITS map (c120+) */
const WIKI_BY_ID = {
  c120: 'Lady_Gaga', c121: 'Jay-Z', c122: 'Justin_Bieber', c123: 'Kanye_West',
  c124: 'Eminem', c125: 'Madonna_(entertainer)', c126: 'Snoop_Dogg', c127: 'Brad_Pitt',
  c128: 'Angelina_Jolie', c129: 'Tom_Cruise', c130: 'Robert_Downey_Jr.',
  c131: 'Scarlett_Johansson', c132: 'Tom_Hanks', c133: 'Julia_Roberts',
  c134: 'Morgan_Freeman', c135: 'Meryl_Streep', c136: 'Sandra_Bullock',
  c137: 'Tiger_Woods', c138: 'Michael_Jordan', c139: 'Usain_Bolt', c140: 'Neymar',
  c141: 'Kylian_Mbapp%C3%A9', c142: 'Stephen_Curry', c143: 'Kevin_Durant',
  c144: 'Floyd_Mayweather_Jr.', c145: 'Conor_McGregor', c146: 'Anthony_Joshua',
  c147: 'Kylie_Jenner', c148: 'Kendall_Jenner', c149: 'Gigi_Hadid', c150: 'Bella_Hadid',
  c151: 'Naomi_Campbell', c152: 'Cara_Delevingne', c153: 'Heidi_Klum', c154: 'Tyra_Banks',
  c155: 'Paris_Hilton', c156: 'Hailey_Bieber', c157: 'Emily_Ratajkowski',
  c158: 'Chrissy_Teigen', c159: 'Winnie_Harlow', c160: 'Karlie_Kloss',
  c161: 'Oprah_Winfrey', c162: 'Tony_Robbins', c163: 'Gary_Vaynerchuk',
  c164: 'will.i.am', c165: 'Steve_Harvey', c166: 'Pitbull_(rapper)',
  c167: 'Enrique_Iglesias', c168: 'Marc_Anthony', c169: 'Alicia_Keys',
  c170: 'John_Legend', c171: 'Carlos_Santana', c172: 'Daddy_Yankee', c173: 'Luis_Fonsi',
  c174: 'Mariah_Carey',
  c175: 'RM_(rapper)', c176: 'Kim_Seok-jin', c177: 'Suga_(rapper)', c178: 'J-Hope',
  c179: 'Jimin', c180: 'V_(singer)', c181: 'Jungkook',
  c182: 'Kim_Jisoo', c183: 'Jennie_Kim', c184: 'Rosé_(entertainer)', c185: 'Lisa_(rapper)',
  c186: 'Bang_Chan', c187: 'Lee_Know', c188: 'Seo_Changbin', c189: 'Hwang_Hyunjin',
  c190: 'Han_(rapper)', c191: 'Lee_Felix', c192: 'Kim_Seungmin_(singer)', c193: 'Yang_Jeongin',
  c194: 'Lee_Min-ho_(actor)', c195: 'Kim_Soo-hyun_(actor)', c196: 'Hyun_Bin',
  c197: 'Park_Seo-joon', c198: 'IU_(singer)', c199: 'Song_Hye-kyo', c200: 'Bae_Suzy',
  c201: 'Ji_Chang-wook', c202: 'Nam_Joo-hyuk', c203: 'Psy_(entertainer)',
  c204: 'Harry_Styles', c205: 'Dua_Lipa', c206: 'Olivia_Rodrigo', c207: 'Doja_Cat',
  c208: 'SZA', c209: 'Kendrick_Lamar', c210: 'Lil_Baby', c211: 'Tyler,_the_Creator',
  c212: 'Lizzo', c213: 'Sam_Smith_(singer)', c214: 'Sabrina_Carpenter', c215: 'Charli_XCX',
  c216: 'Chappell_Roan', c217: '21_Savage', c218: 'Jack_Harlow', c219: 'Future_(rapper)',
  c220: 'Gunna_(rapper)', c221: 'Timothée_Chalamet', c222: 'Florence_Pugh',
  c223: 'Sydney_Sweeney', c224: 'Ana_de_Armas', c225: 'Pedro_Pascal', c226: 'Zoe_Saldana',
  c227: 'Chris_Evans_(actor)', c228: 'Jennifer_Aniston', c229: 'Coldplay',
  c230: 'Imagine_Dragons', c231: 'Maroon_5', c232: 'Red_Hot_Chili_Peppers',
  c233: 'Metallica', c234: 'Mia_Khalifa', c235: 'Lana_Rhoades', c236: 'Riley_Reid',
  c237: 'Brandi_Love', c238: 'Eva_Elfie', c239: 'Salma_Hayek', c240: 'Matt_Rife',
};

function loadPortraitUrls() {
  const src = fs.readFileSync(DATA_SCRIPT, 'utf8');
  const map = {};
  for (const m of src.matchAll(/\n\s+(c\d+):\s+'([^']+)',/g)) {
    map[m[1]] = m[2];
  }
  return map;
}

function loadExpectedFiles() {
  const src = fs.readFileSync(CELEB_DATA, 'utf8');
  const files = new Set();
  for (const m of src.matchAll(/\/assets\/portraits\/(c\d+\.(?:jpg|png))/g)) {
    files.add(m[1]);
  }
  return [...files];
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlink(dest, () => {});
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function getWikiThumb(wikiTitle) {
  return new Promise((resolve, reject) => {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`;
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.thumbnail?.source) {
            resolve(j.thumbnail.source.replace(/\/\d+px-/, '/400px-'));
          } else reject(new Error('no thumb'));
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  fs.mkdirSync(PORTRAITS_DIR, { recursive: true });
  const urls = loadPortraitUrls();
  const expected = loadExpectedFiles();
  let ok = 0, skip = 0, fail = 0;

  for (const filename of expected) {
    const dest = path.join(PORTRAITS_DIR, filename);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 8000) {
      skip++;
      continue;
    }
    const id = filename.replace(/\.(jpg|png)$/, '');
    let imgUrl = urls[id];
    if (!imgUrl) {
      const wiki = WIKI_BY_ID[id];
      if (!wiki) {
        console.log(`? ${filename} — no URL or wiki`);
        fail++;
        continue;
      }
      try {
        imgUrl = await getWikiThumb(wiki);
        await sleep(400);
      } catch (e) {
        console.log(`✗ ${filename} wiki: ${e.message}`);
        fail++;
        continue;
      }
    }
    try {
      process.stdout.write(`${filename}… `);
      await download(imgUrl, dest);
      const sz = fs.statSync(dest).size;
      if (sz < 3000) throw new Error(`too small (${sz}b)`);
      console.log(`✓ ${Math.round(sz / 1024)}KB`);
      ok++;
      await sleep(250);
    } catch (e) {
      try { fs.unlinkSync(dest); } catch (_) {}
      console.log(`✗ ${e.message}`);
      fail++;
    }
  }
  console.log(`\nDone: ${ok} downloaded, ${skip} skipped, ${fail} failed (${expected.length} total)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
