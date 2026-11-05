// Applies every migration to an in-memory Postgres (PGlite) with stand-ins for
// Supabase's auth and storage schemas, then runs a few sanity checks.
// Usage: npm run check:db
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';

const dir = 'supabase/migrations';
const db = new PGlite();

await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public bool);
  create table storage.objects (id serial, bucket_id text, name text);
  create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
`);

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  try {
    await db.exec(fs.readFileSync(path.join(dir, file), 'utf8'));
    console.log(`applied ${file}`);
  } catch (e) {
    console.error(`FAILED ${file}: ${e.message}`);
    process.exit(1);
  }
}

const uid = '00000000-0000-0000-0000-000000000001';
await db.exec(`
  insert into auth.users values ('${uid}');
  insert into nutrition_entries (user_id, day, calories, protein_g) values ('${uid}', '2026-11-05', 500, 40), ('${uid}', '2026-11-05', 700, 50);
  insert into daily_activity (user_id, day, steps, source) values ('${uid}', '2026-11-05', 9000, 'apple_health'), ('${uid}', '2026-11-05', 9500, 'manual');
`);

const fail = (msg) => { console.error(`CHECK FAILED: ${msg}`); process.exit(1); };
const profiles = await db.query('select count(*)::int as n from profiles');
if (profiles.rows[0].n !== 1) fail('sign-up trigger did not create a profile');
const summary = await db.query('select calories::float, steps from daily_summary');
if (summary.rows[0].calories !== 1200) fail(`daily_summary calories ${summary.rows[0].calories}, expected 1200`);
if (summary.rows[0].steps !== 9500) fail(`daily_summary steps ${summary.rows[0].steps}, expected 9500`);
console.log('all checks passed');
