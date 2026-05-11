/**
 * PGlite adapter — runs a full PostgreSQL engine in-process via WASM.
 * No system PostgreSQL installation required.
 * Data is persisted to ./data/pglite on disk.
 */
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data', 'pglite');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let _db: PGlite | null = null;

export async function getPGlite(): Promise<PGlite> {
  if (!_db) {
    console.log('🐘 Starting embedded PostgreSQL (PGlite)...');
    _db = new PGlite(DATA_DIR);
    await _db.waitReady;
    console.log('✅ Embedded PostgreSQL ready');
  }
  return _db;
}

export async function closePGlite(): Promise<void> {
  if (_db) {
    await _db.close();
    _db = null;
  }
}
