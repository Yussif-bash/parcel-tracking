import { readdir, readFile } from "node:fs/promises";
import { pool } from "./db.ts";

const migrationsDir = new URL("../migrations/", import.meta.url);

await pool.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name       text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`);

const applied = new Set(
  (await pool.query<{ name: string }>("SELECT name FROM schema_migrations")).rows.map(
    (row) => row.name,
  ),
);

const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) continue;

  const sql = await readFile(new URL(file, migrationsDir), "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    await client.query("COMMIT");
    console.log(`applied ${file}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

console.log("migrations up to date");
await pool.end();