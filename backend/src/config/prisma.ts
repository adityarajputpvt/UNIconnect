/**
 * Prisma client backed by PGlite (embedded PostgreSQL 17 in WASM).
 * Zero system dependencies — no PostgreSQL install required.
 *
 * Architecture:
 *   PGlite (WASM) ← TCP proxy (port 5433) ← pg.Pool ← PrismaPg adapter ← PrismaClient
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import { applyMigrations } from './migrate';
import { startPGliteProxy, PROXY_PORT, PROXY_HOST } from './pglite-proxy';

const DATA_DIR = path.join(process.cwd(), 'data', 'pglite');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let _pglite: PGlite | null = null;
let _prisma: PrismaClient | null = null;

export async function getPGlite(): Promise<PGlite> {
  if (!_pglite) {
    _pglite = new PGlite(DATA_DIR);
    await _pglite.waitReady;
  }
  return _pglite;
}

export async function initialisePrisma(): Promise<PrismaClient> {
  if (_prisma) return _prisma;

  // 1. Start embedded PostgreSQL
  const db = await getPGlite();

  // 2. Apply schema (idempotent)
  await applyMigrations(db);

  // 3. Start TCP proxy so pg.Pool can connect
  await startPGliteProxy(db);

  // 4. Create real pg.Pool pointing at the proxy
  const pool = new Pool({
    host: PROXY_HOST,
    port: PROXY_PORT,
    database: 'uniconnect',
    user: 'postgres',
    password: 'postgres',
    max: 1, // PGlite is single-connection
  });

  // 5. Wire up Prisma
  const adapter = new PrismaPg(pool);
  _prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  return _prisma;
}

// Lazy proxy — safe to import anywhere
const prismaProxy = new Proxy({} as PrismaClient, {
  get(_target, prop: string) {
    if (!_prisma) {
      throw new Error(`Prisma not ready. Call initialisePrisma() first. (prop: ${prop})`);
    }
    return (_prisma as unknown as Record<string, unknown>)[prop];
  },
});

export const prisma: PrismaClient = prismaProxy;
export default prisma;
