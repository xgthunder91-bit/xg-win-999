/**
 * Turso connection test — apne aap se check karta hai ki token + URL sahi hain ya nahi.
 * Chalane ke liye:  node scripts/test-turso.mjs
 * (pehle TURSO_DATABASE_URL aur TURSO_AUTH_TOKEN env variables set karo)
 */
const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url || !token) {
  console.log('FAIL: TURSO_DATABASE_URL / TURSO_AUTH_TOKEN set nahi hai');
  process.exit(1);
}

function show(v, n = 26) {
  return String(v).slice(0, n) + (String(v).length > n ? '...' : '');
}

async function main() {
  const { createClient } = await import('@libsql/client');
  console.log('URL   :', show(url, 70));
  console.log('Token :', show(token));
  console.log('');

  const db = createClient({ url, authToken: token });

  await db.execute(
    'CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT)'
  );
  console.log('OK  table ready');

  const probe = { users: [], transactions: [], deposits: [], withdrawals: [], __probe: true };
  await db.execute({
    sql: 'INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at',
    args: [JSON.stringify(probe), new Date().toISOString()],
  });
  console.log('OK  write');

  const res = await db.execute('SELECT updated_at FROM app_state WHERE id = 1');
  console.log('OK  read    updated_at =', res.rows[0] && res.rows[0].updated_at);

  await db.execute('DELETE FROM app_state WHERE id = 1');
  console.log('OK  cleanup (test row removed)');
  console.log('');
  console.log('===================================');
  console.log('  PASS — Turso database connected!');
  console.log('===================================');
}

main().catch((e) => {
  console.log('');
  console.log('===================================');
  console.log('  FAIL —', String(e.message).split('\n')[0]);
  console.log('===================================');
  console.log('');
  console.log('Agar "401 / Unauthorized" aaya hai to:');
  console.log('  1. Naya token banao Turso dashboard me');
  console.log('  2. Group "All groups (organization-scoped)" chuno');
  console.log('  3. Poora token copy karo (kuch kat na ho)');
  process.exit(1);
});