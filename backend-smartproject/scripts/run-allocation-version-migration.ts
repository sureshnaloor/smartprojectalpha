/**
 * Run the allocation_version migration using DATABASE_URL from env.
 * Use this when you can't run psql directly (e.g. you have the connection
 * string in production/env but not the password handy).
 *
 * From backend-smartproject: npx tsx scripts/run-allocation-version-migration.ts
 * Or with env: DATABASE_URL="postgresql://..." npx tsx scripts/run-allocation-version-migration.ts
 */
import "dotenv/config";
import pg from "pg";

const { Client } = pg;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Set it in .env or pass it when running.");
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    await client.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS allocation_version INTEGER;
    `);
    console.log("Migration applied: projects.allocation_version column added (if not exists).");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
