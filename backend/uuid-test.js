const { PGlite } = require('@electric-sql/pglite');
async function run() {
  const db = new PGlite();
  await db.waitReady;
  try {
    const r = await db.query("SELECT gen_random_uuid() as uuid");
    console.log('gen_random_uuid OK:', r.rows[0]);
  } catch(e) {
    console.log('gen_random_uuid failed:', e.message);
    // Try with pgcrypto
    try {
      await db.exec("CREATE EXTENSION IF NOT EXISTS pgcrypto");
      const r2 = await db.query("SELECT gen_random_uuid() as uuid");
      console.log('pgcrypto gen_random_uuid OK:', r2.rows[0]);
    } catch(e2) {
      console.log('pgcrypto also failed:', e2.message);
      // Use md5 based uuid
      const r3 = await db.query("SELECT md5(random()::text || clock_timestamp()::text)::uuid as uuid");
      console.log('md5 uuid OK:', r3.rows[0]);
    }
  }
  await db.close();
}
run().catch(console.error);
