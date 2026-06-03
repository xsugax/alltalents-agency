/**
 * Roster sync helper — run from aurelux-website-clean:
 *   node scripts/sync-roster.js
 * Keeps static celebrities-data.js aligned with API seeds (manual step until full codegen).
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = path.join(root, 'api', 'src', 'data.js');
const outPath = path.join(root, 'website', 'assets', 'celebrities-data.js');

const src = readFileSync(dataPath, 'utf8');
const count = (src.match(/\["c\d+"/g) || []).length;
console.log(`API roster entries (approx): ${count}`);
console.log('For full sync, export NAMED seeds from data.js into celebrities-data.js _seeds array.');
console.log(`Target: ${outPath}`);
