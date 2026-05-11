import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let _prisma: PrismaClient | null = null;

/**
 * In production (Render): standard PrismaClient using DATABASE_URL env var.
 * In local dev: PGlite embedded Postgres via TCP proxy (no system Postgres needed).
 */
export async function initialisePrisma(): Promise<PrismaClient> {
  if (_prisma) return _prisma;

  if (process.env.NODE_ENV === 'production') {
    // Production — use real Postgres via DATABASE_URL
    _prisma = new PrismaClient({
      log: ['error'],
    });
  } else {
    // Local dev — use PGlite embedded Postgres
    const { PGlite } = await import('@electric-sql/pglite');
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const { Pool } = await import('pg');
    const path = await import('path');
    const fs = await import('fs');
    const { applyMigrations } = await import('./migrate');
    const { startPGliteProxy, PROXY_PORT, PROXY_HOST } = await import('./pglite-proxy');

    const DATA_DIR = path.join(process.cwd(), 'data', 'pglite');
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    const db = new PGlite(DATA_DIR);
    await db.waitReady;
    await applyMigrations(db);
    await startPGliteProxy(db);

    const pool = new Pool({
      host: PROXY_HOST,
      port: PROXY_PORT,
      database: 'uniconnect',
      user: 'postgres',
      password: 'postgres',
      max: 1,
    });

    const adapter = new PrismaPg(pool);
    _prisma = new PrismaClient({
      adapter,
      log: ['error', 'warn'],
    });
  }

  global.prisma = _prisma;
  return _prisma;
}

// Lazy proxy — safe to import anywhere after initialisePrisma() is called
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
