import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data', 'pg');

let mode = 'pglite';
let pool = null;
let lite = null;

export function dbMode() {
  return mode;
}

export async function connect() {
  if (process.env.DATABASE_URL) {
    const pg = await import('pg');
    pool = new pg.default.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'disable' ? false : { rejectUnauthorized: false },
    });
    mode = 'postgres';
    await pool.query('SELECT 1');
    return;
  }
  const { PGlite } = await import('@electric-sql/pglite');
  fs.mkdirSync(DATA_DIR, { recursive: true });
  lite = new PGlite(DATA_DIR);
  await lite.waitReady;
  mode = 'pglite';
}

export async function exec(sql) {
  if (pool) {
    await pool.query(sql);
    return;
  }
  await lite.exec(sql);
}

export async function query(text, params = []) {
  if (pool) {
    const result = await pool.query(text, params);
    return result.rows;
  }
  const result = await lite.query(text, params);
  return result.rows || [];
}

export async function close() {
  if (pool) await pool.end();
  if (lite) await lite.close();
}
