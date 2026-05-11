const { PGlite } = require('@electric-sql/pglite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(process.cwd(), 'data', 'pglite-test');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

async function run() {
  const db = new PGlite(DATA_DIR);
  await db.waitReady;
  console.log('✅ PGlite engine ready (PostgreSQL 17 in WASM)');

  await db.exec('CREATE TABLE IF NOT EXISTS test_tbl (id SERIAL PRIMARY KEY, val TEXT)');
  await db.query("INSERT INTO test_tbl(val) VALUES($1)", ['hello uniconnect']);
  const r = await db.query('SELECT * FROM test_tbl');
  console.log('✅ Query result:', r.rows);

  await db.close();
  fs.rmSync(DATA_DIR, { recursive: true });
  console.log('✅ Smoke test PASSED — PGlite works perfectly');
}

run().catch(e => {
  console.error('❌ FAILED:', e.message);
  process.exit(1);
});
